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
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/HttpsOutlined';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/theme';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const validate = () => {
    if (!email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      signIn({ email: email.trim(), keepSignedIn });
      setLoading(false);
    }, 600);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: colors.background,
        backgroundImage: 'radial-gradient(ellipse at top right, rgba(15, 76, 129, 0.08) 0%, transparent 55%)',
        p: { xs: 2, md: 0 }
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3, md: 4.5 },
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 8px 40px -12px rgba(15, 76, 129, 0.12)'
        }}
      >
        <Stack spacing={3.5}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 52,
                height: 52,
                bgcolor: colors.primary,
                mx: 'auto',
                mb: 2,
                fontSize: '1.1rem',
                fontWeight: 700,
              }}
            >
              DC
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.textPrimary, mb: 0.5 }}>
              Dr. Zaid Dental
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              Clinic Management System
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: colors.textPrimary, mb: 0.5 }}>
              Sign in to your account
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              Enter your credentials to access the dashboard
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: '8px', py: 0.5 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              disabled={loading}
              placeholder="admin@drzaiddental.com"
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: colors.textLight, fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              disabled={loading}
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: colors.textLight, fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  disabled={loading}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  Keep me signed in
                </Typography>
              }
            />
          </Stack>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              py: 1.4,
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: 700,
            }}
          >
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} sx={{ color: 'inherit' }} />
                <span>Signing in…</span>
              </Stack>
            ) : (
              'Sign In'
            )}
          </Button>

          <Box
            sx={{
              p: 2,
              bgcolor: colors.surfaceAlt,
              border: `1px dashed ${colors.border}`,
              borderRadius: '8px',
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: colors.textSecondary, mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Demo Access
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: colors.textPrimary, fontSize: '0.8rem' }}>
              Email: admin@drzaiddental.com
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: colors.textPrimary, fontSize: '0.8rem' }}>
              Password: admin123
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ textAlign: 'center', color: colors.textLight, display: 'block' }}>
            © {new Date().getFullYear()} Dr. Zaid Dental Clinic. All rights reserved.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
