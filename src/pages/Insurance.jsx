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
  HealthAndSafety as ClaimIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as DeniedIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';

const PAYERS = ['State Life Insurance', 'Jubilee Health', 'EFU Health', 'Adamjee Insurance', 'Pak-Qatar Takaful', 'TPL Insurance', 'Self-Pay / None'];
const STATUSES = ['Draft', 'Submitted', 'In Review', 'Approved', 'Denied', 'Paid'];

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const STATUS_CFG = {
  Draft:       { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
  Submitted:   { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  'In Review': { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Approved:    { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  Denied:      { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  Paid:        { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' },
};

const DATE_INPUT_SX = {
  border: '1px solid #DFE4EC', borderRadius: '7px', bgcolor: '#FBFCFE', px: '12px', py: '14px',
  fontSize: '0.9rem', fontFamily: 'inherit', color: '#1F2937', width: '100%', boxSizing: 'border-box',
  colorScheme: 'light', cursor: 'pointer',
  '&:hover': { borderColor: '#0F4C81' }, '&:focus': { outline: 'none', borderColor: '#0F4C81' },
};

const todayStr = () => new Date().toISOString().split('T')[0];

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Submitted;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

const emptyForm = () => ({ patientId: '', payer: 'Jubilee Health', policyNumber: '', serviceDate: todayStr(), procedures: '', claimedAmount: '', status: 'Submitted', notes: '' });

export default function Insurance() {
  const { patients, claims, addClaim, updateClaimStatus, deleteClaim } = useClinicData();
  const { notify } = useNotification();

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuClaim, setMenuClaim] = useState(null);

  const stats = useMemo(() => ({
    total: claims.length,
    pending: claims.filter((c) => c.status === 'Submitted' || c.status === 'In Review').length,
    approvedValue: claims.filter((c) => c.status === 'Approved' || c.status === 'Paid').reduce((s, c) => s + (c.approvedAmount || 0), 0),
    denied: claims.filter((c) => c.status === 'Denied').length,
  }), [claims]);

  const filtered = useMemo(() => claims.filter((c) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || c.patientName.toLowerCase().includes(qLow) || c.payer?.toLowerCase().includes(qLow) || c.policyNumber?.toLowerCase().includes(qLow);
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchQ && matchStatus;
  }), [claims, q, statusFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (!form.claimedAmount || Number(form.claimedAmount) <= 0) { setFormError('Please enter a valid claimed amount.'); return; }
    const patient = patients.find((p) => p.id === form.patientId);
    addClaim(form);
    setOpenDialog(false);
    setForm(emptyForm());
    setFormError('');
    notify(`Claim created for ${patient?.name}.`, 'success');
  };

  const openMenu = (e, claim) => { setMenuAnchor(e.currentTarget); setMenuClaim(claim); };
  const closeMenu = () => { setMenuAnchor(null); setMenuClaim(null); };
  const setStatus = (status) => {
    updateClaimStatus(menuClaim.id, status);
    notify(`Claim for ${menuClaim.patientName} marked ${status}.`, 'success');
    closeMenu();
  };
  const removeClaim = () => {
    deleteClaim(menuClaim.id);
    notify('Claim deleted.', 'success');
    closeMenu();
  };

  const statCards = [
    { label: 'Total Claims',   value: stats.total,                       icon: <ClaimIcon />,    bg: '#EEF2FF', color: colors.primary },
    { label: 'Pending Review', value: stats.pending,                     icon: <PendingIcon />,  bg: '#FFFBEB', color: '#D97706' },
    { label: 'Approved Value', value: formatCurrency(stats.approvedValue), icon: <ApprovedIcon />, bg: '#ECFDF5', color: colors.success },
    { label: 'Denied',         value: stats.denied,                      icon: <DeniedIcon />,   bg: '#FEF2F2', color: colors.error },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Insurance &amp; Claims</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Submit and track insurance claims through approval and payment.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          New Claim
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
                  <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: colors.textPrimary, letterSpacing: '-0.02em', mt: 0.25 }}>{card.value}</Typography>
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
          <TextField placeholder="Search patient, payer, policy #…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="All">All Statuses</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} claim{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Claims Register</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{claims.length} claims total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Payer</TableCell>
                <TableCell>Policy #</TableCell>
                <TableCell>Service Date</TableCell>
                <TableCell align="right">Claimed</TableCell>
                <TableCell align="right">Approved</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <ClaimIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || statusFilter !== 'All' ? 'No claims match your search' : 'No claims yet'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || statusFilter !== 'All' ? 'Try adjusting your filters.' : 'Click "New Claim" to submit the first one.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(c.patientName) }}>
                          {c.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.84rem' }}>{c.patientName}</Typography>
                          <Typography variant="caption" sx={{ color: colors.textSecondary }} noWrap>{c.procedures || '—'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{c.payer}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: colors.textSecondary }}>{c.policyNumber || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(c.serviceDate)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>{formatCurrency(c.claimedAmount)}</Typography></TableCell>
                    <TableCell align="right"><Typography sx={{ fontWeight: 700, color: c.approvedAmount > 0 ? colors.success : colors.textLight }}>{c.approvedAmount > 0 ? formatCurrency(c.approvedAmount) : '—'}</Typography></TableCell>
                    <TableCell><StatusPill status={c.status} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => openMenu(e, c)}><MoreIcon sx={{ fontSize: 18 }} /></IconButton>
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
          <MenuItem key={s} onClick={() => setStatus(s)} disabled={menuClaim?.status === s} sx={{ fontSize: '0.85rem', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_CFG[s].dot }} />
            Mark {s}
          </MenuItem>
        ))}
        <MenuItem onClick={removeClaim} sx={{ fontSize: '0.85rem', color: colors.error, borderTop: `1px solid ${colors.borderLight}`, mt: 0.5 }}>Delete claim</MenuItem>
      </Menu>

      {/* New claim dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          New Insurance Claim
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Fields marked * are required.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select label="Patient *" name="patientId" value={form.patientId} onChange={handleChange} fullWidth required>
                  {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Payer" name="payer" value={form.payer} onChange={handleChange} fullWidth>
                  {PAYERS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Policy Number" name="policyNumber" value={form.policyNumber} onChange={handleChange} fullWidth placeholder="e.g. JH-882140" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>Service Date</Typography>
                <Box component="input" type="date" name="serviceDate" value={form.serviceDate} max={todayStr()} onChange={handleChange} sx={DATE_INPUT_SX} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Claimed Amount (PKR) *" name="claimedAmount" type="number" value={form.claimedAmount} onChange={handleChange} fullWidth required inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Status" name="status" value={form.status} onChange={handleChange} fullWidth>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Procedures" name="procedures" value={form.procedures} onChange={handleChange} fullWidth placeholder="e.g. Root canal + crown (tooth 36)" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline rows={2} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Create Claim</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
