const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Badge = require('../models/Badge');
const Progress = require('../models/Progress');

// Get all available badges
router.get('/', async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true });
    res.json(badges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student's earned badges
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  try {
    const progress = await Progress.find({ student: req.params.studentId });
    
    // Collect all badges from all courses
    const allBadges = progress.reduce((acc, prog) => {
      return acc.concat(prog.badges || []);
    }, []);

    res.json(allBadges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Award badge to student
router.post('/award', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers can award badges' });
    }

    const { studentId, courseId, badgeName, badgeDescription } = req.body;

    const progress = await Progress.findOne({
      student: studentId,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    // Check if badge already awarded
    const alreadyHasBadge = progress.badges.some(b => b.name === badgeName);
    if (alreadyHasBadge) {
      return res.status(400).json({ message: 'Badge already awarded' });
    }

    progress.badges.push({
      name: badgeName,
      description: badgeDescription,
      earnedAt: new Date()
    });

    await progress.save();
    res.json({ message: 'Badge awarded successfully', progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check and auto-award badges based on achievements
router.post('/check/:studentId/:courseId', authMiddleware, async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const progress = await Progress.findOne({
      student: studentId,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    const newBadges = [];

    // First Challenge Badge
    if (progress.completedChallenges.length === 1 && 
        !progress.badges.some(b => b.name === 'First Steps')) {
      progress.badges.push({
        name: 'First Steps',
        description: 'Completed your first challenge',
        earnedAt: new Date()
      });
      newBadges.push('First Steps');
    }

    // Challenge Master Badge (10 challenges)
    if (progress.completedChallenges.length >= 10 && 
        !progress.badges.some(b => b.name === 'Challenge Master')) {
      progress.badges.push({
        name: 'Challenge Master',
        description: 'Completed 10 challenges',
        earnedAt: new Date()
      });
      newBadges.push('Challenge Master');
    }

    // Point Collector Badge (100 points)
    if (progress.totalPoints >= 100 && 
        !progress.badges.some(b => b.name === 'Point Collector')) {
      progress.badges.push({
        name: 'Point Collector',
        description: 'Earned 100 points',
        earnedAt: new Date()
      });
      newBadges.push('Point Collector');
    }

    // Rising Star Badge (500 points)
    if (progress.totalPoints >= 500 && 
        !progress.badges.some(b => b.name === 'Rising Star')) {
      progress.badges.push({
        name: 'Rising Star',
        description: 'Earned 500 points',
        earnedAt: new Date()
      });
      newBadges.push('Rising Star');
    }

    if (newBadges.length > 0) {
      await progress.save();
    }

    res.json({ newBadges, progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
