const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['ai', 'candidate'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['question', 'answer', 'feedback', 'system'],
    default: 'question'
  }
});

const interviewSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'mixed'],
    default: 'mixed'
  },
  difficulty: {
    type: String,
    enum: ['junior', 'mid', 'senior'],
    default: 'mid'
  },
  duration: {
    type: Number, // in minutes
    default: 30,
    min: 15,
    max: 120
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  messages: [messageSchema],
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  score: {
    overall: {
      type: Number,
      min: 0,
      max: 100
    },
    technical: {
      type: Number,
      min: 0,
      max: 100
    },
    communication: {
      type: Number,
      min: 0,
      max: 100
    },
    problemSolving: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  feedback: {
    strengths: [String],
    improvements: [String],
    summary: String,
    recommendation: {
      type: String,
      enum: ['hire', 'reject', 'maybe'],
    }
  },
  aiModel: {
    type: String,
    default: 'gpt-3.5-turbo'
  },
  settings: {
    allowRetries: {
      type: Boolean,
      default: false
    },
    showHints: {
      type: Boolean,
      default: true
    },
    recordAudio: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
interviewSchema.index({ candidate: 1, status: 1 });
interviewSchema.index({ createdAt: -1 });
interviewSchema.index({ status: 1 });

// Calculate actual duration
interviewSchema.virtual('actualDuration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // in minutes
  }
  return 0;
});

// Populate candidate info when querying
interviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'candidate',
    select: 'name email profile.experience profile.skills'
  });
  next();
});

module.exports = mongoose.model('Interview', interviewSchema);