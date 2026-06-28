import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Avatar, Badge, Box, Divider, IconButton,
  InputAdornment, ListItemIcon, Menu, MenuItem,
  TextField, Toolbar, Tooltip, Typography,
} from '@mui/material';
import {
  NotificationsOutlined as BellIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  PersonOutline as PersonIcon,
  Close as CloseIcon,
  Person as PatientIcon,
  CalendarMonth as ApptIcon,
  Receipt as InvIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useClinicData } from '../../hooks/useClinicData';
import { colors } from '../../theme/theme';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/patients': 'Patients',
  '/appointments': 'Appointments',
  '/treatments': 'Treatments',
  '/treatment-plans': 'Treatment Plans',
  '/billing': 'Billing',
  '/payments': 'Payments',
  '/prescriptions': 'Prescriptions',
  '/inventory': 'Inventory',
  '/lab-work': 'Lab Work',
  '/staff': 'Staff',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

const getTitle = (pathname) => {
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || (key !== '/' && pathname.startsWith(key))) return val;
  }
  return 'Dental CMS';
};

// ─── Global Search ──────────────────────────────────────────────────────────
function GlobalSearch() {
  const navigate = useNavigate();
  const { patients, appointments, invoices } = useClinicData();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const q = query.trim().toLowerCase();

  const results = q.length < 2 ? [] : [
    ...patients
      .filter((p) => p.name?.toLowerCase().includes(q) || p.phone?.includes(q))
      .slice(0, 3)
      .map((p) => ({ type: 'Patient', label: p.name, sub: p.phone || p.email || '', path: `/patients/${p.id}`, icon: <PatientIcon sx={{ fontSize: 15 }} /> })),
    ...appointments
      .filter((a) => a.patientName?.toLowerCase().includes(q) || a.date?.includes(q))
      .slice(0, 3)
      .map((a) => ({ type: 'Appointment', label: a.patientName, sub: `${a.date} · ${a.time} · ${a.type}`, path: `/appointments`, icon: <ApptIcon sx={{ fontSize: 15 }} /> })),
    ...invoices
      .filter((i) => i.invoiceNumber?.toLowerCase().includes(q) || i.patientName?.toLowerCase().includes(q))
      .slice(0, 2)
      .map((i) => ({ type: 'Invoice', label: i.invoiceNumber, sub: `${i.patientName} · Rs. ${i.totalAmount?.toLocaleString()}`, path: `/billing`, icon: <InvIcon sx={{ fontSize: 15 }} /> })),
  ];

  const handleSelect = (path) => {
    navigate(path);
    setQuery('');
    setOpen(false);
  };

  const TYPE_COLOR = { Patient: '#2563EB', Appointment: '#7C3AED', Invoice: '#D97706' };

  return (
    <Box sx={{ position: 'relative', flex: 1, maxWidth: 440 }}>
      <TextField
        inputRef={inputRef}
        placeholder="Search patients, appointments, invoices…"
        value={query}
        size="small"
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 17, color: colors.textLight }} />
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>
                <CloseIcon sx={{ fontSize: 15, color: colors.textLight }} />
              </IconButton>
            </InputAdornment>
          ) : (
            <InputAdornment position="end">
              <Typography sx={{ fontSize: '0.65rem', color: colors.textLight, bgcolor: colors.surfaceAlt, px: 0.75, py: 0.25, borderRadius: '4px', border: `1px solid ${colors.border}`, fontFamily: 'monospace' }}>
                Ctrl K
              </Typography>
            </InputAdornment>
          ),
          sx: {
            bgcolor: colors.surfaceAlt,
            borderRadius: '8px',
            fontSize: '0.83rem',
            '& fieldset': { borderColor: 'transparent' },
            '&:hover fieldset': { borderColor: colors.border },
            '&.Mui-focused': { bgcolor: '#fff' },
            '&.Mui-focused fieldset': { borderColor: colors.primary + ' !important', borderWidth: '1.5px !important' },
          },
        }}
        fullWidth
      />

      {/* Dropdown */}
      {open && results.length > 0 && (
        <Box sx={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 1400,
          bgcolor: '#fff', borderRadius: '10px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
          {/* Group by type */}
          {['Patient', 'Appointment', 'Invoice'].map((type) => {
            const group = results.filter((r) => r.type === type);
            if (!group.length) return null;
            return (
              <Box key={type}>
                <Box sx={{ px: 1.5, py: 0.75, bgcolor: '#FAFAFA', borderBottom: `1px solid ${colors.borderLight}` }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.textLight, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {type}s
                  </Typography>
                </Box>
                {group.map((r, i) => (
                  <Box
                    key={i}
                    onMouseDown={() => handleSelect(r.path)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.25,
                      px: 1.5, py: 1.1, cursor: 'pointer',
                      borderBottom: `1px solid ${colors.borderLight}`,
                      '&:hover': { bgcolor: '#F8F9FF' },
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box sx={{ color: TYPE_COLOR[r.type], display: 'flex' }}>{r.icon}</Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: colors.textPrimary }}>{r.label}</Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', px: 0.75, py: 0.25, borderRadius: '4px', bgcolor: `${TYPE_COLOR[r.type]}12` }}>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: TYPE_COLOR[r.type] }}>{r.type}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      )}

      {open && q.length >= 2 && results.length === 0 && (
        <Box sx={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 1400,
          bgcolor: '#fff', borderRadius: '10px', border: `1px solid ${colors.border}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', p: 2.5, textAlign: 'center',
        }}>
          <SearchIcon sx={{ fontSize: 28, color: colors.textLight, mb: 0.5 }} />
          <Typography sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>No results for <strong>"{query}"</strong></Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { invoices } = useClinicData();

  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const overdue = invoices.filter((inv) => inv.balanceDue > 0 && new Date(inv.dueDate) < new Date());
  const initials = user?.initials || (user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'DR');

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#fff',
        borderBottom: `1px solid ${colors.border}`,
        zIndex: 1100,
        top: 0,
        left: 'auto',
        right: 0,
      }}
    >
      <Toolbar sx={{ minHeight: 60, px: { xs: 2, md: 3 }, gap: 2 }}>
        {/* Page breadcrumb */}
        <Box sx={{ flexShrink: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: colors.textPrimary, lineHeight: 1 }}>
            {getTitle(location.pathname)}
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: colors.textLight, mt: '2px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </Typography>
        </Box>

        {/* Divider */}
        <Box sx={{ width: '1px', height: 24, bgcolor: colors.border, flexShrink: 0 }} />

        {/* Global search */}
        <GlobalSearch />

        {/* Right actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
          {/* Notification bell */}
          <Tooltip title={overdue.length ? `${overdue.length} overdue invoices` : 'All clear'}>
            <IconButton
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              sx={{ color: colors.textSecondary, '&:hover': { bgcolor: colors.surfaceAlt, color: colors.primary } }}
            >
              <Badge badgeContent={overdue.length || null} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 16, minWidth: 16 } }}>
                <BellIcon sx={{ fontSize: 21 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notification panel */}
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: 320, borderRadius: '12px', mt: 0.75, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' } }}
          >
            <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}` }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</Typography>
              {overdue.length > 0 && (
                <Box sx={{ px: 0.75, py: 0.25, borderRadius: '6px', bgcolor: '#FEF2F2' }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#DC2626' }}>{overdue.length} overdue</Typography>
                </Box>
              )}
            </Box>
            {overdue.length === 0 ? (
              <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>✅</Typography>
                <Typography sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>All payments are up to date</Typography>
              </Box>
            ) : (
              overdue.slice(0, 5).map((inv) => (
                <MenuItem
                  key={inv.id}
                  onClick={() => { navigate('/billing'); setNotifAnchor(null); }}
                  sx={{ py: 1.25, px: 2, gap: 1.25, alignItems: 'flex-start', borderBottom: `1px solid ${colors.borderLight}` }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444', mt: '5px', flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{inv.invoiceNumber}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: colors.textSecondary }}>{inv.patientName}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600 }}>Rs. {inv.balanceDue?.toLocaleString()} due</Typography>
                  </Box>
                </MenuItem>
              ))
            )}
            {overdue.length > 5 && (
              <Box sx={{ px: 2, py: 1, textAlign: 'center', borderTop: `1px solid ${colors.border}` }}>
                <Typography sx={{ fontSize: '0.75rem', color: colors.primary, fontWeight: 600, cursor: 'pointer' }} onClick={() => { navigate('/billing'); setNotifAnchor(null); }}>
                  View all {overdue.length} overdue invoices →
                </Typography>
              </Box>
            )}
          </Menu>

          {/* Profile avatar */}
          <Tooltip title="Account">
            <IconButton
              onClick={(e) => setProfileAnchor(e.currentTarget)}
              sx={{ p: 0.5, ml: 0.5 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: colors.primary, fontSize: '0.75rem', fontWeight: 700 }}>
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* Profile menu */}
          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { minWidth: 220, borderRadius: '12px', mt: 0.75, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: colors.textPrimary }}>{user?.name || 'Administrator'}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: colors.textSecondary }}>{user?.email}</Typography>
              <Box sx={{ mt: 0.75, display: 'inline-flex', px: 0.75, py: 0.25, borderRadius: '4px', bgcolor: '#EFF6FF' }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {user?.role || 'Admin'}
                </Typography>
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={() => { navigate('/settings'); setProfileAnchor(null); }} sx={{ gap: 1.25, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 0 }}><SettingsIcon sx={{ fontSize: 17 }} /></ListItemIcon>
              <Typography sx={{ fontSize: '0.85rem' }}>Settings</Typography>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); setProfileAnchor(null); }} sx={{ gap: 1.25, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 0 }}><PersonIcon sx={{ fontSize: 17 }} /></ListItemIcon>
              <Typography sx={{ fontSize: '0.85rem' }}>My Profile</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { signOut(); setProfileAnchor(null); }} sx={{ gap: 1.25, py: 1, color: '#DC2626' }}>
              <ListItemIcon sx={{ minWidth: 0 }}><LogoutIcon sx={{ fontSize: 17, color: '#DC2626' }} /></ListItemIcon>
              <Typography sx={{ fontSize: '0.85rem', color: '#DC2626', fontWeight: 600 }}>Sign Out</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
