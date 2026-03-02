const express = require('express');

const { authenticate } = require('../middleware/authMiddleware');
const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const { getRealtimeTutorResponse } = require('../services/realtimeTutorService');

const router = express.Router();

router.post('/tutor-assist', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can use the real-time tutor' });
    }

    const {
      challengeId,
      message,
      draftCode = '',
      language = 'javascript',
      history = [],
    } = req.body || {};

    if (!challengeId) {
      return res.status(400).json({ message: 'challengeId is required' });
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'message is required' });
    }

    const challenge = await Challenge.findById(challengeId)
      .select('title difficulty description instructions objectives hints expectedOutput');

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const latestSubmission = await Submission.findOne({
      student: req.user.userId,
      challenge: challengeId,
    })
      .sort({ submittedAt: -1 })
      .select('result');

    const aiResponse = await getRealtimeTutorResponse({
      challenge,
      message,
      draftCode,
      language,
      latestResult: latestSubmission?.result || null,
      history,
    });

    return res.json(aiResponse);
  } catch (error) {
    return res.status(500).json({
      message: 'AI tutor request failed',
      detail: error.message,
    });
  }
});

module.exports = router;
