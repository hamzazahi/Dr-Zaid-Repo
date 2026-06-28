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
  Science as LabIcon,
  LocalShipping as InLabIcon,
  WarningAmber as OverdueIcon,
  CheckCircle as DoneIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/helpers';
import { TOOTH_NUMBERS } from '../utils/constants';
import { colors } from '../theme/theme';

const CASE_TYPES = ['Crown', 'Bridge', 'Denture', 'Veneer', 'Inlay/Onlay', 'Aligner', 'Implant Crown', 'Retainer'];
const STATUSES = ['Sent', 'In Progress', 'Received', 'Fitted'];

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const STATUS_CFG = {
  Sent:          { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  'In Progress': { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Received:      { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' },
  Fitted:        { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
};

const todayStr = () => new Date().toISOString().split('T')[0];
const isOverdue = (c) => c.dueDate && c.dueDate < todayStr() && c.status !== 'Received' && c.status !== 'Fitted';

const DATE_INPUT_SX = {
  border: '1px solid #DFE4EC', borderRadius: '7px', bgcolor: '#FBFCFE', px: '12px', py: '14px',
  fontSize: '0.9rem', fontFamily: 'inherit', color: '#1F2937', width: '100%', boxSizing: 'border-box',
  colorScheme: 'light', cursor: 'pointer',
  '&:hover': { borderColor: '#0F4C81' }, '&:focus': { outline: 'none', borderColor: '#0F4C81' },
};

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Sent;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

const EMPTY_FORM = { patientId: '', dentistId: 'dentist-1', labName: '', caseType: 'Crown', toothNumber: '11', cost: '', dueDate: '', notes: '' };

export default function LabWork() {
  const { patients, dentists, labCases, addLabCase, updateLabCaseStatus } = useClinicData();
  const { notify } = useNotification();

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuCase, setMenuCase] = useState(null);

  const stats = useMemo(() => ({
    total: labCases.length,
    inLab: labCases.filter((c) => c.status === 'Sent' || c.status === 'In Progress').length,
    overdue: labCases.filter(isOverdue).length,
    completed: labCases.filter((c) => c.status === 'Fitted').length,
  }), [labCases]);

  const filtered = useMemo(() => labCases.filter((c) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || c.patientName.toLowerCase().includes(qLow) || c.labName?.toLowerCase().includes(qLow) || c.caseType?.toLowerCase().includes(qLow);
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchQ && matchStatus;
  }), [labCases, q, statusFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (!form.labName.trim()) { setFormError('Lab / vendor name is required.'); return; }
    if (!form.cost || Number(form.cost) < 0) { setFormError('Please enter a valid lab cost.'); return; }
    const patient = patients.find((p) => p.id === form.patientId);
    addLabCase(form);
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`Lab case created for ${patient?.name}.`, 'success');
  };

  const openMenu = (e, labCase) => { setMenuAnchor(e.currentTarget); setMenuCase(labCase); };
  const closeMenu = () => { setMenuAnchor(null); setMenuCase(null); };
  const setStatus = (status) => {
    updateLabCaseStatus(menuCase.id, status);
    notify(`${menuCase.caseType} for ${menuCase.patientName} marked ${status}.`, 'success');
    closeMenu();
  };

  const statCards = [
    { label: 'Total Cases', value: stats.total,     icon: <LabIcon />,     bg: '#EEF2FF', color: colors.primary },
    { label: 'In Lab',      value: stats.inLab,     icon: <InLabIcon />,   bg: '#FFFBEB', color: '#D97706' },
    { label: 'Overdue',     value: stats.overdue,   icon: <OverdueIcon />, bg: '#FEF2F2', color: colors.error },
    { label: 'Fitted',      value: stats.completed, icon: <DoneIcon />,    bg: '#ECFDF5', color: colors.success },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Lab Work</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Track external lab cases from sent to fitted, with due dates and costs.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          New Lab Case
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
          <TextField placeholder="Search patient, lab, case type…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="All">All Statuses</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} case{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Lab Case Register</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{labCases.length} cases total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Case</TableCell>
                <TableCell>Tooth</TableCell>
                <TableCell>Lab / Vendor</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Due</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <LabIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || statusFilter !== 'All' ? 'No cases match your search' : 'No lab cases yet'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || statusFilter !== 'All' ? 'Try adjusting your filters.' : 'Click "New Lab Case" to track the first one.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const overdue = isOverdue(c);
                  return (
                    <TableRow key={c.id} sx={{ bgcolor: overdue ? '#FFF5F5' : 'inherit' }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(c.patientName) }}>
                            {c.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.84rem' }}>{c.patientName}</Typography>
                            <Typography variant="caption" sx={{ color: colors.textSecondary }}>{c.dentistName}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: '#E0F2FE' }}>
                          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369A1' }}>{c.caseType}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight={700}>{c.toothNumber === 'All' ? 'All' : `#${c.toothNumber}`}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{c.labName}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(c.sentDate)}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: overdue ? 700 : 400, color: overdue ? colors.error : colors.textSecondary }}>
                          {c.dueDate ? formatDate(c.dueDate) : '—'}{overdue ? ' · overdue' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={600}>{formatCurrency(c.cost)}</Typography></TableCell>
                      <TableCell><StatusPill status={c.status} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => openMenu(e, c)}><MoreIcon sx={{ fontSize: 18 }} /></IconButton>
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
          <MenuItem key={s} onClick={() => setStatus(s)} disabled={menuCase?.status === s} sx={{ fontSize: '0.85rem', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_CFG[s].dot }} />
            Mark {s}
          </MenuItem>
        ))}
      </Menu>

      {/* New lab case dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          New Lab Case
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
                <TextField select label="Dentist" name="dentistId" value={form.dentistId} onChange={handleChange} fullWidth>
                  {dentists.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Case Type" name="caseType" value={form.caseType} onChange={handleChange} fullWidth>
                  {CASE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Tooth" name="toothNumber" value={form.toothNumber} onChange={handleChange} fullWidth>
                  <MenuItem value="All">All Teeth</MenuItem>
                  <MenuItem value="—">—</MenuItem>
                  {TOOTH_NUMBERS.map((n) => <MenuItem key={n} value={n}>#{n}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Lab / Vendor *" name="labName" value={form.labName} onChange={handleChange} placeholder="e.g. Apex Dental Lab" fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Lab Cost (PKR) *" name="cost" type="number" value={form.cost} onChange={handleChange} fullWidth required inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>Due Date</Typography>
                <Box component="input" type="date" name="dueDate" value={form.dueDate} min={todayStr()} onChange={handleChange} sx={DATE_INPUT_SX} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline rows={2} placeholder="Shade, material, instructions…" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Create Case</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
