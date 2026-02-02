const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    code: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'blockly'],
      default: 'javascript'
    },
    result: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'error'],
      default: 'pending'
    },
    testsPassed: {
      type: Number,
      default: 0
    },
    totalTests: {
      type: Number,
      default: 0
    },
    feedback: String,
    executionTime: Number, // in milliseconds
    pointsEarned: {
      type: Number,
      default: 0
    },
    timeSpent: Number, // in seconds
    attempts: {
      type: Number,
      default: 1
    },
    isFirstAttempt: {
      type: Boolean,
      default: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
