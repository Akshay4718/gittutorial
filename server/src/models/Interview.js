const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InterviewSchema = new mongoose.Schema(
  {
    candidateName: { type: String },
    roleTitle: { type: String },
    jobDescription: { type: String },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    messages: { type: [MessageSchema], default: [] },
    evaluation: {
      summary: { type: String },
      scores: {
        technicalDepth: { type: Number, min: 0, max: 10 },
        communication: { type: Number, min: 0, max: 10 },
        problemSolving: { type: Number, min: 0, max: 10 },
        overall: { type: Number, min: 0, max: 10 },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', InterviewSchema);
