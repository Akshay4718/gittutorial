import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { Person, Edit, Save, Cancel } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';

import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      'profile.experience': user?.profile?.experience || 0,
      'profile.skills': user?.profile?.skills || [],
      'profile.bio': user?.profile?.bio || ''
    }
  });

  // Common skills for autocomplete
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'TypeScript',
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask',
    'Spring Boot', 'Laravel', 'Ruby on Rails', 'ASP.NET', 'Next.js', 'Nuxt.js',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'GraphQL',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins',
    'Git', 'Linux', 'Agile', 'Scrum', 'DevOps', 'CI/CD', 'Microservices',
    'Machine Learning', 'Data Science', 'AI', 'Deep Learning', 'TensorFlow',
    'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Jupyter', 'R',
    'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS', 'Material-UI',
    'REST API', 'GraphQL', 'WebSocket', 'OAuth', 'JWT', 'Security',
    'Testing', 'Unit Testing', 'Integration Testing', 'Jest', 'Cypress',
    'Product Management', 'Project Management', 'Leadership', 'Communication',
    'Problem Solving', 'Team Collaboration', 'Mentoring', 'Code Review'
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await updateProfile(data);
    
    if (result.success) {
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const formatJoinDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        {!isEditing ? (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '2rem'
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || <Person />}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user?.email}
            </Typography>
            <Chip 
              label={user?.role} 
              color="primary" 
              sx={{ mb: 2, textTransform: 'capitalize' }}
            />
            <Typography variant="body2" color="text.secondary">
              Member since {formatJoinDate(user?.createdAt)}
            </Typography>
          </Paper>

          {/* Quick Stats */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2">Experience</Typography>
              <Typography variant="body2" fontWeight="bold">
                {user?.profile?.experience || 0} years
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2">Skills</Typography>
              <Typography variant="body2" fontWeight="bold">
                {user?.profile?.skills?.length || 0} skills
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Account Type</Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                {user?.role}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    disabled={!isEditing}
                    {...register('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    disabled={true} // Email should not be editable
                    value={user?.email}
                    helperText="Email cannot be changed"
                  />
                </Grid>

                {/* Professional Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Professional Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Years of Experience"
                    type="number"
                    disabled={!isEditing}
                    inputProps={{ min: 0, max: 50 }}
                    {...register('profile.experience', {
                      min: {
                        value: 0,
                        message: 'Experience cannot be negative'
                      },
                      max: {
                        value: 50,
                        message: 'Experience cannot exceed 50 years'
                      }
                    })}
                    error={!!errors['profile.experience']}
                    helperText={errors['profile.experience']?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    disabled={true}
                    value={user?.role}
                    helperText="Contact support to change your role"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="profile.skills"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        multiple
                        options={commonSkills}
                        value={value || []}
                        onChange={(_, newValue) => onChange(newValue)}
                        disabled={!isEditing}
                        freeSolo
                        renderTags={(tagValue, getTagProps) =>
                          tagValue.map((option, index) => (
                            <Chip
                              variant="outlined"
                              label={option}
                              {...getTagProps({ index })}
                              key={option}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Skills"
                            placeholder={isEditing ? "Add skills..." : ""}
                            helperText="Add your technical and professional skills"
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Bio"
                    placeholder={isEditing ? "Tell us about yourself, your experience, and career goals..." : ""}
                    disabled={!isEditing}
                    {...register('profile.bio', {
                      maxLength: {
                        value: 500,
                        message: 'Bio cannot exceed 500 characters'
                      }
                    })}
                    error={!!errors['profile.bio']}
                    helperText={errors['profile.bio']?.message || `${(user?.profile?.bio || '').length}/500 characters`}
                  />
                </Grid>

                {/* Submit Button (only visible when editing) */}
                {isEditing && (
                  <Grid item xs={12}>
                    <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Paper>

          {/* Current Skills Display */}
          {user?.profile?.skills?.length > 0 && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Current Skills
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {user.profile.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;