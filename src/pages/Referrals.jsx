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
  SwapHoriz as ReferralIcon,
  CallMade as OutboundIcon,
  CallReceived as InboundIcon,
  CheckCircle as DoneIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';

const SPECIALTIES = ['Oral & Maxillofacial Surgery', 'Orthodontics', 'Endodontics', 'Periodontics', 'Prosthodontics', 'Pediatric Dentistry', 'General Practice', 'Other'];
const STATUSES = ['Pending', 'Contacted', 'Scheduled', 'Completed', 'Cancelled'];

const STATUS_CFG = {
  Pending:   { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  Contacted: { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Scheduled: { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' },
  Completed: { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  Cancelled: { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
};

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

function DirectionPill({ direction }) {
  const out = direction === 'Outbound';
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: out ? '#EFF6FF' : '#ECFDF5' }}>
      {out ? <OutboundIcon sx={{ fontSize: 12, color: '#1D4ED8' }} /> : <InboundIcon sx={{ fontSize: 12, color: '#065F46' }} />}
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: out ? '#1D4ED8' : '#065F46' }}>{direction}</Typography>
    </Box>
  );
}

const NOT_REGISTERED = '__external__';
const EMPTY_FORM = { direction: 'Outbound', patientId: '', patientName: '', provider: '', practice: '', specialty: 'Oral & Maxillofacial Surgery', reason: '', notes: '' };

export default function Referrals() {
  const { patients, referrals, addReferral, updateReferralStatus } = useClinicData();
  const { notify } = useNotification();

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuReferral, setMenuReferral] = useState(null);

  const stats = useMemo(() => ({
    total: referrals.length,
    outbound: referrals.filter((r) => r.direction === 'Outbound').length,
    inbound: referrals.filter((r) => r.direction === 'Inbound').length,
    completed: referrals.filter((r) => r.status === 'Completed').length,
  }), [referrals]);

  const filtered = useMemo(() => referrals.filter((r) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || r.patientName.toLowerCase().includes(qLow) || r.provider?.toLowerCase().includes(qLow) || r.practice?.toLowerCase().includes(qLow) || r.specialty?.toLowerCase().includes(qLow);
    const matchDirection = directionFilter === 'All' || r.direction === directionFilter;
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchQ && matchDirection && matchStatus;
  }), [referrals, q, directionFilter, statusFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const external = form.patientId === NOT_REGISTERED;
    if (!form.patientId) { setFormError('Please select a patient (or "Not registered yet").'); return; }
    if (external && !form.patientName.trim()) { setFormError('Please enter the patient\'s name.'); return; }
    if (!form.provider.trim()) { setFormError('Please enter the referring/referred provider name.'); return; }
    if (!form.reason.trim()) { setFormError('Please enter the reason for referral.'); return; }
    const ref = addReferral({ ...form, patientId: external ? null : form.patientId });
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`${ref.direction} referral created for ${ref.patientName}.`, 'success');
  };

  const openMenu = (e, referral) => { setMenuAnchor(e.currentTarget); setMenuReferral(referral); };
  const closeMenu = () => { setMenuAnchor(null); setMenuReferral(null); };
  const setStatus = (status) => {
    updateReferralStatus(menuReferral.id, status);
    notify(`Referral for ${menuReferral.patientName} marked ${status}.`, 'success');
    closeMenu();
  };

  const statCards = [
    { label: 'Total Referrals', value: stats.total,     icon: <ReferralIcon />, bg: '#EEF2FF', color: colors.primary },
    { label: 'Outbound',        value: stats.outbound,  icon: <OutboundIcon />, bg: '#EFF6FF', color: '#1D4ED8' },
    { label: 'Inbound',         value: stats.inbound,   icon: <InboundIcon />,  bg: '#ECFDF5', color: '#065F46' },
    { label: 'Completed',       value: stats.completed, icon: <DoneIcon />,     bg: '#F0FDF4', color: colors.success },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Referrals</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Track patients referred to specialists and referrals received from other providers.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          New Referral
        </Button>
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
          <TextField placeholder="Search patient, provider, or practice…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="All">All Directions</MenuItem>
            <MenuItem value="Outbound">Outbound</MenuItem>
            <MenuItem value="Inbound">Inbound</MenuItem>
          </TextField>
          <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="All">All Statuses</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} referral{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Referral Log</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{referrals.length} referrals total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Specialty</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <ReferralIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || directionFilter !== 'All' || statusFilter !== 'All' ? 'No referrals match your filters' : 'No referrals yet'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || directionFilter !== 'All' || statusFilter !== 'All' ? 'Try adjusting your search.' : 'Click "New Referral" to log the first one.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(r.patientName) }}>
                          {r.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{r.patientName}</Typography>
                          {!r.patientId && <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 600 }}>Not registered</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><DirectionPill direction={r.direction} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{r.provider}</Typography>
                      <Typography variant="caption" sx={{ color: colors.textSecondary }}>{r.practice}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{r.specialty}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 220 }}><Typography variant="body2" sx={{ fontSize: '0.8rem', color: colors.textSecondary }} noWrap>{r.reason}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(r.date)}</Typography></TableCell>
                    <TableCell><StatusPill status={r.status} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => openMenu(e, r)}><MoreIcon sx={{ fontSize: 18 }} /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Status menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        {STATUSES.map((s) => (
          <MenuItem key={s} onClick={() => setStatus(s)} disabled={menuReferral?.status === s} sx={{ fontSize: '0.85rem', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_CFG[s].dot }} />
            Mark {s}
          </MenuItem>
        ))}
      </Menu>

      {/* New referral dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          New Referral
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Fields marked * are required.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select label="Direction" name="direction" value={form.direction} onChange={handleChange} fullWidth>
                  <MenuItem value="Outbound">Outbound — we refer out</MenuItem>
                  <MenuItem value="Inbound">Inbound — referred to us</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Patient *" name="patientId" value={form.patientId} onChange={handleChange} fullWidth required>
                  {form.direction === 'Inbound' && <MenuItem value={NOT_REGISTERED}>— Not registered yet —</MenuItem>}
                  {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              {form.patientId === NOT_REGISTERED && (
                <Grid item xs={12}>
                  <TextField label="Patient Name *" name="patientName" value={form.patientName} onChange={handleChange} fullWidth required placeholder="Name of the incoming patient" />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField label={form.direction === 'Outbound' ? 'Referred To (Provider) *' : 'Referred By (Provider) *'} name="provider" value={form.provider} onChange={handleChange} fullWidth required placeholder="e.g. Dr. Kamran Qureshi" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Practice / Clinic" name="practice" value={form.practice} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Specialty" name="specialty" value={form.specialty} onChange={handleChange} fullWidth>
                  {SPECIALTIES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Reason for Referral *" name="reason" value={form.reason} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline rows={2} placeholder="Additional context, urgency, attached reports…" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Create Referral</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
