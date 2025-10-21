import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  Send,
  Stop,
  PlayArrow,
  SmartToy,
  Person,
  Timer,
  Help
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const InterviewRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Fetch interview data
  const { data: interviewData, isLoading, error } = useQuery(
    ['interview', id],
    async () => {
      const response = await axios.get(`/interviews/${id}`);
      return response.data.interview;
    },
    {
      refetchInterval: 5000, // Refetch every 5 seconds to get updates
    }
  );

  // Start interview mutation
  const startInterviewMutation = useMutation(
    async () => {
      const response = await axios.put(`/interviews/${id}/start`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['interview', id]);
        setStartTime(Date.now());
        toast.success('Interview started!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to start interview');
      }
    }
  );

  // End interview mutation
  const endInterviewMutation = useMutation(
    async () => {
      const response = await axios.put(`/interviews/${id}/end`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['interview', id]);
        toast.success('Interview ended!');
        navigate(`/interview/${id}/results`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to end interview');
      }
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    async (messageData) => {
      const response = await axios.post(`/interviews/${id}/messages`, messageData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['interview', id]);
        setMessage('');
        // Generate AI response
        generateAIResponse();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    }
  );

  // Generate AI question mutation
  const generateQuestionMutation = useMutation(
    async (context) => {
      setIsTyping(true);
      const response = await axios.post('/ai/generate-question', {
        interviewId: id,
        context
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['interview', id]);
        setIsTyping(false);
      },
      onError: (error) => {
        setIsTyping(false);
        toast.error(error.response?.data?.message || 'Failed to generate question');
      }
    }
  );

  // Socket.IO setup
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join-interview', id);

    newSocket.on('new-message', (data) => {
      queryClient.invalidateQueries(['interview', id]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [id, queryClient]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (interviewData?.status === 'in-progress' && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [interviewData?.status, startTime]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interviewData?.messages]);

  // Set start time when interview is in progress
  useEffect(() => {
    if (interviewData?.status === 'in-progress' && interviewData.startTime && !startTime) {
      setStartTime(new Date(interviewData.startTime).getTime());
    }
  }, [interviewData, startTime]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      content: message.trim(),
      type: 'answer'
    });
  };

  const generateAIResponse = () => {
    generateQuestionMutation.mutate();
  };

  const handleStartInterview = () => {
    startInterviewMutation.mutate();
  };

  const handleEndInterview = () => {
    setShowEndDialog(false);
    endInterviewMutation.mutate();
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeProgress = () => {
    if (!interviewData?.duration || !elapsedTime) return 0;
    return Math.min((elapsedTime / (interviewData.duration * 60 * 1000)) * 100, 100);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading interview..." />;
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Failed to load interview. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Interview Info Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Interview Details
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Position</Typography>
              <Typography variant="body1">{interviewData.position}</Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Company</Typography>
              <Typography variant="body1">{interviewData.company}</Typography>
            </Box>
            <Box display="flex" gap={1} mb={2}>
              <Chip label={interviewData.type} size="small" />
              <Chip label={interviewData.difficulty} size="small" />
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Duration</Typography>
              <Typography variant="body1">{interviewData.duration} minutes</Typography>
            </Box>
            <Chip 
              label={interviewData.status} 
              color={interviewData.status === 'completed' ? 'success' : 
                     interviewData.status === 'in-progress' ? 'warning' : 'info'}
            />
          </Paper>

          {/* Timer */}
          {interviewData.status === 'in-progress' && (
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Timer />
                <Typography variant="h6">Timer</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {formatTime(elapsedTime)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={getTimeProgress()} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {interviewData.duration} minutes total
              </Typography>
            </Paper>
          )}

          {/* Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            {interviewData.status === 'scheduled' && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleStartInterview}
                disabled={startInterviewMutation.isLoading}
                size="large"
              >
                Start Interview
              </Button>
            )}
            {interviewData.status === 'in-progress' && (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Help />}
                  onClick={generateAIResponse}
                  disabled={generateQuestionMutation.isLoading}
                  sx={{ mb: 2 }}
                >
                  Ask AI Question
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={() => setShowEndDialog(true)}
                  disabled={endInterviewMutation.isLoading}
                >
                  End Interview
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            {/* Messages */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {interviewData.messages?.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary">
                    {interviewData.status === 'scheduled' 
                      ? 'Start the interview to begin chatting with AI'
                      : 'No messages yet'
                    }
                  </Typography>
                </Box>
              ) : (
                interviewData.messages?.map((msg, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Avatar sx={{ 
                        bgcolor: msg.sender === 'ai' ? 'primary.main' : 'secondary.main',
                        width: 32, 
                        height: 32 
                      }}>
                        {msg.sender === 'ai' ? <SmartToy /> : <Person />}
                      </Avatar>
                      <Box flexGrow={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="subtitle2">
                            {msg.sender === 'ai' ? 'AI Interviewer' : user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </Typography>
                          {msg.type && (
                            <Chip label={msg.type} size="small" variant="outlined" />
                          )}
                        </Box>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                              {msg.content}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
              
              {isTyping && (
                <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <SmartToy />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      AI is typing...
                    </Typography>
                  </Box>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            {interviewData.status === 'in-progress' && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box component="form" onSubmit={handleSendMessage} display="flex" gap={1}>
                  <TextField
                    ref={messageInputRef}
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type your answer..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sendMessageMutation.isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <IconButton
                    type="submit"
                    color="primary"
                    disabled={!message.trim() || sendMessageMutation.isLoading}
                    sx={{ alignSelf: 'flex-end' }}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* End Interview Dialog */}
      <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
        <DialogTitle>End Interview</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end this interview? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>Cancel</Button>
          <Button onClick={handleEndInterview} color="error" variant="contained">
            End Interview
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InterviewRoom;