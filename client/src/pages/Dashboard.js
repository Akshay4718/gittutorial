import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Box,
  Alert,
  Tabs,
  Tab,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Assessment,
  Schedule,
  CheckCircle,
  Cancel,
  TrendingUp
} from '@mui/icons-material';
import axios from 'axios';

import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  // Fetch interviews
  const { data: interviewsData, isLoading: interviewsLoading, error: interviewsError } = useQuery(
    'interviews',
    async () => {
      const response = await axios.get('/interviews');
      return response.data;
    }
  );

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useQuery(
    'interview-stats',
    async () => {
      const response = await axios.get('/interviews/stats/overview');
      return response.data;
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />;
      case 'in-progress':
        return <PlayArrow />;
      case 'scheduled':
        return <Schedule />;
      case 'cancelled':
        return <Cancel />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredInterviews = interviewsData?.interviews?.filter(interview => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return interview.status === 'scheduled';
    if (tabValue === 2) return interview.status === 'in-progress';
    if (tabValue === 3) return interview.status === 'completed';
    return true;
  }) || [];

  if (interviewsLoading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user.name}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ready to practice your interview skills? Let's get started!
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {statsData?.totalInterviews || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Interviews
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {statsData?.completedInterviews || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {statsData?.stats?.find(s => s._id === 'completed')?.avgScore?.toFixed(0) || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {statsData?.stats?.find(s => s._id === 'scheduled')?.count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/create-interview')}
            size="large"
          >
            New Interview
          </Button>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/profile')}
            size="large"
          >
            View Profile
          </Button>
        </Box>
      </Paper>

      {/* Interviews Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Interviews
        </Typography>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="All" />
          <Tab label="Scheduled" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>

        {interviewsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load interviews. Please try again.
          </Alert>
        )}

        {filteredInterviews.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No interviews found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {tabValue === 0 
                ? "You haven't created any interviews yet. Start practicing now!"
                : "No interviews in this category."
              }
            </Typography>
            {tabValue === 0 && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/create-interview')}
              >
                Create Your First Interview
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredInterviews.map((interview) => (
              <Grid item xs={12} md={6} lg={4} key={interview._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2">
                        {interview.position}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(interview.status)}
                        label={interview.status}
                        color={getStatusColor(interview.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {interview.company}
                    </Typography>
                    
                    <Box display="flex" gap={1} mb={2}>
                      <Chip label={interview.type} size="small" variant="outlined" />
                      <Chip label={interview.difficulty} size="small" variant="outlined" />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      Created: {formatDate(interview.createdAt)}
                    </Typography>
                    
                    {interview.score?.overall && (
                      <Box mt={2}>
                        <Typography variant="body2" gutterBottom>
                          Score: {interview.score.overall}/100
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={interview.score.overall} 
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    {interview.status === 'scheduled' && (
                      <Button
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => navigate(`/interview/${interview._id}`)}
                      >
                        Start
                      </Button>
                    )}
                    {interview.status === 'in-progress' && (
                      <Button
                        size="small"
                        color="warning"
                        startIcon={<PlayArrow />}
                        onClick={() => navigate(`/interview/${interview._id}`)}
                      >
                        Continue
                      </Button>
                    )}
                    {interview.status === 'completed' && (
                      <Button
                        size="small"
                        startIcon={<Assessment />}
                        onClick={() => navigate(`/interview/${interview._id}/results`)}
                      >
                        View Results
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;