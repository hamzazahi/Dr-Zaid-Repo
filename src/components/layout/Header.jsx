import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { colors } from '../../theme/theme';
import { useAuth } from '../../hooks/useAuth';
import { useClinicData } from '../../hooks/useClinicData';

const PAGE_TITLES = {
  '/': 'Clinical Dashboard',
  '/patients': 'Patient Registry',
  '/appointments': 'Appointment Scheduler',
  '/treatments': 'Treatment Management',
  '/billing': 'Billing & Invoicing',
  '/payments': 'Payments Ledger',
  '/prescriptions': 'Prescriptions',
  '/inventory': 'Inventory Management',
  '/reports': 'Analytics & Reports',
  '/settings': 'Settings & Configuration',
};

const getPageTitle = (pathname) => {
  for (const [key, value] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || (key !== '/' && pathname.startsWith(key))) return value;
  }
  return 'Dental Clinic Management';
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { invoices } = useClinicData();

  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const overdueInvoices = invoices.filter(
    (inv) => inv.balanceDue > 0 && new Date(inv.dueDate) < new Date()
  );
  const notifCount = overdueInvoices.length;

  const initials = user?.initials ||
    (user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR');

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        px: { xs: 1.5, md: 3 },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 60, px: '0 !important', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            noWrap
            sx={{ color: colors.textPrimary, fontWeight: 700, lineHeight: 1.3 }}
          >
            {getPageTitle(location.pathname)}
          </Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={notifCount > 0 ? `${notifCount} overdue invoice(s)` : 'Notifications'}>
            <IconButton
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              sx={{ color: colors.textSecondary, '&:hover': { color: colors.primary, bgcolor: colors.surfaceAlt } }}
            >
              <Badge badgeContent={notifCount || null} color="error">
                <NotificationsOutlinedIcon sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { minWidth: 300, borderRadius: '8px', mt: 0.5 } }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${colors.border}` }}>
              <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
            </Box>
            {overdueInvoices.length === 0 ? (
              <MenuItem disabled sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">No pending notifications</Typography>
              </MenuItem>
            ) : (
              overdueInvoices.slice(0, 5).map((inv) => (
                <MenuItem
                  key={inv.id}
                  onClick={() => { navigate('/billing'); setNotifAnchor(null); }}
                  sx={{ py: 1.5, flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <Typography variant="body2" fontWeight={600}>Overdue: {inv.invoiceNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {inv.patientName} — Balance: {inv.balanceDue?.toLocaleString('en-PK')} PKR
                  </Typography>
                </MenuItem>
              ))
            )}
          </Menu>

          <Tooltip title="Profile">
            <IconButton
              onClick={(e) => setProfileAnchor(e.currentTarget)}
              sx={{ p: 0.5, ml: 0.5, '&:hover': { bgcolor: colors.surfaceAlt } }}
            >
              <Avatar sx={{ width: 34, height: 34, bgcolor: colors.primary, fontSize: '0.8rem', fontWeight: 700 }}>
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { minWidth: 220, borderRadius: '8px', mt: 0.5 } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" fontWeight={700}>{user?.name || 'Administrator'}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email || ''}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { navigate('/settings'); setProfileAnchor(null); }}>
              <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); setProfileAnchor(null); }}>
              <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
              My Profile
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => { signOut(); setProfileAnchor(null); }}
              sx={{ color: colors.error }}
            >
              <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: colors.error }} /></ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
