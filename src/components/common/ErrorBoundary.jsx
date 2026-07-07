import { Component } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ReportProblemOutlined as ErrorIcon } from '@mui/icons-material';
import { colors } from '../../theme/theme';

// Catches render-time crashes in the page area so users see a recoverable
// message instead of a blank screen. The app shell (sidebar/header) stays
// mounted because this wraps only the routed content.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface for developers; a real monitoring hook (Sentry etc.) plugs in
    // here during the backend phase.
    console.error('Unhandled render error:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Box sx={{ py: 10, px: 3, textAlign: 'center' }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <ErrorIcon sx={{ fontSize: 30, color: colors.error }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}>Something went wrong on this page</Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 3, maxWidth: 420, mx: 'auto' }}>
          Your data is safe. Try again, or use the sidebar to open a different page.
        </Typography>
        <Button variant="contained" onClick={this.handleReset} sx={{ fontWeight: 700, mr: 1 }}>Try Again</Button>
        <Button color="inherit" onClick={() => window.location.reload()} sx={{ fontWeight: 600 }}>Reload App</Button>
      </Box>
    );
  }
}
