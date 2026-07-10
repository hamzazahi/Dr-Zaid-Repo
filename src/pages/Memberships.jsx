import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  CardMembership as MemberIcon,
  Autorenew as RenewIcon,
  EventBusy as ExpiringIcon,
  Payments as RevenueIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const STATUS_CFG = {
  Active:    { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  Expired:   { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  Cancelled: { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
};

const DATE_INPUT_SX = {
  border: '1px solid #DFE4EC', borderRadius: '7px', bgcolor: '#FBFCFE', px: '12px', py: '14px',
  fontSize: '0.9rem', fontFamily: 'inherit', color: '#1F2937', width: '100%', boxSizing: 'border-box',
  colorScheme: 'light', cursor: 'pointer',
  '&:hover': { borderColor: '#0F4C81' }, '&:focus': { outline: 'none', borderColor: '#0F4C81' },
};

const todayStr = () => new Date().toISOString().split('T')[0];
const daysUntil = (d) => Math.floor((new Date(d) - new Date(todayStr())) / 86400000);
// Active membership past its renewal date reads as Expired.
const effectiveStatus = (m) => (m.status === 'Cancelled' ? 'Cancelled' : (m.renewalDate && m.renewalDate < todayStr() ? 'Expired' : 'Active'));

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Active;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

const emptyEnroll = () => ({ patientId: '', planId: '', startDate: todayStr() });
const emptyPlan = () => ({ name: '', price: '', cycle: 'Annual', discount: '', benefits: '' });

export default function Memberships() {
  const { patients, membershipPlans, memberships, addMembershipPlan, enrollMembership, updateMembershipStatus, renewMembership } = useClinicData();
  const { notify } = useNotification();

  const [openEnroll, setOpenEnroll] = useState(false);
  const [openPlan, setOpenPlan] = useState(false);
  const [enroll, setEnroll] = useState(emptyEnroll());
  const [plan, setPlan] = useState(emptyPlan());
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuMem, setMenuMem] = useState(null);

  const rows = useMemo(() => memberships.map((m) => ({ ...m, effective: effectiveStatus(m) })), [memberships]);

  const stats = useMemo(() => ({
    active: rows.filter((m) => m.effective === 'Active').length,
    revenue: rows.filter((m) => m.effective === 'Active').reduce((s, m) => s + (m.price || 0), 0),
    expiring: rows.filter((m) => m.effective === 'Active' && daysUntil(m.renewalDate) <= 30).length,
    plans: membershipPlans.length,
  }), [rows, membershipPlans]);

  const filtered = useMemo(() => rows.filter((m) => {
    const qLow = q.trim().toLowerCase();
    return !qLow || m.patientName.toLowerCase().includes(qLow) || m.planName?.toLowerCase().includes(qLow);
  }), [rows, q]);

  const handleEnroll = (e) => {
    e.preventDefault();
    if (!enroll.patientId) { setError('Please select a patient.'); return; }
    if (!enroll.planId) { setError('Please select a plan.'); return; }
    const patient = patients.find((p) => p.id === enroll.patientId);
    enrollMembership(enroll);
    setOpenEnroll(false); setEnroll(emptyEnroll()); setError('');
    notify(`${patient?.name} enrolled.`, 'success');
  };

  const handleAddPlan = (e) => {
    e.preventDefault();
    if (!plan.name.trim()) { setError('Plan name is required.'); return; }
    if (!plan.price || Number(plan.price) <= 0) { setError('Please enter a valid price.'); return; }
    addMembershipPlan(plan);
    setOpenPlan(false); setPlan(emptyPlan()); setError('');
    notify(`Plan "${plan.name}" added.`, 'success');
  };

  const openMenu = (e, mem) => { setMenuAnchor(e.currentTarget); setMenuMem(mem); };
  const closeMenu = () => { setMenuAnchor(null); setMenuMem(null); };
  const doRenew = () => { renewMembership(menuMem.id); notify(`${menuMem.patientName}'s membership renewed.`, 'success'); closeMenu(); };
  const doCancel = () => { updateMembershipStatus(menuMem.id, 'Cancelled'); notify(`${menuMem.patientName}'s membership cancelled.`, 'success'); closeMenu(); };
  const doReactivate = () => { updateMembershipStatus(menuMem.id, 'Active'); notify(`${menuMem.patientName}'s membership reactivated.`, 'success'); closeMenu(); };

  const statCards = [
    { label: 'Active Members',  value: stats.active,                 icon: <MemberIcon />,   bg: '#EEF2FF', color: colors.primary },
    { label: 'Recurring Value', value: formatCurrency(stats.revenue), icon: <RevenueIcon />,  bg: '#ECFDF5', color: colors.success },
    { label: 'Expiring ≤30d',   value: stats.expiring,               icon: <ExpiringIcon />, bg: '#FFFBEB', color: '#D97706' },
    { label: 'Plans',           value: stats.plans,                  icon: <CheckIcon />,    bg: '#F5F3FF', color: '#6D28D9' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Memberships</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>In-house membership plans — recurring revenue and patient loyalty.</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => { setError(''); setOpenPlan(true); }} sx={{ borderRadius: '8px', fontWeight: 700 }}>New Plan</Button>
          <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => { setError(''); setOpenEnroll(true); }} sx={{ borderRadius: '8px', fontWeight: 700 }}>Enroll Patient</Button>
        </Stack>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2}>
        {statCards.map((card) => (
          <Grid item xs={6} md={3} key={card.label}>
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>{card.label}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: colors.textPrimary, letterSpacing: '-0.02em', mt: 0.25 }}>{card.value}</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: card.bg, color: card.color, display: 'flex', fontSize: 22 }}>{card.icon}</Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Plan tier cards */}
      <Grid container spacing={2}>
        {membershipPlans.map((p) => (
          <Grid item xs={12} md={4} key={p.id}>
            <Card sx={{ borderRadius: '14px', overflow: 'hidden', height: '100%', border: `1px solid ${colors.border}` }}>
              <Box sx={{ height: 5, bgcolor: p.color }} />
              <Box sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: colors.textPrimary }}>{p.name}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{p.cycle} · {p.discount}% off treatments</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: p.color, letterSpacing: '-0.02em' }}>{formatCurrency(p.price)}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textLight }}>/ {p.cycle === 'Annual' ? 'year' : 'month'}</Typography>
                  </Box>
                </Stack>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1.5 }}>
                  <CheckIcon sx={{ fontSize: 16, color: p.color, mt: '2px' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{p.benefits}</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2, py: 1.75, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField placeholder="Search member or plan…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} member{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Enrollments table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Enrolled Members</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{memberships.length} enrollments total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Renews</TableCell>
                <TableCell align="right">Fee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <MemberIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q ? 'No members match your search' : 'No members enrolled'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q ? 'Try a different search.' : 'Click "Enroll Patient" to add the first member.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => {
                  const expiringSoon = m.effective === 'Active' && daysUntil(m.renewalDate) <= 30;
                  return (
                    <TableRow key={m.id} sx={{ bgcolor: m.effective === 'Expired' ? '#FFF5F5' : 'inherit' }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(m.patientName) }}>
                            {m.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{m.patientName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: '0.83rem' }}>{m.planName}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(m.startDate)}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: expiringSoon || m.effective === 'Expired' ? 700 : 400, color: m.effective === 'Expired' ? colors.error : expiringSoon ? '#D97706' : colors.textSecondary }}>
                          {formatDate(m.renewalDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={600}>{formatCurrency(m.price)}</Typography></TableCell>
                      <TableCell><StatusPill status={m.effective} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" aria-label="Open actions menu" onClick={(e) => openMenu(e, m)}><MoreIcon sx={{ fontSize: 18 }} /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Member action menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={doRenew} sx={{ fontSize: '0.85rem', gap: 1 }}><RenewIcon sx={{ fontSize: 17 }} /> Renew (+1 {menuMem?.cycle === 'Monthly' ? 'month' : 'year'})</MenuItem>
        {menuMem?.status === 'Cancelled'
          ? <MenuItem onClick={doReactivate} sx={{ fontSize: '0.85rem' }}>Reactivate</MenuItem>
          : <MenuItem onClick={doCancel} sx={{ fontSize: '0.85rem', color: colors.error }}>Cancel membership</MenuItem>}
      </Menu>

      {/* Enroll dialog */}
      <Dialog open={openEnroll} onClose={() => { setOpenEnroll(false); setError(''); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Enroll Patient</DialogTitle>
        <form onSubmit={handleEnroll} noValidate>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}
            <TextField select label="Patient" value={enroll.patientId} onChange={(e) => { setEnroll((p) => ({ ...p, patientId: e.target.value })); setError(''); }} fullWidth required>
              {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField select label="Plan" value={enroll.planId} onChange={(e) => { setEnroll((p) => ({ ...p, planId: e.target.value })); setError(''); }} fullWidth required>
              {membershipPlans.map((p) => <MenuItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}/{p.cycle === 'Annual' ? 'yr' : 'mo'}</MenuItem>)}
            </TextField>
            <Box>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>Start Date</Typography>
              <Box component="input" type="date" value={enroll.startDate} onChange={(e) => setEnroll((p) => ({ ...p, startDate: e.target.value }))} sx={DATE_INPUT_SX} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenEnroll(false); setError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Enroll</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add plan dialog */}
      <Dialog open={openPlan} onClose={() => { setOpenPlan(false); setError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>New Membership Plan</DialogTitle>
        <form onSubmit={handleAddPlan} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField label="Plan Name" value={plan.name} onChange={(e) => { setPlan((p) => ({ ...p, name: e.target.value })); setError(''); }} fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Price (PKR)" type="number" value={plan.price} onChange={(e) => { setPlan((p) => ({ ...p, price: e.target.value })); setError(''); }} fullWidth required inputProps={{ min: 0 }} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Billing Cycle" value={plan.cycle} onChange={(e) => setPlan((p) => ({ ...p, cycle: e.target.value }))} fullWidth>
                  <MenuItem value="Annual">Annual</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}><TextField label="Treatment Discount (%)" type="number" value={plan.discount} onChange={(e) => setPlan((p) => ({ ...p, discount: e.target.value }))} fullWidth inputProps={{ min: 0, max: 100 }} /></Grid>
              <Grid item xs={12}><TextField label="Benefits" value={plan.benefits} onChange={(e) => setPlan((p) => ({ ...p, benefits: e.target.value }))} fullWidth multiline rows={2} placeholder="e.g. 2 cleanings, 1 exam per year" /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenPlan(false); setError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Add Plan</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
