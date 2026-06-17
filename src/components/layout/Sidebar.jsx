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
  Chip,
  Button,
  Stack,
  Tooltip,
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
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { colors } from '../../theme/theme';
import { useAuth } from '../../hooks/useAuth';
import { useClinicData } from '../../hooks/useClinicData';

const drawerWidth = 260;

const mainMenuItems = [
  { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { text: 'Patients', path: '/patients', icon: <PeopleIcon /> },
  { text: 'Appointments', path: '/appointments', icon: <CalendarMonthIcon /> },
  { text: 'Treatments', path: '/treatments', icon: <MedicalServicesIcon /> },
];

const clinicalMenuItems = [
  { text: 'Prescriptions', path: '/prescriptions', icon: <LocalPharmacyIcon /> },
  { text: 'Inventory', path: '/inventory', icon: <InventoryIcon /> },
];

const financeMenuItems = [
  { text: 'Billing', path: '/billing', icon: <ReceiptIcon /> },
  { text: 'Payments', path: '/payments', icon: <PaymentsIcon /> },
];

const systemMenuItems = [
  { text: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

const MenuSection = ({ title, items }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        px: 2,
        mb: 0.75,
        color: colors.textLight,
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {title}
    </Typography>
    <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 0, px: 1 }}>
      {items.map((item) => (
        <ListItem key={item.text} disablePadding>
          <ListItemButton
            component={NavLink}
            to={item.path}
            sx={{
              minHeight: 40,
              borderRadius: '6px',
              color: colors.textSecondary,
              px: 1.5,
              transition: 'all 0.2s ease-in-out',
              '& .MuiListItemIcon-root': {
                color: colors.textLight,
                minWidth: 40,
              },
              '&:hover': {
                bgcolor: colors.surfaceAlt,
                color: colors.primary,
                '& .MuiListItemIcon-root': {
                  color: colors.primary,
                },
              },
              '&.active': {
                bgcolor: colors.primary + '15',
                color: colors.primary,
                fontWeight: 600,
                '& .MuiListItemIcon-root': {
                  color: colors.primary,
                },
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  </Box>
);

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const { patients, appointments } = useClinicData();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: colors.sidebar,
          color: colors.textInverse,
          borderRight: `1px solid ${colors.primary}20`,
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {/* Logo Section */}
      <Box sx={{ px: 2, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Avatar
          sx={{
            bgcolor: colors.primary,
            width: 40,
            height: 40,
            boxShadow: '0 2px 8px rgba(15, 76, 129, 0.3)',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          DC
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography 
            variant="subtitle2" 
            noWrap 
            sx={{ 
              fontWeight: 700,
              fontSize: '0.95rem',
              color: colors.textInverse,
            }}
          >
            Dental Clinic
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: colors.textLight,
              fontSize: '0.7rem', 
              fontWeight: 500,
              display: 'block',
              mt: 0.25,
            }}
          >
            Management System
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, borderColor: colors.primary + '20', mb: 2 }} />

      {/* Quick Stats */}
      <Box sx={{ px: 2, mb: 2.5 }}>
        <Box
          sx={{
            p: 1.25,
            borderRadius: '6px',
            bgcolor: colors.primary + '15',
            border: `1px solid ${colors.primary}30`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: colors.textLight,
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
              }}
            >
              Today's Activity
            </Typography>
            <Chip
              label="Live"
              size="small"
              sx={{
                height: 18,
                bgcolor: colors.success + '20',
                color: colors.success,
                fontSize: '0.65rem',
                fontWeight: 700,
              }}
            />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.textInverse }}>
                {patients.length}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: colors.textLight,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
              >
                Patients
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.textInverse }}>
                {appointments.length}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: colors.textLight,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
              >
                Appointments
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Navigation Sections */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 0.5, py: 0.5 }}>
        <MenuSection title="Main" items={mainMenuItems} />
        <MenuSection title="Clinical" items={clinicalMenuItems} />
        <MenuSection title="Finance" items={financeMenuItems} />
        <MenuSection title="System" items={systemMenuItems} />
      </Box>

      <Divider sx={{ mx: 2, borderColor: colors.primary + '20', my: 2 }} />

      {/* User Profile & Logout */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.25,
            borderRadius: '6px',
            bgcolor: colors.primary + '20',
            border: `1px solid ${colors.primary}30`,
            mb: 1,
          }}
        >
          <Avatar
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: colors.success,
              fontSize: '0.75rem', 
              fontWeight: 700,
            }}
          >
            {user?.initials || 'ZA'}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography 
              variant="body2" 
              noWrap 
              sx={{ 
                fontWeight: 700,
                color: colors.textInverse,
              }}
            >
              {user?.name || 'Dr. Zaid'}
            </Typography>
            <Chip
              icon={<VerifiedUserIcon sx={{ fontSize: '0.75rem !important' }} />}
              label={user?.role || 'Admin'}
              size="small"
              sx={{
                mt: 0.5,
                height: 18,
                borderRadius: '4px',
                bgcolor: colors.success + '20',
                color: colors.success,
                fontSize: '0.65rem',
                fontWeight: 700,
                '& .MuiChip-icon': { color: colors.success }
              }}
            />
          </Box>
        </Box>
        <Button
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={signOut}
          sx={{
            color: colors.textLight,
            border: `1px solid ${colors.primary}30`,
            bgcolor: 'transparent',
            fontSize: '0.875rem',
            fontWeight: 600,
            '&:hover': {
              color: colors.error,
              bgcolor: colors.error + '15',
              borderColor: colors.error + '30',
            }
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
