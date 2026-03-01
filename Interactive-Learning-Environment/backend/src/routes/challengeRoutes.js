const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const Course = require('../models/Course');
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

    if (!title || !description || !course) {
      return res.status(400).json({ message: 'title, description, and course are required' });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isInstructor = courseDoc.instructor?.toString() === req.user.userId;
    if (!isAdmin && !isInstructor) {
      return res.status(403).json({ message: 'You can only create challenges for your own courses' });
    }

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
    await Course.findByIdAndUpdate(courseDoc._id, {
      $addToSet: { challenges: challenge._id }
    });

    res.status(201).json({ message: 'Challenge created successfully', challenge });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update challenge (teacher/admin only, scoped to course ownership)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Only teachers can edit challenges' });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const courseDoc = await Course.findById(challenge.course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found for challenge' });
    }

    const isAdmin = req.user.role === 'admin';
    const isInstructor = courseDoc.instructor?.toString() === req.user.userId;
    if (!isAdmin && !isInstructor) {
      return res.status(403).json({ message: 'You can only edit challenges for your own courses' });
    }

    const updatableFields = [
      'title',
      'description',
      'difficulty',
      'instructions',
      'initialCode',
      'objectives',
      'hints',
      'expectedOutput',
      'gamificationPoints',
      'isBlockBased',
      'testCases',
      'isPublished',
    ];

    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        challenge[field] = req.body[field];
      }
    });

    if (!challenge.title || !challenge.description) {
      return res.status(400).json({ message: 'title and description are required' });
    }

    await challenge.save();
    return res.json({ message: 'Challenge updated successfully', challenge });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
