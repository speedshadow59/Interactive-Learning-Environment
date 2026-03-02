const express = require('express');

const { authenticate } = require('../middleware/authMiddleware');
const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const { getRealtimeTutorResponse } = require('../services/realtimeTutorService');

const router = express.Router();

const DAILY_TUTOR_LIMIT = Number(process.env.AI_TUTOR_DAILY_LIMIT || 40);
const TUTOR_COOLDOWN_MS = Number(process.env.AI_TUTOR_COOLDOWN_MS || 2000);
const tutorUsageByStudent = new Map();

const buildUsagePayload = (count, cooldownMs = undefined) => ({
  remainingToday: Math.max(DAILY_TUTOR_LIMIT - count, 0),
  dailyLimit: DAILY_TUTOR_LIMIT,
  ...(typeof cooldownMs === 'number' ? { cooldownMs } : {}),
});

const getUsageRecord = (studentId) => {
  const currentDay = new Date().toISOString().slice(0, 10);
  const existing = tutorUsageByStudent.get(studentId);

  if (!existing || existing.day !== currentDay) {
    const fresh = {
      day: currentDay,
      count: 0,
      lastRequestAt: 0,
    };
    tutorUsageByStudent.set(studentId, fresh);
    return fresh;
  }

  return existing;
};

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

    const studentId = req.user.userId;
    const usage = getUsageRecord(studentId);
    const now = Date.now();

    if (usage.count >= DAILY_TUTOR_LIMIT) {
      return res.status(429).json({
        message: 'Daily AI tutor limit reached. Please continue tomorrow or ask your teacher for support.',
        usage: buildUsagePayload(usage.count),
      });
    }

    if (usage.lastRequestAt && now - usage.lastRequestAt < TUTOR_COOLDOWN_MS) {
      return res.status(429).json({
        message: 'Please wait a moment before sending another tutor request.',
        usage: buildUsagePayload(usage.count, TUTOR_COOLDOWN_MS - (now - usage.lastRequestAt)),
      });
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

    usage.count += 1;
    usage.lastRequestAt = now;
    tutorUsageByStudent.set(studentId, usage);

    return res.json({
      ...aiResponse,
      usage: buildUsagePayload(usage.count),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'AI tutor request failed',
      detail: error.message,
    });
  }
});

module.exports = router;
