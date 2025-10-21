import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Assessment,
  ExpandMore,
  Download,
  Share,
  Home,
  Refresh,
  SmartToy,
  Person,
  TrendingUp,
  Psychology,
  Communication,
  Code
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

import LoadingSpinner from '../components/UI/LoadingSpinner';

const InterviewResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Fetch interview data
  const { data: interviewData, isLoading, error, refetch } = useQuery(
    ['interview', id],
    async () => {
      const response = await axios.get(`/interviews/${id}`);
      return response.data.interview;
    }
  );

  // Generate summary mutation
  const generateSummaryMutation = useMutation(
    async () => {
      setGeneratingSummary(true);
      const response = await axios.post('/ai/generate-summary', {
        interviewId: id
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Summary generated successfully!');
        refetch();
        setGeneratingSummary(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate summary');
        setGeneratingSummary(false);
      }
    }
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'hire':
        return 'success';
      case 'maybe':
        return 'warning';
      case 'reject':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRecommendationText = (recommendation) => {
    switch (recommendation) {
      case 'hire':
        return 'Recommend to Hire';
      case 'maybe':
        return 'Consider Further';
      case 'reject':
        return 'Not Recommended';
      default:
        return 'No Recommendation';
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading interview results..." />;
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Failed to load interview results. Please try again.
        </Alert>
      </Container>
    );
  }

  const hasScores = interviewData.score && interviewData.score.overall;
  const hasFeedback = interviewData.feedback && interviewData.feedback.summary;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Interview Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {interviewData.position} at {interviewData.company}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
          {!hasFeedback && interviewData.status === 'completed' && (
            <Button
              variant="contained"
              startIcon={generatingSummary ? <CircularProgress size={20} /> : <Assessment />}
              onClick={() => generateSummaryMutation.mutate()}
              disabled={generatingSummary}
            >
              {generatingSummary ? 'Generating...' : 'Generate Summary'}
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Interview Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Interview Overview
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip 
                label={interviewData.status} 
                color={interviewData.status === 'completed' ? 'success' : 'warning'}
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Type</Typography>
              <Typography variant="body1">{interviewData.type}</Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Difficulty</Typography>
              <Typography variant="body1">{interviewData.difficulty}</Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Duration</Typography>
              <Typography variant="body1">
                {interviewData.actualDuration || interviewData.duration} minutes
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Started</Typography>
              <Typography variant="body1">
                {interviewData.startTime ? formatDate(interviewData.startTime) : 'Not started'}
              </Typography>
            </Box>
            {interviewData.endTime && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Completed</Typography>
                <Typography variant="body1">
                  {formatDate(interviewData.endTime)}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Quick Stats */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Messages Exchanged</Typography>
              <Typography variant="h5">{interviewData.messages?.length || 0}</Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Questions Asked</Typography>
              <Typography variant="h5">
                {interviewData.messages?.filter(m => m.sender === 'ai' && m.type === 'question').length || 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Answers Given</Typography>
              <Typography variant="h5">
                {interviewData.messages?.filter(m => m.sender === 'candidate' && m.type === 'answer').length || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Scores and Feedback */}
        <Grid item xs={12} md={8}>
          {!hasScores && !hasFeedback ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Analysis Not Available
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {interviewData.status !== 'completed' 
                  ? 'Complete the interview to see detailed analysis and scores.'
                  : 'Generate AI summary to see detailed analysis and scores.'
                }
              </Typography>
              {interviewData.status === 'completed' && (
                <Button
                  variant="contained"
                  startIcon={generatingSummary ? <CircularProgress size={20} /> : <Assessment />}
                  onClick={() => generateSummaryMutation.mutate()}
                  disabled={generatingSummary}
                  size="large"
                >
                  {generatingSummary ? 'Generating Analysis...' : 'Generate AI Analysis'}
                </Button>
              )}
            </Paper>
          ) : (
            <>
              {/* Scores */}
              {hasScores && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance Scores
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h4" color={getScoreColor(interviewData.score.overall)}>
                            {interviewData.score.overall}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Overall Score
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={interviewData.score.overall}
                            color={getScoreColor(interviewData.score.overall)}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Code sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                          <Typography variant="h4" color={getScoreColor(interviewData.score.technical)}>
                            {interviewData.score.technical}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Technical
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={interviewData.score.technical}
                            color={getScoreColor(interviewData.score.technical)}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Communication sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                          <Typography variant="h4" color={getScoreColor(interviewData.score.communication)}>
                            {interviewData.score.communication}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Communication
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={interviewData.score.communication}
                            color={getScoreColor(interviewData.score.communication)}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Psychology sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                          <Typography variant="h4" color={getScoreColor(interviewData.score.problemSolving)}>
                            {interviewData.score.problemSolving}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Problem Solving
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={interviewData.score.problemSolving}
                            color={getScoreColor(interviewData.score.problemSolving)}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Feedback */}
              {hasFeedback && (
                <>
                  {/* Recommendation */}
                  {interviewData.feedback.recommendation && (
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Recommendation
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Chip
                          label={getRecommendationText(interviewData.feedback.recommendation)}
                          color={getRecommendationColor(interviewData.feedback.recommendation)}
                          size="large"
                          sx={{ fontSize: '1rem', py: 2 }}
                        />
                      </Box>
                    </Paper>
                  )}

                  {/* Summary */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      AI Summary
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                      {interviewData.feedback.summary}
                    </Typography>
                  </Paper>

                  {/* Strengths and Improvements */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom color="success.main">
                          Strengths
                        </Typography>
                        {interviewData.feedback.strengths?.length > 0 ? (
                          <Box component="ul" sx={{ pl: 2 }}>
                            {interviewData.feedback.strengths.map((strength, index) => (
                              <Typography component="li" key={index} sx={{ mb: 1 }}>
                                {strength}
                              </Typography>
                            ))}
                          </Box>
                        ) : (
                          <Typography color="text.secondary">
                            No specific strengths identified.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom color="warning.main">
                          Areas for Improvement
                        </Typography>
                        {interviewData.feedback.improvements?.length > 0 ? (
                          <Box component="ul" sx={{ pl: 2 }}>
                            {interviewData.feedback.improvements.map((improvement, index) => (
                              <Typography component="li" key={index} sx={{ mb: 1 }}>
                                {improvement}
                              </Typography>
                            ))}
                          </Box>
                        ) : (
                          <Typography color="text.secondary">
                            No specific improvements suggested.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              )}
            </>
          )}
        </Grid>

        {/* Interview Transcript */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Interview Transcript
            </Typography>
            {interviewData.messages?.length > 0 ? (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>View Full Conversation ({interviewData.messages.length} messages)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {interviewData.messages.map((message, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Avatar sx={{ 
                            width: 24, 
                            height: 24,
                            bgcolor: message.sender === 'ai' ? 'primary.main' : 'secondary.main'
                          }}>
                            {message.sender === 'ai' ? <SmartToy sx={{ fontSize: 16 }} /> : <Person sx={{ fontSize: 16 }} />}
                          </Avatar>
                          <Typography variant="subtitle2">
                            {message.sender === 'ai' ? 'AI Interviewer' : 'Candidate'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                          {message.type && (
                            <Chip label={message.type} size="small" variant="outlined" />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ ml: 4, whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                        {index < interviewData.messages.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ) : (
              <Typography color="text.secondary">
                No messages in this interview.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InterviewResults;