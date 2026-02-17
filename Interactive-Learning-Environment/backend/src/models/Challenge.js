const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy'
    },
    objectives: [String],
    instructions: String,
    initialCode: {
      type: String,
      default: ''
    },
    expectedOutput: String,
    testCases: [
      {
        input: String,
        expectedOutput: String,
        description: String
      }
    ],
    hints: [String],
    gamificationPoints: {
      type: Number,
      default: 100
    },
    timeLimit: {
      type: Number, // in minutes
      default: null
    },
    isProgrammingChallenge: {
      type: Boolean,
      default: true
    },
    // Block-based coding support
    isBlockBased: {
      type: Boolean,
      default: true
    },
    blocklyXml: {
      type: String,
      default: ''
    },
    blocklyToolbox: {
      type: Object,
      default: {}
    },
    blocklyTemplateUrl: String,
    order: Number,
    isPublished: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Challenge', challengeSchema);
