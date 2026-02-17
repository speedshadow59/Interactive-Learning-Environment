const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const Course = require('../models/Course');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { difficulty, targetGrade } = req.query;
    const filter = { isPublished: true };
    
    if (difficulty) filter.difficulty = difficulty;
    if (targetGrade) filter.targetGrades = { $in: [parseInt(targetGrade)] };
    
    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName')
      .populate('challenges');
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor')
      .populate('challenges');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create course (teacher/admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Only teachers can create courses' });
    }

    const { title, description, targetGrades, difficulty, topics, isPublished } = req.body;
    const course = new Course({
      title,
      description,
      targetGrades,
      difficulty,
      topics,
      instructor: req.user.userId,
      isPublished: Boolean(isPublished)
    });

    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enroll student in course
router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can enroll' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.enrolledStudents.includes(req.user.userId)) {
      course.enrolledStudents.push(req.user.userId);
      await course.save();
    }

    res.json({ message: 'Enrolled successfully', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
