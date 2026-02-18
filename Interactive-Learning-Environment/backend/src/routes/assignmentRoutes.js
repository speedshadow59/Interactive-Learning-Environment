const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');

const isTeacherOrAdmin = (role) => role === 'teacher' || role === 'admin';

router.get('/teacher/options', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const courseFilter = isTeacherOrAdmin(req.user.role)
      ? {}
      : { instructor: req.user.userId };

    const courses = await Course.find(courseFilter)
      .populate('challenges', 'title')
      .populate('enrolledStudents', 'firstName lastName email');

    const data = courses.map((course) => ({
      id: course._id,
      title: course.title,
      challenges: course.challenges.map((challenge) => ({
        id: challenge._id,
        title: challenge.title,
      })),
      students: course.enrolledStudents.map((student) => ({
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
      })),
    }));

    return res.json({ courses: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, courseId, challengeId, dueDate, assignedTo } = req.body;

    if (!title || !description || !courseId || !challengeId || !dueDate) {
      return res.status(400).json({
        message: 'title, description, courseId, challengeId, and dueDate are required',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge || challenge.course.toString() !== course._id.toString()) {
      return res.status(400).json({ message: 'Challenge is invalid for this course' });
    }

    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) {
      return res.status(400).json({ message: 'Invalid dueDate format' });
    }

    const assignedStudents = Array.isArray(assignedTo) && assignedTo.length
      ? assignedTo.filter((studentId) =>
          course.enrolledStudents.some((enrolledId) => enrolledId.toString() === studentId)
        )
      : course.enrolledStudents.map((studentId) => studentId.toString());

    if (!assignedStudents.length) {
      return res.status(400).json({ message: 'No valid students available for this assignment' });
    }

    const assignment = await Assignment.create({
      title,
      description,
      course: course._id,
      challenge: challenge._id,
      teacher: req.user.userId,
      assignedTo: assignedStudents,
      dueDate: due,
      isPublished: true,
    });

    const populated = await Assignment.findById(assignment._id)
      .populate('course', 'title')
      .populate('challenge', 'title difficulty')
      .populate('assignedTo', 'firstName lastName email');

    return res.status(201).json({ message: 'Assignment created', assignment: populated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/teacher', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignmentFilter = isTeacherOrAdmin(req.user.role) ? {} : { teacher: req.user.userId };

    const assignments = await Assignment.find(assignmentFilter)
      .sort({ dueDate: 1 })
      .populate('course', 'title')
      .populate('challenge', 'title')
      .populate('assignedTo', 'firstName lastName email');

    const assignmentIds = assignments.map((assignment) => assignment._id);
    const submissions = assignmentIds.length
      ? await Submission.find(
          { assignment: { $in: assignmentIds } },
          'assignment student result submittedAt'
        )
      : [];

    const grouped = submissions.reduce((acc, submission) => {
      const key = submission.assignment?.toString();
      if (!key) return acc;

      if (!acc[key]) acc[key] = {};
      const studentKey = submission.student.toString();
      const existing = acc[key][studentKey];

      if (!existing || new Date(submission.submittedAt) > new Date(existing.submittedAt)) {
        acc[key][studentKey] = submission;
      }

      return acc;
    }, {});

    const now = new Date();
    const data = assignments.map((assignment) => {
      const studentSubmissions = grouped[assignment._id.toString()] || {};

      const studentStatuses = assignment.assignedTo.map((student) => {
        const latest = studentSubmissions[student._id.toString()];
        const hasPassed = latest?.result === 'passed';
        const submittedAt = latest?.submittedAt ? new Date(latest.submittedAt) : null;

        let status = 'pending';
        if (hasPassed && submittedAt && submittedAt > new Date(assignment.dueDate)) {
          status = 'completed_late';
        } else if (hasPassed) {
          status = 'completed';
        } else if (new Date(assignment.dueDate) < now) {
          status = 'missing';
        }

        return {
          studentId: student._id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          status,
          submittedAt: submittedAt || null,
        };
      });

      const assignedCount = assignment.assignedTo.length;
      const submittedCount = studentStatuses.filter(
        (student) => student.status === 'completed' || student.status === 'completed_late'
      ).length;
      const lateCount = studentStatuses.filter((student) => student.status === 'completed_late').length;
      const missingStudents = studentStatuses.filter((student) => student.status === 'missing');
      const pendingStudents = studentStatuses.filter((student) => student.status === 'pending');

      return {
        id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        courseTitle: assignment.course?.title || 'Course',
        challengeTitle: assignment.challenge?.title || 'Challenge',
        assignedCount,
        submittedCount,
        lateCount,
        missingCount: missingStudents.length,
        pendingStudentNames: pendingStudents.slice(0, 5).map((student) => student.name),
        missingStudentNames: missingStudents.slice(0, 5).map((student) => student.name),
        pendingCount: Math.max(assignedCount - submittedCount, 0),
        isOverdue: assignment.dueDate < now,
        studentStatuses,
      };
    });

    return res.json({ assignments: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/student', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignments = await Assignment.find({ assignedTo: req.user.userId, isPublished: true })
      .sort({ dueDate: 1 })
      .populate('course', 'title')
      .populate('challenge', 'title');

    const assignmentIds = assignments.map((assignment) => assignment._id);
    const submissions = assignmentIds.length
      ? await Submission.find(
          {
            assignment: { $in: assignmentIds },
            student: req.user.userId,
          },
          'assignment result submittedAt'
        )
      : [];

    const submissionMap = submissions.reduce((acc, submission) => {
      const key = submission.assignment?.toString();
      if (!key) return acc;
      const existing = acc[key];
      if (!existing || new Date(submission.submittedAt) > new Date(existing.submittedAt)) {
        acc[key] = submission;
      }
      return acc;
    }, {});

    const now = new Date();
    const data = assignments.map((assignment) => {
      const latest = submissionMap[assignment._id.toString()];
      const isCompleted = latest?.result === 'passed';
      return {
        id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        courseTitle: assignment.course?.title || 'Course',
        challengeTitle: assignment.challenge?.title || 'Challenge',
        status: isCompleted ? 'completed' : assignment.dueDate < now ? 'overdue' : 'pending',
      };
    });

    return res.json({ assignments: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;