const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const Progress = require('../models/Progress');
const Assignment = require('../models/Assignment');

const isTeacherOrAdmin = (role) => role === 'teacher' || role === 'admin';

const escapeCsv = (value) => {
  const safeValue = value === null || value === undefined ? '' : String(value);
  return `"${safeValue.replace(/"/g, '""')}"`;
};

const buildTeacherAnalytics = async (teacherId, role) => {
  const courseFilter = isTeacherOrAdmin(role) ? {} : { instructor: teacherId };
  const courses = await Course.find(courseFilter)
    .populate('enrolledStudents', 'firstName lastName email');

  const courseIds = courses.map((course) => course._id);

  const submissions = courseIds.length
    ? await Submission.find({ course: { $in: courseIds } }, 'course result submittedAt')
    : [];

  const progressRows = courseIds.length
    ? await Progress.find({ course: { $in: courseIds } }, 'course totalPoints completedChallenges')
    : [];

  const assignments = isTeacherOrAdmin(role)
    ? await Assignment.find({}).populate('course', 'title')
    : await Assignment.find({ teacher: teacherId }).populate('course', 'title');

  const uniqueStudentIds = new Set();
  courses.forEach((course) => {
    course.enrolledStudents.forEach((student) => uniqueStudentIds.add(student._id.toString()));
  });

  const courseCompletionMap = progressRows.reduce((acc, row) => {
    const key = row.course.toString();
    if (!acc[key]) {
      acc[key] = { learners: 0, totalPoints: 0, completedChallenges: 0 };
    }
    acc[key].learners += 1;
    acc[key].totalPoints += row.totalPoints || 0;
    acc[key].completedChallenges += row.completedChallenges?.length || 0;
    return acc;
  }, {});

  const submissionMap = submissions.reduce((acc, submission) => {
    const key = submission.course.toString();
    if (!acc[key]) {
      acc[key] = { total: 0, passed: 0 };
    }
    acc[key].total += 1;
    if (submission.result === 'passed') {
      acc[key].passed += 1;
    }
    return acc;
  }, {});

  const now = new Date();
  const overdueAssignments = assignments.filter((assignment) => assignment.dueDate < now).length;

  const courseBreakdown = courses.map((course) => {
    const courseId = course._id.toString();
    const completion = courseCompletionMap[courseId] || {
      learners: 0,
      totalPoints: 0,
      completedChallenges: 0,
    };
    const submission = submissionMap[courseId] || { total: 0, passed: 0 };

    const avgPoints = completion.learners > 0
      ? Math.round(completion.totalPoints / completion.learners)
      : 0;

    const passRate = submission.total > 0
      ? Math.round((submission.passed / submission.total) * 100)
      : 0;

    return {
      id: course._id,
      title: course.title,
      enrolledCount: course.enrolledStudents.length,
      totalSubmissions: submission.total,
      passRate,
      averagePoints: avgPoints,
      completedChallenges: completion.completedChallenges,
      isPublished: course.isPublished,
    };
  });

  const totalSubmissions = submissions.length;
  const passedSubmissions = submissions.filter((submission) => submission.result === 'passed').length;

  return {
    summary: {
      totalCourses: courses.length,
      totalStudents: uniqueStudentIds.size,
      totalAssignments: assignments.length,
      overdueAssignments,
      totalSubmissions,
      passRate: totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0,
    },
    courseBreakdown,
  };
};

// Teacher dashboard
router.get('/teacher', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const courseFilter = isTeacherOrAdmin(req.user.role) ? {} : { instructor: req.user.userId };
    const courses = await Course.find(courseFilter)
      .populate('enrolledStudents');

    const dashboardData = {
      totalCourses: courses.length,
      totalStudents: courses.reduce((sum, c) => sum + c.enrolledStudents.length, 0),
      courses: courses.map(course => ({
        id: course._id,
        title: course.title,
        enrolledCount: course.enrolledStudents.length,
        targetGrades: course.targetGrades,
        difficulty: course.difficulty,
        isPublished: course.isPublished,
        createdAt: course.createdAt
      }))
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher analytics summary
router.get('/teacher/analytics', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const analytics = await buildTeacherAnalytics(req.user.userId, req.user.role);
    return res.json(analytics);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Teacher analytics CSV export
router.get('/teacher/export.csv', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const analytics = await buildTeacherAnalytics(req.user.userId, req.user.role);
    const rows = [
      [
        'Course Title',
        'Students Enrolled',
        'Submissions',
        'Pass Rate (%)',
        'Average Points',
        'Completed Challenges',
        'Published',
      ],
      ...analytics.courseBreakdown.map((course) => [
        course.title,
        course.enrolledCount,
        course.totalSubmissions,
        course.passRate,
        course.averagePoints,
        course.completedChallenges,
        course.isPublished ? 'Yes' : 'No',
      ]),
      [],
      ['Summary', '', '', '', '', '', ''],
      ['Total Courses', analytics.summary.totalCourses, '', '', '', '', ''],
      ['Total Students', analytics.summary.totalStudents, '', '', '', '', ''],
      ['Total Assignments', analytics.summary.totalAssignments, '', '', '', '', ''],
      ['Overdue Assignments', analytics.summary.overdueAssignments, '', '', '', '', ''],
      ['Overall Pass Rate (%)', analytics.summary.passRate, '', '', '', '', ''],
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const fileName = `teacher-analytics-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Student dashboard
router.get('/student', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.user.userId);
    const enrolledCourses = await Course.find({
      enrolledStudents: req.user.userId
    });

    const progressData = await Progress.find({
      student: req.user.userId
    });

    const assignments = await Assignment.find({
      assignedTo: req.user.userId,
      isPublished: true,
    })
      .sort({ dueDate: 1 })
      .populate('course', 'title')
      .populate('challenge', 'title');

    const assignmentIds = assignments.map((assignment) => assignment._id);
    const assignmentSubmissions = assignmentIds.length
      ? await Submission.find(
          {
            assignment: { $in: assignmentIds },
            student: req.user.userId,
          },
          'assignment result submittedAt'
        )
      : [];

    const latestByAssignment = assignmentSubmissions.reduce((acc, submission) => {
      const key = submission.assignment?.toString();
      if (!key) return acc;
      const existing = acc[key];
      if (!existing || new Date(submission.submittedAt) > new Date(existing.submittedAt)) {
        acc[key] = submission;
      }
      return acc;
    }, {});

    const now = new Date();
    const assignmentSummary = assignments.map((assignment) => {
      const latest = latestByAssignment[assignment._id.toString()];
      const passed = latest?.result === 'passed';
      const submittedAt = latest?.submittedAt ? new Date(latest.submittedAt) : null;

      let status = 'pending';
      if (passed && submittedAt && submittedAt > new Date(assignment.dueDate)) {
        status = 'completed_late';
      } else if (passed) {
        status = 'completed';
      } else if (new Date(assignment.dueDate) < now) {
        status = 'overdue';
      }

      return {
        id: assignment._id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        courseTitle: assignment.course?.title || 'Course',
        challengeTitle: assignment.challenge?.title || 'Challenge',
        status,
      };
    });

    const progressCourseIds = [...new Set(progressData.map(p => p.course.toString()))];
    const progressCourses = progressCourseIds.length
      ? await Course.find({ _id: { $in: progressCourseIds } }, 'title')
      : [];
    const progressCourseMap = new Map(
      progressCourses.map(course => [course._id.toString(), course.title])
    );

    const dashboardData = {
      user: user.toJSON(),
      enrolledCourses: enrolledCourses.map(c => ({
        id: c._id,
        title: c.title
      })),
      totalPoints: progressData.reduce((sum, p) => sum + p.totalPoints, 0),
      progressByCourse: progressData.map(p => ({
        courseId: p.course,
        courseTitle: progressCourseMap.get(p.course.toString()) || 'Course',
        completedChallenges: p.completedChallenges.length,
        totalPoints: p.totalPoints
      })),
      assignments: assignmentSummary
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student analytics (for teacher)
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await User.findById(req.params.studentId);
    const submissions = await Submission.find({
      student: req.params.studentId
    }).populate('challenge course');

    const progressData = await Progress.find({
      student: req.params.studentId
    });

    const analytics = {
      student: student.toJSON(),
      totalSubmissions: submissions.length,
      passedSubmissions: submissions.filter(s => s.result === 'passed').length,
      averageScore: submissions.length > 0
        ? submissions.reduce((sum, s) => sum + (s.testsPassed / s.totalTests || 0), 0) / submissions.length * 100
        : 0,
      progress: progressData
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
