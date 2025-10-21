import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Card,
  CardContent,
  Slider
} from '@mui/material';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateInterview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      position: '',
      company: '',
      type: 'mixed',
      difficulty: 'mid',
      duration: 30
    }
  });

  const watchedDuration = watch('duration');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/interviews', data);
      toast.success('Interview created successfully!');
      navigate(`/interview/${response.data.interview._id}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create interview';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const interviewTypes = [
    {
      value: 'technical',
      label: 'Technical',
      description: 'Focus on coding, algorithms, and technical skills'
    },
    {
      value: 'behavioral',
      label: 'Behavioral',
      description: 'Focus on soft skills, experience, and cultural fit'
    },
    {
      value: 'mixed',
      label: 'Mixed',
      description: 'Combination of technical and behavioral questions'
    }
  ];

  const difficultyLevels = [
    {
      value: 'junior',
      label: 'Junior',
      description: '0-2 years experience, entry-level questions'
    },
    {
      value: 'mid',
      label: 'Mid-Level',
      description: '2-5 years experience, intermediate complexity'
    },
    {
      value: 'senior',
      label: 'Senior',
      description: '5+ years experience, advanced and leadership questions'
    }
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Create New Interview
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Set up your AI-powered interview session
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Position Title"
                placeholder="e.g., Software Engineer, Product Manager"
                {...register('position', {
                  required: 'Position is required',
                  minLength: {
                    value: 2,
                    message: 'Position must be at least 2 characters'
                  }
                })}
                error={!!errors.position}
                helperText={errors.position?.message}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                placeholder="e.g., Google, Microsoft, Startup Inc."
                {...register('company', {
                  required: 'Company is required',
                  minLength: {
                    value: 2,
                    message: 'Company must be at least 2 characters'
                  }
                })}
                error={!!errors.company}
                helperText={errors.company?.message}
              />
            </Grid>

            {/* Interview Type */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Interview Type
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2}>
                {interviewTypes.map((type) => (
                  <Grid item xs={12} md={4} key={type.value}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: watch('type') === type.value ? 2 : 1,
                        borderColor: watch('type') === type.value ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                      onClick={() => setValue('type', type.value)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {type.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {type.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <input type="hidden" {...register('type', { required: true })} />
            </Grid>

            {/* Difficulty Level */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Difficulty Level
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2}>
                {difficultyLevels.map((level) => (
                  <Grid item xs={12} md={4} key={level.value}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: watch('difficulty') === level.value ? 2 : 1,
                        borderColor: watch('difficulty') === level.value ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                      onClick={() => setValue('difficulty', level.value)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {level.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {level.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <input type="hidden" {...register('difficulty', { required: true })} />
            </Grid>

            {/* Duration */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Interview Duration
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ px: 2 }}>
                <Typography gutterBottom>
                  Duration: {watchedDuration} minutes
                </Typography>
                <Slider
                  value={watchedDuration}
                  onChange={(_, value) => setValue('duration', value)}
                  min={15}
                  max={120}
                  step={15}
                  marks={[
                    { value: 15, label: '15m' },
                    { value: 30, label: '30m' },
                    { value: 45, label: '45m' },
                    { value: 60, label: '1h' },
                    { value: 90, label: '1.5h' },
                    { value: 120, label: '2h' }
                  ]}
                  valueLabelDisplay="auto"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Recommended: 30-45 minutes for most interviews
                </Typography>
              </Box>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="center" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Creating Interview...' : 'Create Interview'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateInterview;