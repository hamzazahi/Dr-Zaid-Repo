import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Card,
  Grid,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  History as LogIcon,
  Today as TodayIcon,
  Category as ModuleIcon,
  Person as UserIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { colors } from '../theme/theme';

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const MODULE_COLOR = {
  Patients: '#2563EB', Appointments: '#7C3AED', Treatments: '#0D9488', 'Treatment Plans': '#0F4C81',
  Clinical: '#DB2777', Prescriptions: '#A16207', Billing: '#059669', Insurance: '#0369A1',
  Memberships: '#6D28D9', 'Online Booking': '#C2410C', Forms: '#15803D', Staff: '#475569',
  'Lab Work': '#B45309', Recalls: '#1D4ED8', Documents: '#7E22CE', Expenses: '#DC2626',
};

const fmtWhen = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '-';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

function ModuleChip({ module }) {
  const color = MODULE_COLOR[module] || '#475569';
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: `${color}14` }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color }}>{module}</Typography>
    </Box>
  );
}

export default function AuditLog() {
  const { auditLog } = useClinicData();

  const [q, setQ] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  const modules = useMemo(() => [...new Set(auditLog.map((e) => e.module))].sort(), [auditLog]);

  const stats = useMemo(() => {
    const todayS = new Date().toISOString().split('T')[0];
    return {
      total: auditLog.length,
      today: auditLog.filter((e) => (e.at || '').startsWith(todayS)).length,
      modules: modules.length,
      users: [...new Set(auditLog.map((e) => e.user))].length,
    };
  }, [auditLog, modules]);

  const filtered = useMemo(() => auditLog.filter((e) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || e.detail?.toLowerCase().includes(qLow) || e.action?.toLowerCase().includes(qLow) || e.user?.toLowerCase().includes(qLow);
    const matchModule = moduleFilter === 'All' || e.module === moduleFilter;
    return matchQ && matchModule;
  }), [auditLog, q, moduleFilter]);

  const statCards = [
    { label: 'Total Events',  value: stats.total,   icon: <LogIcon />,    bg: '#EEF2FF', color: colors.primary },
    { label: 'Today',         value: stats.today,   icon: <TodayIcon />,  bg: '#E0F2FE', color: '#0369A1' },
    { label: 'Modules',       value: stats.modules, icon: <ModuleIcon />, bg: '#F5F3FF', color: '#6D28D9' },
    { label: 'Users',         value: stats.users,   icon: <UserIcon />,   bg: '#ECFDF5', color: colors.success },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Audit Log</Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Append-only activity trail - every key action is recorded automatically.</Typography>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2}>
        {statCards.map((card) => (
          <Grid item xs={6} md={3} key={card.label}>
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>{card.label}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: colors.textPrimary, letterSpacing: '-0.02em', mt: 0.25 }}>{card.value}</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: card.bg, color: card.color, display: 'flex', fontSize: 22 }}>{card.icon}</Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2, py: 1.75, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField placeholder="Search action, detail, user…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="All">All Modules</MenuItem>
            {modules.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Log table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Activity Trail</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>Newest first · read-only</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Detail</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <LogIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || moduleFilter !== 'All' ? 'No events match your search' : 'No activity yet'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || moduleFilter !== 'All' ? 'Try adjusting your filters.' : 'Actions across the app will appear here automatically.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><Typography variant="body2" sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>{fmtWhen(e.at)}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: '0.64rem', fontWeight: 700, bgcolor: avatarColor(e.user) }}>
                          {e.user?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{e.user}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><ModuleChip module={e.module} /></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.83rem', fontWeight: 700 }}>{e.action}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 360 }}><Typography variant="body2" sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>{e.detail || '-'}</Typography></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
