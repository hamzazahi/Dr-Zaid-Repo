import { createTheme } from '@mui/material/styles';

// Professional Healthcare Color Palette
const colors = {
  // Primary Colors - Healthcare Blue
  primary: '#0F4C81',
  primaryLight: '#1565A8',
  primaryDark: '#0A3254',
  
  // Secondary Colors - Accent
  secondary: '#00A86B',
  secondaryLight: '#33C783',
  secondaryDark: '#007A52',
  
  // Sidebar
  sidebar: '#0B1F33',
  sidebarHover: '#132A44',
  sidebarActive: '#0F4C81',
  
  // Neutrals
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F5',
  
  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Semantic Colors
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  
  // Status Colors
  statusScheduled: '#3B82F6',
  statusCompleted: '#10B981',
  statusCancelled: '#6B7280',
  statusPending: '#F59E0B',
  
  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',

  // Soft semantic surfaces (tinted background + matching border) used by alert
  // cards, status pills and stat tiles across the pages.
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  infoBg: '#EFF6FF',
  infoBorder: '#BFDBFE',

  // Primary at 8% alpha — used for subtle "active"/tag backgrounds.
  primaryAlpha8: 'rgba(15, 76, 129, 0.08)',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: '#fff',
    },
    secondary: {
      main: colors.secondary,
      light: colors.secondaryLight,
      dark: colors.secondaryDark,
      contrastText: '#fff',
    },
    success: {
      main: colors.success,
      light: colors.successLight,
      dark: '#059669',
    },
    warning: {
      main: colors.warning,
      light: colors.warningLight,
      dark: '#D97706',
    },
    error: {
      main: colors.error,
      light: colors.errorLight,
      dark: '#DC2626',
    },
    info: {
      main: colors.info,
      light: colors.infoLight,
      dark: '#1D4ED8',
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      disabled: colors.textLight,
    },
    divider: colors.divider,
    action: {
      hover: colors.surfaceAlt,
      selected: colors.primaryLight,
      disabled: colors.textLight,
      disabledBackground: colors.borderLight,
    },
  },
  
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    
    // Display styles
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      color: colors.textPrimary,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: colors.textPrimary,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: colors.textPrimary,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: colors.textPrimary,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: colors.textPrimary,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: colors.textPrimary,
    },
    
    // Body text
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: colors.textPrimary,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.57,
      color: colors.textSecondary,
    },
    
    // Utility text
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.43,
      textTransform: 'none',
      letterSpacing: '0.3px',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 1.66,
      color: colors.textLight,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.4px',
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
  },
  
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '10px 16px',
          borderRadius: '6px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(15, 76, 129, 0.15)',
          },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        containedPrimary: {
          background: colors.primary,
          '&:hover': {
            background: colors.primaryDark,
            boxShadow: '0 4px 12px rgba(15, 76, 129, 0.2)',
          },
        },
        outlined: {
          borderColor: colors.border,
          color: colors.primary,
          '&:hover': {
            borderColor: colors.primary,
            backgroundColor: colors.surfaceAlt,
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        },
        elevation0: {
          boxShadow: 'none',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          borderBottom: `1px solid ${colors.border}`,
        },
      },
    },
    
    MuiDrawer: {
      styleOverrides: {
        root: {
          '& .MuiPaper-root': {
            backgroundColor: colors.sidebar,
            color: colors.surface,
          },
        },
      },
    },
    
    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: colors.textLight,
          margin: '4px 8px',
          borderRadius: '6px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: colors.sidebarHover,
            color: colors.textInverse,
          },
          '&.Mui-selected': {
            backgroundColor: colors.sidebarActive,
            color: colors.textInverse,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: colors.sidebarActive,
            },
          },
        },
      },
    },
    
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontSize: '0.875rem',
            transition: 'all 0.2s ease-in-out',
            '&:hover fieldset': {
              borderColor: colors.primary,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary,
              boxShadow: `0 0 0 3px ${colors.primaryLight}20`,
            },
          },
        },
      },
      defaultProps: {
        size: 'small',
      },
    },
    
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: colors.surfaceAlt,
            fontWeight: 600,
            fontSize: '0.875rem',
            color: colors.textPrimary,
            borderBottom: `2px solid ${colors.border}`,
          },
        },
      },
    },
    
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: colors.borderLight,
          },
        },
      },
    },
    
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          color: colors.textPrimary,
          borderBottom: `1px solid ${colors.border}`,
          padding: '12px 16px',
        },
      },
    },
    
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      },
    },
    
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: '4px',
          borderRadius: '2px',
        },
      },
    },
    
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
        },
      },
    },
  },
  
  spacing: (factor) => `${0.25 * factor}rem`,
  
  shape: {
    borderRadius: 6,
  },
});

export default theme;
export { colors };
