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
  InputAdornment,
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
  EventAvailable as BookingIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ConfirmedIcon,
  Cancel as DeclinedIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/helpers';
import { TREATMENT_TYPES } from '../utils/constants';
import { colors } from '../theme/theme';

const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'];

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const STATUS_CFG = {
  Pending:   { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Confirmed: { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  Declined:  { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
};

const DATE_INPUT_SX = {
  border: '1px solid #DFE4EC', borderRadius: '7px', bgcolor: '#FBFCFE', px: '12px', py: '14px',
  fontSize: '0.9rem', fontFamily: 'inherit', color: '#1F2937', width: '100%', boxSizing: 'border-box',
  colorScheme: 'light', cursor: 'pointer',
  '&:hover': { borderColor: '#0F4C81' }, '&:focus': { outline: 'none', borderColor: '#0F4C81' },
};

const todayStr = () => new Date().toISOString().split('T')[0];

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

const emptyRequest = () => ({ patientName: '', phone: '', email: '', preferredDate: todayStr(), preferredTime: '10:00 AM', service: 'Consultation', reason: '' });

export default function OnlineBooking() {
  const { patients, dentists, bookingRequests, addBookingRequest, confirmBookingRequest, declineBookingRequest } = useClinicData();
  const { notify } = useNotification();

  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState(emptyRequest());
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [confirmReq, setConfirmReq] = useState(null);
  const [confirmDentist, setConfirmDentist] = useState('dentist-1');
  const [confirmPatient, setConfirmPatient] = useState('');

  const stats = useMemo(() => ({
    total: bookingRequests.length,
    pending: bookingRequests.filter((r) => r.status === 'Pending').length,
    confirmed: bookingRequests.filter((r) => r.status === 'Confirmed').length,
    declined: bookingRequests.filter((r) => r.status === 'Declined').length,
  }), [bookingRequests]);

  const filtered = useMemo(() => bookingRequests.filter((r) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || r.patientName.toLowerCase().includes(qLow) || r.phone?.includes(qLow) || r.service?.toLowerCase().includes(qLow);
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchQ && matchStatus;
  }), [bookingRequests, q, statusFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientName.trim()) { setFormError('Patient name is required.'); return; }
    addBookingRequest(form);
    setOpenNew(false);
    setForm(emptyRequest());
    setFormError('');
    notify('Booking request submitted.', 'success');
  };

  const openConfirm = (req) => {
    setConfirmReq(req);
    setConfirmDentist('dentist-1');
    setConfirmPatient(req.patientId || '');
  };
  const doConfirm = () => {
    confirmBookingRequest(confirmReq.id, { dentistId: confirmDentist, patientId: confirmPatient || null });
    notify(`Appointment booked for ${confirmReq.patientName}.`, 'success');
    setConfirmReq(null);
  };
  const doDecline = (req) => {
    declineBookingRequest(req.id);
    notify(`Request from ${req.patientName} declined.`, 'success');
  };

  const statCards = [
    { label: 'Total Requests', value: stats.total,     icon: <BookingIcon />,   bg: '#EEF2FF', color: colors.primary },
    { label: 'Pending',        value: stats.pending,   icon: <PendingIcon />,   bg: '#FFFBEB', color: '#D97706' },
    { label: 'Confirmed',      value: stats.confirmed, icon: <ConfirmedIcon />, bg: '#ECFDF5', color: colors.success },
    { label: 'Declined',       value: stats.declined,  icon: <DeclinedIcon />,  bg: '#FEF2F2', color: colors.error },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Online Booking</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Review requests from your booking page and confirm them into appointments.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenNew(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          New Request
        </Button>
      </Box>

      {/* Notice */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: '10px', bgcolor: '#EAF2FB', border: '1px solid #C3DCF3' }}>
        <BookingIcon sx={{ fontSize: 18, color: colors.primary }} />
        <Typography variant="body2" sx={{ color: '#0A3254', fontSize: '0.82rem' }}>
          Requests submitted through your public booking page land here. <strong>Confirming</strong> creates the patient (if new) and a scheduled appointment.
        </Typography>
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
          <TextField placeholder="Search name, phone, service…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
            {['All', 'Pending', 'Confirmed', 'Declined'].map((s) => <MenuItem key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} request{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Booking Requests</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{bookingRequests.length} requests total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Preferred</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <BookingIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || statusFilter !== 'All' ? 'No requests match your search' : 'No booking requests'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || statusFilter !== 'All' ? 'Try adjusting your filters.' : 'Requests from your booking page will appear here.'}</Typography>
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
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.84rem' }}>{r.patientName}</Typography>
                          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{r.patientId ? 'Existing patient' : 'New patient'} · {r.source}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PhoneIcon sx={{ fontSize: 13, color: colors.textLight }} /><Typography variant="caption">{r.phone || '—'}</Typography></Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><EmailIcon sx={{ fontSize: 13, color: colors.textLight }} /><Typography variant="caption" sx={{ color: colors.textSecondary }}>{r.email || '—'}</Typography></Box>
                      </Stack>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{formatDate(r.preferredDate)}</Typography><Typography variant="caption" sx={{ color: colors.textSecondary }}>{r.preferredTime}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: colors.primaryAlpha8 }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: colors.primary }}>{r.service}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><StatusPill status={r.status} /></TableCell>
                    <TableCell align="right">
                      {r.status === 'Pending' ? (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="contained" onClick={() => openConfirm(r)} sx={{ fontWeight: 700, fontSize: '0.74rem', whiteSpace: 'nowrap' }}>Confirm</Button>
                          <Button size="small" onClick={() => doDecline(r)} sx={{ fontWeight: 600, fontSize: '0.74rem', textTransform: 'none', color: colors.error }}>Decline</Button>
                        </Stack>
                      ) : (
                        <Typography variant="caption" sx={{ color: colors.textLight }}>{r.status === 'Confirmed' ? 'Booked' : '—'}</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={Boolean(confirmReq)} onClose={() => setConfirmReq(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Confirm Booking</DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: colors.surfaceAlt, border: `1px solid ${colors.border}` }}>
            <Typography variant="body2" fontWeight={700}>{confirmReq?.patientName}</Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>{confirmReq && formatDate(confirmReq.preferredDate)} · {confirmReq?.preferredTime} · {confirmReq?.service}</Typography>
          </Box>
          <TextField select label="Assign Dentist" value={confirmDentist} onChange={(e) => setConfirmDentist(e.target.value)} fullWidth size="small">
            {dentists.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
          <TextField select label="Link to existing patient (optional)" value={confirmPatient} onChange={(e) => setConfirmPatient(e.target.value)} fullWidth size="small">
            <MenuItem value="">{confirmReq?.patientId ? 'Keep linked patient' : 'Create new patient'}</MenuItem>
            {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>
            Confirming creates a scheduled appointment{!confirmReq?.patientId && !confirmPatient ? ' and a new patient record' : ''}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
          <Button onClick={() => setConfirmReq(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={doConfirm} variant="contained" sx={{ fontWeight: 700 }}>Confirm &amp; Book</Button>
        </DialogActions>
      </Dialog>

      {/* New request dialog */}
      <Dialog open={openNew} onClose={() => { setOpenNew(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          New Booking Request
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Simulates a patient submitting via your booking page.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField label="Full Name" name="patientName" value={form.patientName} onChange={handleChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Service" name="service" value={form.service} onChange={handleChange} fullWidth>
                  {TREATMENT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>Preferred Date</Typography>
                <Box component="input" type="date" name="preferredDate" value={form.preferredDate} min={todayStr()} onChange={handleChange} sx={DATE_INPUT_SX} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Preferred Time" name="preferredTime" value={form.preferredTime} onChange={handleChange} fullWidth>
                  {TIME_SLOTS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField label="Reason / Notes" name="reason" value={form.reason} onChange={handleChange} fullWidth multiline rows={2} placeholder="What do you need help with?" /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenNew(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Submit Request</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
