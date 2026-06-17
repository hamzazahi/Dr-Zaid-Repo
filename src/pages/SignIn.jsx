import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/theme';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('admin@drzaiddental.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (!email.trim() || !password.trim()) {
        setError('Please enter email and password.');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }

      signIn({ email: email.trim() });
      setLoading(false);
    }, 800);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: colors.background,
        backgroundImage: 'radial-gradient(circle at top right, rgba(15, 76, 129, 0.1), transparent 50%)',
        p: { xs: 2, md: 0 }
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 480,
          p: { xs: 3, md: 5 },
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 20px 60px -20px rgba(15, 76, 129, 0.15)'
        }}
      >
        <Stack spacing={4}>
          {/* Header Section */}
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                bgcolor: colors.primary,
                color: colors.surface,
                mx: 'auto',
                mb: 2,
                fontSize: '1.5rem'
              }}
            >
              D
            </Avatar>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: colors.textPrimary,
                mb: 1
              }}
            >
              Dr. Zaid Dental
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary,
                fontWeight: 500
              }}
            >
              Clinic Management System
            </Typography>
          </Box>

          {/* Sign In Heading */}
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: colors.textPrimary,
                mb: 1
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary
              }}
            >
              Sign in to access your clinic management dashboard
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {/* Form Fields */}
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="admin@drzaiddental.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 1 }}>
                    <Typography sx={{ color: colors.primary, fontWeight: 700 }}>@</Typography>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />

            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter your password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 1 }}>
                    <Typography sx={{ color: colors.primary, fontWeight: 700 }}>🔒</Typography>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />

            <FormControlLabel
              control={<Checkbox defaultChecked disabled={loading} />}
              label={
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  Keep me signed in
                </Typography>
              }
            />
          </Stack>

          {/* Sign In Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              bgcolor: colors.primary,
              color: colors.surface,
              fontWeight: 700,
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                bgcolor: colors.primaryDark
              },
              '&:disabled': {
                bgcolor: colors.textLight,
                color: colors.textSecondary
              }
            }}
          >
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} sx={{ color: 'inherit' }} />
                <span>Signing in...</span>
              </Stack>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Demo Credentials */}
          <Paper
            sx={{
              p: 2.5,
              bgcolor: colors.surfaceAlt,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 700,
                color: colors.textSecondary,
                mb: 1
              }}
            >
              Demo Credentials
            </Typography>
            <Stack spacing={0.5}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  color: colors.textPrimary,
                  fontWeight: 600
                }}
              >
                Email: admin@drzaiddental.com
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  color: colors.textPrimary,
                  fontWeight: 600
                }}
              >
                Password: admin123
              </Typography>
            </Stack>
          </Paper>

          {/* Footer Text */}
          <Typography
            variant="caption"
            sx={{
              textAlign: 'center',
              color: colors.textSecondary,
              display: 'block'
            }}
          >
            © 2026 Dr. Zaid Dental Clinic. All rights reserved.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
