const express = require('express');
const OpenAI = require('openai');
const { body, validationResult, param } = require('express-validator');
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interview question templates
const questionTemplates = {
  technical: {
    junior: [
      "Can you explain what {technology} is and how you've used it?",
      "Walk me through how you would solve this problem: {problem}",
      "What's the difference between {concept1} and {concept2}?",
      "How would you debug an issue where {scenario}?"
    ],
    mid: [
      "Design a system that can handle {requirement}. What would be your approach?",
      "You have a performance issue with {scenario}. How would you investigate and solve it?",
      "Explain the trade-offs between {option1} and {option2} in the context of {scenario}",
      "How would you implement {feature} considering scalability and maintainability?"
    ],
    senior: [
      "You're leading a team to build {system}. What's your architecture approach?",
      "How would you handle {complex_scenario} at scale?",
      "What strategies would you use to migrate from {old_system} to {new_system}?",
      "Design a solution for {business_problem} considering technical and business constraints"
    ]
  },
  behavioral: [
    "Tell me about a time when you had to work with a difficult team member",
    "Describe a situation where you had to learn a new technology quickly",
    "How do you handle tight deadlines and pressure?",
    "Give me an example of when you had to make a difficult technical decision",
    "Tell me about a project you're particularly proud of and why",
    "How do you stay updated with new technologies and industry trends?",
    "Describe a time when you had to give constructive feedback to a colleague"
  ]
};

// Generate AI prompt based on interview context
const generateInterviewPrompt = (interview, conversationHistory) => {
  const context = `
You are an experienced ${interview.type} interviewer conducting a ${interview.difficulty}-level interview for a ${interview.position} position at ${interview.company}.

Interview Details:
- Type: ${interview.type}
- Level: ${interview.difficulty}
- Position: ${interview.position}
- Company: ${interview.company}
- Duration: ${interview.duration} minutes

Your role:
1. Ask relevant, thoughtful questions appropriate for the level and type
2. Provide constructive feedback on answers
3. Be encouraging but professional
4. Ask follow-up questions to dive deeper
5. Evaluate technical knowledge, problem-solving, and communication skills

Conversation so far:
${conversationHistory}

Guidelines:
- Keep responses concise and professional
- Ask one question at a time
- Provide specific, actionable feedback
- Adapt difficulty based on candidate responses
- End with next steps or summary when appropriate
`;

  return context;
};

// @route   POST /api/ai/generate-question
// @desc    Generate AI interview question
// @access  Private
router.post('/generate-question', auth, [
  body('interviewId').isMongoId().withMessage('Invalid interview ID'),
  body('context').optional().isString().withMessage('Context must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { interviewId, context } = req.body;

    // Get interview details
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check access
    if (interview.candidate._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (interview.status !== 'in-progress') {
      return res.status(400).json({ message: 'Interview is not in progress' });
    }

    // Prepare conversation history
    const conversationHistory = interview.messages
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    const prompt = generateInterviewPrompt(interview, conversationHistory);

    // Generate question using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: context || 'Please ask the next appropriate interview question.'
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content.trim();

    // Add AI message to interview
    const aiMessage = {
      sender: 'ai',
      content: aiResponse,
      type: 'question',
      timestamp: new Date()
    };

    interview.messages.push(aiMessage);
    await interview.save();

    res.json({
      message: 'Question generated successfully',
      question: aiResponse,
      messageId: aiMessage._id
    });

  } catch (error) {
    console.error('Generate question error:', error);
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ message: 'AI service quota exceeded. Please try again later.' });
    }
    res.status(500).json({ message: 'Error generating question' });
  }
});

// @route   POST /api/ai/evaluate-answer
// @desc    Evaluate candidate answer with AI
// @access  Private
router.post('/evaluate-answer', auth, [
  body('interviewId').isMongoId().withMessage('Invalid interview ID'),
  body('answer').trim().isLength({ min: 1 }).withMessage('Answer is required'),
  body('questionId').isMongoId().withMessage('Invalid question ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { interviewId, answer, questionId } = req.body;

    // Get interview details
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check access
    if (interview.candidate._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find the question
    const question = interview.messages.find(msg => 
      msg._id.toString() === questionId && msg.sender === 'ai'
    );

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Prepare evaluation prompt
    const evaluationPrompt = `
You are evaluating a candidate's answer in a ${interview.type} interview for a ${interview.position} position.

Question: ${question.content}
Answer: ${answer}

Please provide:
1. A brief evaluation (2-3 sentences)
2. A score from 1-10
3. One specific improvement suggestion
4. One positive aspect (if any)

Keep feedback constructive and professional. Format as JSON:
{
  "evaluation": "brief evaluation text",
  "score": number,
  "improvement": "specific improvement suggestion",
  "positive": "positive aspect or null"
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer providing constructive feedback.'
        },
        {
          role: 'user',
          content: evaluationPrompt
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    let evaluation;
    try {
      evaluation = JSON.parse(completion.choices[0].message.content.trim());
    } catch (parseError) {
      // Fallback if JSON parsing fails
      evaluation = {
        evaluation: completion.choices[0].message.content.trim(),
        score: 7,
        improvement: "Consider providing more specific examples",
        positive: "Good communication skills"
      };
    }

    // Add evaluation as feedback message
    const feedbackMessage = {
      sender: 'ai',
      content: `Evaluation: ${evaluation.evaluation}\n\nScore: ${evaluation.score}/10\n\n${evaluation.positive ? `Positive: ${evaluation.positive}\n\n` : ''}Suggestion: ${evaluation.improvement}`,
      type: 'feedback',
      timestamp: new Date()
    };

    interview.messages.push(feedbackMessage);
    await interview.save();

    res.json({
      message: 'Answer evaluated successfully',
      evaluation,
      feedbackId: feedbackMessage._id
    });

  } catch (error) {
    console.error('Evaluate answer error:', error);
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ message: 'AI service quota exceeded. Please try again later.' });
    }
    res.status(500).json({ message: 'Error evaluating answer' });
  }
});

// @route   POST /api/ai/generate-summary
// @desc    Generate interview summary and final evaluation
// @access  Private
router.post('/generate-summary', auth, [
  body('interviewId').isMongoId().withMessage('Invalid interview ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { interviewId } = req.body;

    // Get interview details
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check access
    if (interview.candidate._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (interview.status !== 'completed') {
      return res.status(400).json({ message: 'Interview must be completed first' });
    }

    // Prepare conversation for summary
    const conversation = interview.messages
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n\n');

    const summaryPrompt = `
Analyze this ${interview.type} interview for a ${interview.position} position and provide a comprehensive evaluation.

Interview Details:
- Position: ${interview.position}
- Company: ${interview.company}
- Type: ${interview.type}
- Level: ${interview.difficulty}
- Duration: ${interview.actualDuration || interview.duration} minutes

Conversation:
${conversation}

Please provide a detailed evaluation in JSON format:
{
  "overallScore": number (0-100),
  "technicalScore": number (0-100),
  "communicationScore": number (0-100),
  "problemSolvingScore": number (0-100),
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "summary": "detailed summary paragraph",
  "recommendation": "hire|reject|maybe"
}

Base scores on:
- Technical knowledge and accuracy
- Problem-solving approach
- Communication clarity
- Depth of understanding
- Professional demeanor
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert interviewer providing comprehensive candidate evaluation.'
        },
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      max_tokens: 800,
      temperature: 0.2,
    });

    let summary;
    try {
      summary = JSON.parse(completion.choices[0].message.content.trim());
    } catch (parseError) {
      console.error('Summary parsing error:', parseError);
      return res.status(500).json({ message: 'Error parsing AI summary' });
    }

    // Update interview with summary
    interview.score = {
      overall: summary.overallScore,
      technical: summary.technicalScore,
      communication: summary.communicationScore,
      problemSolving: summary.problemSolvingScore
    };

    interview.feedback = {
      strengths: summary.strengths,
      improvements: summary.improvements,
      summary: summary.summary,
      recommendation: summary.recommendation
    };

    await interview.save();

    res.json({
      message: 'Summary generated successfully',
      summary: {
        scores: interview.score,
        feedback: interview.feedback
      }
    });

  } catch (error) {
    console.error('Generate summary error:', error);
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ message: 'AI service quota exceeded. Please try again later.' });
    }
    res.status(500).json({ message: 'Error generating summary' });
  }
});

module.exports = router;