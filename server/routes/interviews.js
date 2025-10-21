const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Interview = require('../models/Interview');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/interviews
// @desc    Create a new interview
// @access  Private (Candidate)
router.post('/', auth, [
  body('position').trim().isLength({ min: 2, max: 100 }).withMessage('Position must be between 2 and 100 characters'),
  body('company').trim().isLength({ min: 2, max: 100 }).withMessage('Company must be between 2 and 100 characters'),
  body('type').isIn(['technical', 'behavioral', 'mixed']).withMessage('Invalid interview type'),
  body('difficulty').isIn(['junior', 'mid', 'senior']).withMessage('Invalid difficulty level'),
  body('duration').optional().isInt({ min: 15, max: 120 }).withMessage('Duration must be between 15 and 120 minutes')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { position, company, type, difficulty, duration } = req.body;

    const interview = new Interview({
      candidate: req.user._id,
      position,
      company,
      type,
      difficulty,
      duration: duration || 30
    });

    await interview.save();

    res.status(201).json({
      message: 'Interview created successfully',
      interview
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ message: 'Server error during interview creation' });
  }
});

// @route   GET /api/interviews
// @desc    Get user's interviews
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { candidate: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Interview.countDocuments(query);

    res.json({
      interviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/interviews/:id
// @desc    Get specific interview
// @access  Private
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid interview ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if user owns this interview or is an admin
    if (interview.candidate._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ interview });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/interviews/:id/start
// @desc    Start an interview
// @access  Private
router.put('/:id/start', auth, [
  param('id').isMongoId().withMessage('Invalid interview ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidate._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (interview.status !== 'scheduled') {
      return res.status(400).json({ message: 'Interview cannot be started' });
    }

    interview.status = 'in-progress';
    interview.startTime = new Date();
    
    // Add welcome message
    interview.messages.push({
      sender: 'ai',
      content: `Hello ${req.user.name}! Welcome to your ${interview.type} interview for the ${interview.position} position at ${interview.company}. I'm your AI interviewer today. Are you ready to begin?`,
      type: 'system'
    });

    await interview.save();

    res.json({
      message: 'Interview started successfully',
      interview
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/interviews/:id/end
// @desc    End an interview
// @access  Private
router.put('/:id/end', auth, [
  param('id').isMongoId().withMessage('Invalid interview ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidate._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (interview.status !== 'in-progress') {
      return res.status(400).json({ message: 'Interview is not in progress' });
    }

    interview.status = 'completed';
    interview.endTime = new Date();

    await interview.save();

    res.json({
      message: 'Interview ended successfully',
      interview
    });
  } catch (error) {
    console.error('End interview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/interviews/:id/messages
// @desc    Add message to interview
// @access  Private
router.post('/:id/messages', auth, [
  param('id').isMongoId().withMessage('Invalid interview ID'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message content is required and must be under 2000 characters'),
  body('type').optional().isIn(['question', 'answer', 'feedback']).withMessage('Invalid message type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { content, type = 'answer' } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidate._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (interview.status !== 'in-progress') {
      return res.status(400).json({ message: 'Interview is not in progress' });
    }

    const message = {
      sender: 'candidate',
      content,
      type,
      timestamp: new Date()
    };

    interview.messages.push(message);
    await interview.save();

    res.json({
      message: 'Message added successfully',
      newMessage: message
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/interviews/stats
// @desc    Get interview statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Interview.aggregate([
      { $match: { candidate: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$score.overall' }
        }
      }
    ]);

    const totalInterviews = await Interview.countDocuments({ candidate: userId });
    const completedInterviews = await Interview.countDocuments({ 
      candidate: userId, 
      status: 'completed' 
    });

    res.json({
      totalInterviews,
      completedInterviews,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;