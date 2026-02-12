const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: '🏆'
    },
    category: {
      type: String,
      enum: ['completion', 'streak', 'mastery', 'speed', 'special'],
      default: 'completion'
    },
    requiredPoints: {
      type: Number,
      default: 0
    },
    requiredChallenges: {
      type: Number,
      default: 0
    },
    requiredStreak: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Badge', badgeSchema);
