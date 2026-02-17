const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const Progress = require('../models/Progress');

// Teacher dashboard
router.get('/teacher', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const courses = await Course.find({ instructor: req.user.userId })
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
      }))
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student analytics (for teacher)
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
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
