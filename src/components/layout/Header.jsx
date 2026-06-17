import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  IconButton,
  Badge,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Stack,
  AvatarGroup,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import { colors } from '../../theme/theme';

const Header = () => {
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get page title based on pathname
  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/': 'Clinical Dashboard',
      '/patients': 'Patient Registry & Records',
      '/appointments': 'Appointment Scheduler',
      '/treatments': 'Treatment Management',
      '/billing': 'Billing & Invoicing',
      '/payments': 'Payments Ledger',
      '/prescriptions': 'Prescriptions',
      '/inventory': 'Inventory Management',
      '/reports': 'Analytics & Reports',
      '/settings': 'Settings & Configuration',
    };
    
    for (const [key, value] of Object.entries(titles)) {
      if (path.startsWith(key)) return value;
    }
    return 'Dental Clinic Management Suite';
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleProfileClick = (event) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setNotificationAnchor(null);
    setProfileAnchor(null);
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        px: { xs: 1.5, md: 3 },
      }}
    >
      <Toolbar 
        sx={{ 
          justifyContent: 'space-between', 
          minHeight: 64, 
          px: '0 !important', 
          gap: 2 
        }}
      >
        {/* Page Title & Breadcrumb */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography 
            variant="h5" 
            noWrap 
            sx={{ 
              color: colors.textPrimary, 
              fontWeight: 700,
              letterSpacing: '-0.01em'
            }}
          >
            {getPageTitle()}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: colors.textSecondary,
              fontWeight: 500 
            }}
          >
            Dental Clinic Management System
          </Typography>
        </Box>

        {/* Right Side Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Status Badges */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Chip
              label="Server: Online"
              size="small"
              sx={{
                bgcolor: colors.success + '15',
                color: colors.success,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
              }}
            />
            <Chip
              label="Synced"
              size="small"
              sx={{
                bgcolor: colors.info + '15',
                color: colors.info,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
              }}
            />
          </Box>

          {/* Time */}
          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: '6px',
              bgcolor: colors.surfaceAlt,
              border: `1px solid ${colors.border}`,
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: colors.textSecondary,
              display: { xs: 'none', md: 'block' },
            }}
          >
            {time.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </Box>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotificationClick}
              sx={{
                color: colors.textSecondary,
                '&:hover': { color: colors.primary, bgcolor: colors.surfaceAlt }
              }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notification Menu */}
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleClose} sx={{ minWidth: 280 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  New appointment scheduled
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Patient: John Doe - 2:30 PM
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Treatment completed
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Root canal - Jane Smith
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Inventory low alert
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Amalgam fillings below threshold
                </Typography>
              </Box>
            </MenuItem>
          </Menu>

          {/* Profile Menu */}
          <Tooltip title="Profile & Settings">
            <IconButton
              onClick={handleProfileClick}
              sx={{
                p: 0.5,
                '&:hover': { bgcolor: colors.surfaceAlt }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  bgcolor: colors.primary,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                DR
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleClose}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Dr. Zaid Ahmed
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Administrator
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleClose}>Settings</MenuItem>
            <MenuItem onClick={handleClose}>Help & Support</MenuItem>
            <MenuItem onClick={handleClose} sx={{ color: colors.error }}>Sign Out</MenuItem>
          </Menu>

          {/* More Options */}
          <Tooltip title="More options">
            <IconButton
              sx={{
                color: colors.textSecondary,
                '&:hover': { color: colors.primary, bgcolor: colors.surfaceAlt }
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
