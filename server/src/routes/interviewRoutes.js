const express = require('express');
const Interview = require('../models/Interview');
const {
  generateOpeningQuestion,
  generateInterviewerReply,
  generateEvaluation,
} = require('../ai/openai');

const router = express.Router();

// Start a new interview
router.post('/start', async (req, res, next) => {
  try {
    const { candidateName, roleTitle, jobDescription } = req.body || {};

    const interview = await Interview.create({
      candidateName,
      roleTitle,
      jobDescription,
      status: 'active',
      messages: [],
    });

    const opening = await generateOpeningQuestion({ roleTitle, jobDescription });

    interview.messages.push({ role: 'assistant', content: opening.content });
    await interview.save();

    res.status(201).json({
      id: interview._id.toString(),
      message: opening.content,
    });
  } catch (err) {
    next(err);
  }
});

// Send a message to the interviewer and get reply
router.post('/:id/message', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const interview = await Interview.findById(id);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    if (interview.status !== 'active') return res.status(400).json({ error: 'Interview has ended' });

    // Append user message
    interview.messages.push({ role: 'user', content: message });

    // Generate interviewer reply
    const reply = await generateInterviewerReply({
      messages: interview.messages,
      roleTitle: interview.roleTitle,
      jobDescription: interview.jobDescription,
    });

    interview.messages.push({ role: 'assistant', content: reply.content });
    await interview.save();

    res.json({ message: reply.content });
  } catch (err) {
    next(err);
  }
});

// End interview and request evaluation
router.post('/:id/end', async (req, res, next) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    interview.status = 'ended';

    // Ask the model for a final evaluation
    const evaluation = await generateEvaluation({
      messages: interview.messages,
      roleTitle: interview.roleTitle,
      jobDescription: interview.jobDescription,
    });

    // Normalize scores keys
    const scores = evaluation.scores || {};
    interview.evaluation = {
      summary: evaluation.summary || '',
      scores: {
        technicalDepth: scores.TechnicalDepth ?? scores.technicalDepth ?? scores.technical_depth ?? null,
        communication: scores.Communication ?? scores.communication ?? null,
        problemSolving: scores.ProblemSolving ?? scores.problemSolving ?? scores.problem_solving ?? null,
        overall: scores.Overall ?? scores.overall ?? null,
      },
    };

    await interview.save();

    res.json({ evaluation: interview.evaluation });
  } catch (err) {
    next(err);
  }
});

// Get interview by id
router.get('/:id', async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json(interview);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
