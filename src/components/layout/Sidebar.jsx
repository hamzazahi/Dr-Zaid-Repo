import { NavLink } from 'react-router-dom';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Dashboard    as DashIcon,
  People       as PeopleIcon,
  CalendarMonth as CalIcon,
  EventRepeat   as RecallIcon,
  MedicalServices as TreatIcon,
  FactCheck    as PlanIcon,
  Receipt      as BillingIcon,
  Payments     as PayIcon,
  Assessment   as ReportsIcon,
  Groups       as StaffIcon,
  LocalPharmacy as RxIcon,
  Science      as LabIcon,
  Inventory    as InvIcon,
  Settings     as SettingsIcon,
  Logout       as LogoutIcon,
  ChevronLeft  as CollapseIcon,
  ChevronRight as ExpandIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const W  = 256;   // expanded width  (px)
const WC = 64;    // collapsed width (px)

const SECTIONS = [
  {
    label: 'Overview',
    items: [
      { text: 'Dashboard',    path: '/',              icon: DashIcon    },
      { text: 'Patients',     path: '/patients',      icon: PeopleIcon  },
      { text: 'Appointments', path: '/appointments',  icon: CalIcon     },
      { text: 'Recalls',      path: '/recalls',       icon: RecallIcon  },
      { text: 'Treatments',   path: '/treatments',    icon: TreatIcon   },
      { text: 'Treatment Plans', path: '/treatment-plans', icon: PlanIcon },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { text: 'Prescriptions', path: '/prescriptions', icon: RxIcon  },
      { text: 'Lab Work',      path: '/lab-work',      icon: LabIcon },
      { text: 'Inventory',     path: '/inventory',     icon: InvIcon },
    ],
  },
  {
    label: 'Finance',
    items: [
      { text: 'Billing',  path: '/billing',  icon: BillingIcon },
      { text: 'Payments', path: '/payments', icon: PayIcon     },
    ],
  },
  {
    label: 'System',
    items: [
      { text: 'Staff',    path: '/staff',    icon: StaffIcon    },
      { text: 'Reports',  path: '/reports',  icon: ReportsIcon  },
      { text: 'Settings', path: '/settings', icon: SettingsIcon },
    ],
  },
];

const AV_COLORS = ['#2563EB','#7C3AED','#059669','#D97706','#0D9488'];
const avatarBg  = (name) => AV_COLORS[(name?.charCodeAt(0) || 0) % AV_COLORS.length];

export default function Sidebar({ collapsed, onToggle, transition }) {
  const { user, signOut } = useAuth();

  const initials = user?.initials
    || (user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'DR');
  const bg = avatarBg(user?.name);
  const w  = collapsed ? WC : W;

  return (
    <Drawer
      variant="permanent"
      sx={{
        /*
         * Applying width + transition to BOTH the Drawer root element and
         * its paper ensures the flex placeholder and the visible panel stay
         * perfectly in sync — no gap, no jump.
         */
        width: w,
        flexShrink: 0,
        transition,
        '& .MuiDrawer-paper': {
          width: w,
          boxSizing: 'border-box',
          bgcolor: '#0A1628',
          border: 'none',
          boxShadow: '1px 0 0 rgba(255,255,255,0.05)',
          overflowX: 'hidden',
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          transition,
        },
      }}
    >
      {/* ── Brand bar ── */}
      <Box sx={{
        height: 60,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        px: collapsed ? 0 : 2,
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {collapsed ? (
          /* Mini logo when collapsed */
          <Box sx={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, #1565A8, #0F4C81)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <rect x="8" y="2" width="6" height="18" rx="2" fill="white"/>
              <rect x="2" y="8" width="18" height="6" rx="2" fill="white"/>
            </svg>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                background: 'linear-gradient(135deg, #1565A8, #0F4C81)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                  <rect x="8" y="2" width="6" height="18" rx="2" fill="white"/>
                  <rect x="2" y="8" width="18" height="6" rx="2" fill="white"/>
                </svg>
              </Box>
              <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                <Typography noWrap sx={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
                  DentSuite
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Collapse sidebar" placement="right">
              <IconButton
                size="small"
                onClick={onToggle}
                sx={{ ml: 0.5, flexShrink: 0, color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
              >
                <CollapseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* ── Scrollable nav ── */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', py: 1.5, pb: 2 }}>
        {SECTIONS.map((section) => (
          <Box key={section.label} sx={{ mb: 0.5 }}>
            {!collapsed ? (
              <Typography sx={{
                px: 2.5, mb: 0.5, mt: 1,
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
              }}>
                {section.label}
              </Typography>
            ) : (
              <Box sx={{ height: 8 }} />
            )}

            <List disablePadding sx={{ px: collapsed ? 0.75 : 1 }}>
              {section.items.map(({ text, path, icon: Icon }) => (
                <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={collapsed ? text : ''} placement="right" arrow>
                    <ListItemButton
                      component={NavLink}
                      to={path}
                      end={path === '/'}
                      sx={{
                        borderRadius: '8px',
                        minHeight: 38,
                        px: collapsed ? 0 : 1.25,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: collapsed ? 0 : 1.25,
                        color: 'rgba(255,255,255,0.5)',
                        position: 'relative',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.07)',
                          color: 'rgba(255,255,255,0.9)',
                        },
                        '&.active': {
                          bgcolor: 'rgba(15,76,129,0.55)',
                          color: '#fff',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0, top: '20%', bottom: '20%',
                            width: 3,
                            borderRadius: '0 3px 3px 0',
                            bgcolor: '#60A5FA',
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, color: 'inherit', justifyContent: 'center' }}>
                        <Icon sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      {!collapsed && (
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: 'inherit', whiteSpace: 'nowrap' }}>
                          {text}
                        </Typography>
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* ── User footer ── */}
      <Box sx={{
        flexShrink: 0,
        width: '100%',                            // explicit 100% of paper width
        boxSizing: 'border-box',                  // padding stays inside this width
        borderTop: '1px solid rgba(255,255,255,0.06)',
        p: collapsed ? '10px 8px' : '10px 12px',
        overflow: 'hidden',                        // clip any rogue overflow
      }}>
        {/* Expand toggle (collapsed mode only) */}
        {collapsed && (
          <Tooltip title="Expand sidebar" placement="right">
            <IconButton
              onClick={onToggle}
              size="small"
              sx={{ width: '100%', borderRadius: '8px', color: 'rgba(255,255,255,0.35)', mb: 1, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.07)' } }}
            >
              <ExpandIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}

        {/* User card — width 100% + overflow hidden prevents clipping beyond sidebar edge */}
        <Tooltip title={collapsed ? `${user?.name || 'DentSuite'} · ${user?.role || 'Admin'}` : ''} placement="right">
          <Box sx={{
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 1.25,
            justifyContent: collapsed ? 'center' : 'flex-start',
            p: '8px',
            borderRadius: '8px',
            bgcolor: 'rgba(255,255,255,0.05)',
            mb: 0.75,
            overflow: 'hidden',                   // text truncation works correctly
          }}>
            {/* Avatar */}
            <Box sx={{
              width: 30, height: 30, borderRadius: '50%',
              bgcolor: bg, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {initials}
              </Typography>
            </Box>

            {/* Name + role — only in expanded mode */}
            {!collapsed && (
              <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <Typography noWrap sx={{ color: '#fff', fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.2 }}>
                  {user?.name || 'DentSuite'}
                </Typography>
                <Typography noWrap sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.66rem' }}>
                  {user?.role || 'Administrator'}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>

        {/* Sign out */}
        <Tooltip title={collapsed ? 'Sign Out' : ''} placement="right">
          <Box
            onClick={signOut}
            sx={{
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 1.25,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 0 : 1.25,
              py: '7px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: 'rgba(239,68,68,0.12)', color: '#F87171' },
            }}
          >
            <LogoutIcon sx={{ fontSize: 17, flexShrink: 0 }} />
            {!collapsed && (
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'inherit', whiteSpace: 'nowrap' }}>
                Sign Out
              </Typography>
            )}
          </Box>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
