const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const Submission = require('../models/Submission');

// Submit code
router.post('/', authenticate, async (req, res) => {
  try {
    const { challenge, course, code, language } = req.body;

    const submission = new Submission({
      student: req.user.userId,
      challenge,
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
