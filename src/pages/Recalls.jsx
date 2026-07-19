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
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  EventRepeat as RecallIcon,
  NotificationsActive as DueIcon,
  WarningAmber as OverdueIcon,
  CheckCircle as DoneIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  MailOutline as MailIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/helpers';
import { RECALL_CHANNELS } from '../utils/constants';
import { colors } from '../theme/theme';

const RECALL_TYPES = ['6-Month Checkup', 'Cleaning / Scaling', 'Follow-up', 'Ortho Adjustment', 'Implant Review', 'Whitening Touch-up'];
const STATUSES = ['Pending', 'Reminded', 'Completed', 'Dismissed'];

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const STATUS_CFG = {
  Pending:   { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  Reminded:  { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Completed: { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  Dismissed: { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
};

const todayStr = () => new Date().toISOString().split('T')[0];
const isOverdue = (r) => r.dueDate && r.dueDate < todayStr() && (r.status === 'Pending' || r.status === 'Reminded');
const isDueSoon = (r) => {
  if (r.status !== 'Pending' && r.status !== 'Reminded') return false;
  if (!r.dueDate) return false;
  const diff = (new Date(r.dueDate) - new Date(todayStr())) / 86400000;
  return diff >= 0 && diff <= 7;
};

const DATE_INPUT_SX = {
  border: '1px solid #DFE4EC', borderRadius: '7px', bgcolor: '#FBFCFE', px: '12px', py: '14px',
  fontSize: '0.9rem', fontFamily: 'inherit', color: '#1F2937', width: '100%', boxSizing: 'border-box',
  colorScheme: 'light', cursor: 'pointer',
  '&:hover': { borderColor: '#0F4C81' }, '&:focus': { outline: 'none', borderColor: '#0F4C81' },
};

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

const EMPTY_FORM = { patientId: '', type: '6-Month Checkup', dueDate: '', channel: 'WhatsApp', notes: '' };

export default function Recalls() {
  const { patients, recalls, addRecall, sendRecallReminder, updateRecallStatus } = useClinicData();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRecall, setMenuRecall] = useState(null);

  const stats = useMemo(() => ({
    total: recalls.length,
    dueSoon: recalls.filter(isDueSoon).length,
    overdue: recalls.filter(isOverdue).length,
    completed: recalls.filter((r) => r.status === 'Completed').length,
  }), [recalls]);

  const filtered = useMemo(() => recalls.filter((r) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || r.patientName.toLowerCase().includes(qLow) || r.type?.toLowerCase().includes(qLow);
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchQ && matchStatus;
  }), [recalls, q, statusFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (!form.dueDate) { setFormError('Please choose a due date.'); return; }
    const patient = patients.find((p) => p.id === form.patientId);
    addRecall(form);
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`Recall scheduled for ${patient?.name}.`, 'success');
  };

  const handleSend = (r) => {
    sendRecallReminder(r.id);
    notify(`${r.channel || 'WhatsApp'} reminder sent to ${r.patientName}.`, 'success');
  };

  const openMenu = (e, recall) => { setMenuAnchor(e.currentTarget); setMenuRecall(recall); };
  const closeMenu = () => { setMenuAnchor(null); setMenuRecall(null); };
  const setStatus = (status) => {
    updateRecallStatus(menuRecall.id, status);
    notify(`Recall for ${menuRecall.patientName} marked ${status}.`, 'success');
    closeMenu();
  };

  const statCards = [
    { label: 'Total Recalls', value: stats.total,     icon: <RecallIcon />,  bg: '#EEF2FF', color: colors.primary },
    { label: 'Due This Week', value: stats.dueSoon,   icon: <DueIcon />,     bg: '#E0F2FE', color: '#0369A1' },
    { label: 'Overdue',       value: stats.overdue,   icon: <OverdueIcon />, bg: '#FEF2F2', color: colors.error },
    { label: 'Completed',     value: stats.completed, icon: <DoneIcon />,    bg: '#ECFDF5', color: colors.success },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Recalls &amp; Reminders</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Schedule patient recalls and send WhatsApp, SMS, or email reminders for due check-ups.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          New Recall
        </Button>
      </Box>

      {/* Channel notice */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: '10px', bgcolor: '#EAF2FB', border: '1px solid #C3DCF3' }}>
        <MailIcon sx={{ fontSize: 18, color: colors.primary }} />
        <Typography variant="body2" sx={{ color: '#0A3254', fontSize: '0.82rem' }}>
          Reminders go out via <strong>WhatsApp, SMS, or email</strong> (simulated until the messaging gateway is connected). Sending logs the date against each recall.
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
          <TextField placeholder="Search patient or recall type…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="All">All Statuses</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} recall{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Recall Schedule</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{recalls.length} recalls total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 880 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Recall Type</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Last Reminder</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <RecallIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || statusFilter !== 'All' ? 'No recalls match your search' : 'No recalls scheduled'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || statusFilter !== 'All' ? 'Try adjusting your filters.' : 'Click "New Recall" to schedule the first one.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const overdue = isOverdue(r);
                  const actionable = r.status === 'Pending' || r.status === 'Reminded';
                  return (
                    <TableRow key={r.id} sx={{ bgcolor: overdue ? '#FFF5F5' : 'inherit' }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(r.patientName) }}>
                            {r.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{r.patientName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.83rem' }}>{r.type}</Typography>
                        <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.68rem' }}>via {r.channel || 'WhatsApp'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: overdue ? 700 : 400, color: overdue ? colors.error : colors.textSecondary }}>
                          {r.dueDate ? formatDate(r.dueDate) : '-'}{overdue ? ' · overdue' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{r.lastReminderAt ? formatDate(r.lastReminderAt) : '-'}</Typography></TableCell>
                      <TableCell><StatusPill status={r.status} /></TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          {actionable && (
                            <Tooltip title="Send email reminder">
                              <Button size="small" startIcon={<MailIcon sx={{ fontSize: 15 }} />} onClick={() => handleSend(r)} sx={{ fontWeight: 600, fontSize: '0.74rem', textTransform: 'none', whiteSpace: 'nowrap' }}>
                                Remind
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip title="Book appointment">
                            <Button size="small" onClick={() => navigate('/appointments', { state: { openSchedule: true } })} sx={{ fontWeight: 600, fontSize: '0.74rem', textTransform: 'none', whiteSpace: 'nowrap', color: colors.textSecondary }}>
                              Book
                            </Button>
                          </Tooltip>
                          <IconButton size="small" aria-label="Open actions menu" onClick={(e) => openMenu(e, r)}><MoreIcon sx={{ fontSize: 18 }} /></IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Status menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        {STATUSES.map((s) => (
          <MenuItem key={s} onClick={() => setStatus(s)} disabled={menuRecall?.status === s} sx={{ fontSize: '0.85rem', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_CFG[s].dot }} />
            Mark {s}
          </MenuItem>
        ))}
      </Menu>

      {/* New recall dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Schedule Recall
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Fields marked * are required.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select label="Patient" name="patientId" value={form.patientId} onChange={handleChange} fullWidth required>
                  {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Recall Type" name="type" value={form.type} onChange={handleChange} fullWidth>
                  {RECALL_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>Due Date *</Typography>
                <Box component="input" type="date" name="dueDate" value={form.dueDate} min={todayStr()} onChange={handleChange} sx={DATE_INPUT_SX} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Reminder Channel" name="channel" value={form.channel} onChange={handleChange} fullWidth>
                  {RECALL_CHANNELS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline rows={2} placeholder="Reason for recall, instructions…" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Schedule Recall</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
