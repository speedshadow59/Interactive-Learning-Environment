const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
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
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetGrades: {
      type: [Number],
      required: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    topics: [String],
    lessons: [
      {
        title: String,
        description: String,
        order: Number,
        content: String
      }
    ],
    challenges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge'
      }
    ],
    image: String,
    isPublished: {
      type: Boolean,
      default: false
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
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

module.exports = mongoose.model('Course', courseSchema);
