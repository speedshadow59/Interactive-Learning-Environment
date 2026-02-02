const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Progress = require('../models/Progress');

// Get student progress for a course
router.get('/student/:studentId/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      student: req.params.studentId,
      course: req.params.courseId
    }).populate('completedChallenges.challenge');

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update student progress
router.put('/student/:studentId/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const { challengeId, pointsEarned } = req.body;

    let progress = await Progress.findOne({
      student: req.params.studentId,
      course: req.params.courseId
    });

    if (!progress) {
      progress = new Progress({
        student: req.params.studentId,
        course: req.params.courseId
      });
    }

    // Add completed challenge if not already completed
    const alreadyCompleted = progress.completedChallenges.some(
      c => c.challenge.toString() === challengeId
    );

    if (!alreadyCompleted) {
      progress.completedChallenges.push({
        challenge: challengeId,
        completedAt: new Date(),
        pointsEarned: pointsEarned || 0
      });
      progress.totalPoints += pointsEarned || 0;
    }

    await progress.save();
    res.json({ message: 'Progress updated', progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
