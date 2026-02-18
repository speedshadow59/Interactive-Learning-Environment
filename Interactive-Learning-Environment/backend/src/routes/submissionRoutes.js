const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Challenge = require('../models/Challenge');
const Progress = require('../models/Progress');

const isTeacherOrAdmin = (role) => role === 'teacher' || role === 'admin';

const awardProgressBadges = async (progress) => {
  const newBadges = [];

  if (progress.completedChallenges.length === 1 && !progress.badges.some((badge) => badge.name === 'First Steps')) {
    progress.badges.push({
      name: 'First Steps',
      description: 'Completed your first challenge',
      earnedAt: new Date(),
    });
    newBadges.push('First Steps');
  }

  if (progress.completedChallenges.length >= 10 && !progress.badges.some((badge) => badge.name === 'Challenge Master')) {
    progress.badges.push({
      name: 'Challenge Master',
      description: 'Completed 10 challenges',
      earnedAt: new Date(),
    });
    newBadges.push('Challenge Master');
  }

  if (progress.totalPoints >= 100 && !progress.badges.some((badge) => badge.name === 'Point Collector')) {
    progress.badges.push({
      name: 'Point Collector',
      description: 'Earned 100 points',
      earnedAt: new Date(),
    });
    newBadges.push('Point Collector');
  }

  if (progress.totalPoints >= 500 && !progress.badges.some((badge) => badge.name === 'Rising Star')) {
    progress.badges.push({
      name: 'Rising Star',
      description: 'Earned 500 points',
      earnedAt: new Date(),
    });
    newBadges.push('Rising Star');
  }

  return newBadges;
};

// Submit code
router.post('/', authenticate, async (req, res) => {
  try {
    const { challenge, course, code, language, assignmentId } = req.body;

    const submission = new Submission({
      student: req.user.userId,
      challenge,
      assignment: assignmentId || null,
      course,
      code,
      language: language || 'javascript',
      result: 'pending'
    });

    await submission.save();
    // TODO: Execute code and test against test cases
    
    res.status(201).json({ message: 'Submission received', submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student submissions
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.params.studentId })
      .populate('challenge')
      .populate('course');
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get submissions for a course (teacher/admin)
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const submissions = await Submission.find({ course: req.params.courseId })
      .populate('student', 'firstName lastName email')
      .populate('challenge', 'title difficulty')
      .sort({ submittedAt: -1 });

    return res.json({ submissions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Add/update teacher feedback on submission
router.patch('/:id/feedback', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { feedback } = req.body;
    if (!feedback || typeof feedback !== 'string') {
      return res.status(400).json({ message: 'feedback is required' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const course = await Course.findById(submission.course);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    submission.feedback = feedback.trim();
    await submission.save();

    return res.json({ message: 'Feedback saved', submission });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Mark submission as passed/failed and sync progress/badges
router.patch('/:id/mark', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { result, pointsEarned, feedback } = req.body;
    if (!['passed', 'failed', 'pending'].includes(result)) {
      return res.status(400).json({ message: 'result must be one of: passed, failed, pending' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const challenge = await Challenge.findById(submission.challenge);
    const awardedPoints = Number.isFinite(Number(pointsEarned))
      ? Math.max(0, Number(pointsEarned))
      : challenge?.gamificationPoints || submission.pointsEarned || 0;

    submission.result = result;
    submission.completedAt = result === 'passed' ? new Date() : null;
    submission.pointsEarned = result === 'passed' ? awardedPoints : 0;
    if (typeof feedback === 'string') {
      submission.feedback = feedback.trim();
    }
    await submission.save();

    let progress = await Progress.findOne({
      student: submission.student,
      course: submission.course,
    });

    if (!progress) {
      progress = new Progress({
        student: submission.student,
        course: submission.course,
      });
    }

    const challengeId = submission.challenge.toString();
    const existingIndex = progress.completedChallenges.findIndex(
      (item) => item.challenge?.toString() === challengeId
    );

    if (result === 'passed') {
      if (existingIndex === -1) {
        progress.completedChallenges.push({
          challenge: submission.challenge,
          completedAt: submission.completedAt || new Date(),
          pointsEarned: awardedPoints,
        });
        progress.totalPoints += awardedPoints;
      } else {
        const previousPoints = progress.completedChallenges[existingIndex].pointsEarned || 0;
        progress.completedChallenges[existingIndex].completedAt = submission.completedAt || new Date();
        progress.completedChallenges[existingIndex].pointsEarned = awardedPoints;
        progress.totalPoints += awardedPoints - previousPoints;
      }
      progress.lastActivityAt = new Date();
      const newBadges = await awardProgressBadges(progress);
      await progress.save();

      return res.json({
        message: 'Submission marked as passed',
        submission,
        progress,
        newBadges,
      });
    }

    if (existingIndex !== -1 && result !== 'passed') {
      const removedPoints = progress.completedChallenges[existingIndex].pointsEarned || 0;
      progress.completedChallenges.splice(existingIndex, 1);
      progress.totalPoints = Math.max(0, progress.totalPoints - removedPoints);
    }

    progress.lastActivityAt = new Date();
    await progress.save();

    return res.json({ message: `Submission marked as ${result}`, submission, progress, newBadges: [] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get submission by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student')
      .populate('challenge')
      .populate('course');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
