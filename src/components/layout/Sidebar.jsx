import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Box,
  Collapse,
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
  EventAvailable as BookingIcon,
  MedicalServices as TreatIcon,
  FactCheck    as PlanIcon,
  Receipt      as BillingIcon,
  Payments     as PayIcon,
  TrendingDown as ExpenseIcon,
  HealthAndSafety as ClaimIcon,
  CardMembership as MemberIcon,
  Assessment   as ReportsIcon,
  Groups       as StaffIcon,
  History      as AuditIcon,
  LocalPharmacy as RxIcon,
  Science      as LabIcon,
  FolderShared as DocsIcon,
  Description   as FormsIcon,
  Straighten    as PerioIcon,
  Inventory    as InvIcon,
  Collections  as ImagingIcon,
  SwapHoriz    as ReferralIcon,
  Campaign     as MarketingIcon,
  Forum        as MessagesIcon,
  AutoAwesome  as AssistantIcon,
  Business     as LocationIcon,
  Settings     as SettingsIcon,
  Logout       as LogoutIcon,
  ChevronLeft  as CollapseIcon,
  ChevronRight as ExpandIcon,
  ExpandMore   as SectionChevron,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const W  = 256;   // expanded width  (px)
const WC = 64;    // collapsed width (px)

const SECTIONS = [
  {
    label: 'Overview',
    items: [
      { text: 'Dashboard',    path: '/',              icon: DashIcon    },
      { text: 'DentIQ Assistant', path: '/assistant', icon: AssistantIcon },
      { text: 'Patients',     path: '/patients',      icon: PeopleIcon  },
      { text: 'Appointments', path: '/appointments',  icon: CalIcon     },
      { text: 'Recalls',      path: '/recalls',       icon: RecallIcon  },
      { text: 'Online Booking', path: '/online-booking', icon: BookingIcon },
      { text: 'Messages',     path: '/messages',      icon: MessagesIcon },
      { text: 'Marketing',    path: '/marketing',     icon: MarketingIcon },
      { text: 'Treatments',   path: '/treatments',    icon: TreatIcon   },
      { text: 'Treatment Plans', path: '/treatment-plans', icon: PlanIcon },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { text: 'Prescriptions', path: '/prescriptions', icon: RxIcon  },
      { text: 'Lab Work',      path: '/lab-work',      icon: LabIcon },
      { text: 'Documents',     path: '/documents',     icon: DocsIcon },
      { text: 'Forms',         path: '/forms',         icon: FormsIcon },
      { text: 'Perio Chart',   path: '/perio',         icon: PerioIcon },
      { text: 'Imaging',       path: '/imaging',       icon: ImagingIcon },
      { text: 'Referrals',     path: '/referrals',     icon: ReferralIcon },
      { text: 'Inventory',     path: '/inventory',     icon: InvIcon },
    ],
  },
  {
    label: 'Finance',
    items: [
      { text: 'Billing',  path: '/billing',  icon: BillingIcon },
      { text: 'Payments', path: '/payments', icon: PayIcon     },
      { text: 'Expenses', path: '/expenses', icon: ExpenseIcon },
      { text: 'Insurance', path: '/insurance', icon: ClaimIcon },
      { text: 'Memberships', path: '/memberships', icon: MemberIcon },
    ],
  },
  {
    label: 'System',
    items: [
      { text: 'Locations', path: '/locations', icon: LocationIcon },
      { text: 'Staff',    path: '/staff',    icon: StaffIcon    },
      { text: 'Audit Log', path: '/audit-log', icon: AuditIcon  },
      { text: 'Reports',  path: '/reports',  icon: ReportsIcon  },
      { text: 'Settings', path: '/settings', icon: SettingsIcon },
    ],
  },
];

const AV_COLORS = ['#2563EB','#7C3AED','#059669','#D97706','#0D9488'];
const avatarBg  = (name) => AV_COLORS[(name?.charCodeAt(0) || 0) % AV_COLORS.length];

// Persisted expand/collapse state per nav section. Only EXPLICIT user toggles
// are stored; sections without an entry fall back to the default (Overview
// open, others closed — unless they contain the active route).
const SECTIONS_KEY = 'dental-sidebar-sections';
const readSectionPrefs = () => {
  try {
    return JSON.parse(window.localStorage.getItem(SECTIONS_KEY)) || {};
  } catch {
    return {};
  }
};

export default function Sidebar({ collapsed, onToggle, transition, isMobile = false, mobileOpen = false, onClose }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const [sectionPrefs, setSectionPrefs] = useState(readSectionPrefs);
  // null initial value → the reopen check below also runs on first render,
  // so a reload while on a route inside a closed section still reveals it.
  const [prevPath, setPrevPath] = useState(null);

  const isActivePath = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const sectionHasActive = (section) => section.items.some((i) => isActivePath(i.path));
  const isExpanded = (section) =>
    sectionPrefs[section.label] !== undefined
      ? sectionPrefs[section.label]
      : section.label === 'Overview' || sectionHasActive(section);

  // Render-phase adjustment (React's sanctioned pattern): when navigation
  // lands on a route inside an explicitly-closed section, reopen that section
  // so the active item is never hidden.
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    const activeSection = SECTIONS.find(sectionHasActive);
    if (activeSection && sectionPrefs[activeSection.label] === false) {
      setSectionPrefs((prev) => ({ ...prev, [activeSection.label]: true }));
    }
  }

  const toggleSection = (section) => {
    const next = { ...sectionPrefs, [section.label]: !isExpanded(section) };
    setSectionPrefs(next);
    try {
      window.localStorage.setItem(SECTIONS_KEY, JSON.stringify(next));
    } catch { /* storage unavailable — state still works in-memory */ }
  };

  const initials = user?.initials
    || (user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'DR');
  const bg = avatarBg(user?.name);
  const w  = collapsed ? WC : W;

  return (
    <Drawer
      // Mobile: overlay drawer opened from the header hamburger.
      // Desktop: permanent rail with collapse/expand.
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        /*
         * Applying width + transition to BOTH the Drawer root element and
         * its paper ensures the flex placeholder and the visible panel stay
         * perfectly in sync — no gap, no jump. (Permanent variant only — the
         * temporary variant renders in a modal, so sizing the root would
         * break the backdrop.)
         */
        ...(isMobile ? {} : { width: w, flexShrink: 0, transition }),
        '& .MuiDrawer-paper': {
          width: isMobile ? W : w,
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
            <Tooltip title={isMobile ? 'Close menu' : 'Collapse sidebar'} placement="right">
              <IconButton
                size="small"
                onClick={isMobile ? onClose : onToggle}
                sx={{ ml: 0.5, flexShrink: 0, color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
              >
                <CollapseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* ── Scrollable nav ── */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', py: 1, pb: 2 }}>
        {SECTIONS.map((section) => {
          const expanded = isExpanded(section);
          const items = (
            <List disablePadding sx={{ px: collapsed ? 0.75 : 1 }}>
              {section.items.map(({ text, path, icon: Icon }) => (
                <ListItem key={path} disablePadding sx={{ mb: 0.25 }}>
                  <Tooltip title={collapsed ? text : ''} placement="right" arrow>
                    <ListItemButton
                      component={NavLink}
                      to={path}
                      end={path === '/'}
                      onClick={isMobile ? onClose : undefined}
                      sx={{
                        borderRadius: '8px',
                        minHeight: 31,
                        py: 0,
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
                        <Icon sx={{ fontSize: 17 }} />
                      </ListItemIcon>
                      {!collapsed && (
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'inherit', whiteSpace: 'nowrap' }}>
                          {text}
                        </Typography>
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          );

          // Icon-rail mode has no headers to click — always show every icon.
          if (collapsed) {
            return (
              <Box key={section.label} sx={{ mb: 0.5 }}>
                <Box sx={{ height: 8 }} />
                {items}
              </Box>
            );
          }

          return (
            <Box key={section.label} sx={{ mb: 0.25 }}>
              <Box
                onClick={() => toggleSection(section)}
                role="button"
                aria-expanded={expanded}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 2.5, pr: 1.75, mt: 0.75, mb: 0.25, py: 0.4,
                  cursor: 'pointer', userSelect: 'none', borderRadius: '6px',
                  '&:hover .si-sec-label': { color: 'rgba(255,255,255,0.6)' },
                  '&:hover .si-sec-chevron': { color: 'rgba(255,255,255,0.6)' },
                }}
              >
                <Typography className="si-sec-label" sx={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
                  transition: 'color 0.15s ease',
                }}>
                  {section.label}
                </Typography>
                <SectionChevron className="si-sec-chevron" sx={{
                  fontSize: 15, color: 'rgba(255,255,255,0.25)',
                  transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.18s ease, color 0.15s ease',
                }} />
              </Box>
              <Collapse in={expanded} timeout={180}>
                {items}
              </Collapse>
            </Box>
          );
        })}
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
