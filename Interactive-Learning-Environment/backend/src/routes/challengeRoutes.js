const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const { authenticate } = require('../middleware/authMiddleware');

// Get all challenges for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const challenges = await Challenge.find({ course: req.params.courseId })
      .populate('createdBy', 'firstName lastName');
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single challenge
router.get('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create challenge (teacher/admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Only teachers can create challenges' });
    }

    const {
      title,
      description,
      course,
      difficulty,
      instructions,
      testCases,
      gamificationPoints
    } = req.body;

    const challenge = new Challenge({
      title,
      description,
      course,
      difficulty,
      instructions,
      testCases,
      gamificationPoints,
      createdBy: req.user.userId
    });

    await challenge.save();
    res.status(201).json({ message: 'Challenge created successfully', challenge });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
