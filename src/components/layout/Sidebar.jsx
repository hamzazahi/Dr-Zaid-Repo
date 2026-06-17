import { NavLink } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentsIcon from '@mui/icons-material/Payments';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { colors } from '../../theme/theme';
import { useAuth } from '../../hooks/useAuth';

const DRAWER_WIDTH = 252;

const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [
      { text: 'Dashboard', path: '/', icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
      { text: 'Patients', path: '/patients', icon: <PeopleIcon sx={{ fontSize: 20 }} /> },
      { text: 'Appointments', path: '/appointments', icon: <CalendarMonthIcon sx={{ fontSize: 20 }} /> },
      { text: 'Treatments', path: '/treatments', icon: <MedicalServicesIcon sx={{ fontSize: 20 }} /> },
    ],
  },
  {
    title: 'Clinical',
    items: [
      { text: 'Prescriptions', path: '/prescriptions', icon: <LocalPharmacyIcon sx={{ fontSize: 20 }} /> },
      { text: 'Inventory', path: '/inventory', icon: <InventoryIcon sx={{ fontSize: 20 }} /> },
    ],
  },
  {
    title: 'Finance',
    items: [
      { text: 'Billing', path: '/billing', icon: <ReceiptIcon sx={{ fontSize: 20 }} /> },
      { text: 'Payments', path: '/payments', icon: <PaymentsIcon sx={{ fontSize: 20 }} /> },
    ],
  },
  {
    title: 'System',
    items: [
      { text: 'Reports', path: '/reports', icon: <AssessmentIcon sx={{ fontSize: 20 }} /> },
      { text: 'Settings', path: '/settings', icon: <SettingsIcon sx={{ fontSize: 20 }} /> },
    ],
  },
];

const NavSection = ({ title, items }) => (
  <Box sx={{ mb: 1 }}>
    <Typography
      variant="overline"
      sx={{
        display: 'block',
        px: 2,
        mb: 0.5,
        color: 'rgba(255,255,255,0.35)',
        fontSize: '0.65rem',
        letterSpacing: '0.08em',
      }}
    >
      {title}
    </Typography>
    <List disablePadding sx={{ px: 1 }}>
      {items.map((item) => (
        <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
          <ListItemButton
            component={NavLink}
            to={item.path}
            end={item.path === '/'}
            sx={{
              borderRadius: '6px',
              minHeight: 38,
              px: 1.5,
              py: 0.6,
              color: 'rgba(255,255,255,0.6)',
              '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.45)', minWidth: 36 },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.07)',
                color: '#fff',
                '& .MuiListItemIcon-root': { color: '#fff' },
              },
              '&.active': {
                bgcolor: colors.primary,
                color: '#fff',
                '& .MuiListItemIcon-root': { color: '#fff' },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  </Box>
);

const Sidebar = () => {
  const { user, signOut } = useAuth();

  const initials = user?.initials ||
    (user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'DR');

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: colors.sidebar,
          color: '#fff',
          borderRight: 'none',
          boxShadow: '1px 0 0 rgba(255,255,255,0.06)',
        },
      }}
    >
      <Box sx={{ px: 2, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Avatar
          sx={{
            bgcolor: colors.primary,
            width: 36,
            height: 36,
            fontWeight: 700,
            fontSize: '0.8rem',
          }}
        >
          DC
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', lineHeight: 1.3 }}
          >
            Dr. Zaid Dental
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
            Management System
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2, mb: 2 }} />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', pb: 1 }}>
        {NAV_SECTIONS.map((section) => (
          <NavSection key={section.title} title={section.title} items={section.items} />
        ))}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2, my: 1.5 }} />

      <Box sx={{ p: 2, pt: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.25,
            borderRadius: '6px',
            bgcolor: 'rgba(255,255,255,0.06)',
            mb: 1,
          }}
        >
          <Avatar
            sx={{ width: 32, height: 32, bgcolor: colors.success, fontSize: '0.7rem', fontWeight: 700 }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#fff' }}>
              {user?.name || 'Dr. Zaid'}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
              {user?.role || 'Administrator'}
            </Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
          onClick={signOut}
          sx={{
            color: 'rgba(255,255,255,0.5)',
            justifyContent: 'flex-start',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 500,
            py: 0.75,
            px: 1.5,
            textTransform: 'none',
            '&:hover': { color: '#fff', bgcolor: 'rgba(239, 68, 68, 0.15)' },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
