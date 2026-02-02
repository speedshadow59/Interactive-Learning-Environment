const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    completedChallenges: [
      {
        challenge: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Challenge'
        },
        completedAt: Date,
        pointsEarned: Number
      }
    ],
    totalPoints: {
      type: Number,
      default: 0
    },
    currentLevel: {
      type: Number,
      default: 1
    },
    experiencePoints: {
      type: Number,
      default: 0
    },
    badges: [
      {
        name: String,
        description: String,
        earnedAt: Date
      }
    ],
    achievements: [String],
    averageScore: {
      type: Number,
      default: 0
    },
    learningPath: {
      type: String,
      enum: ['visual', 'text-based', 'mixed'],
      default: 'visual'
    },
    adaptiveRecommendations: [
      {
        challengeId: mongoose.Schema.Types.ObjectId,
        reason: String,
        suggestedAt: Date
      }
    ],
    lastActivityAt: Date,
    estimatedTimeToCompletion: Number, // in hours
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

module.exports = mongoose.model('Progress', progressSchema);
