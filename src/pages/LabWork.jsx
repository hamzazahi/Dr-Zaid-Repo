import { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
  Science as LabIcon,
  LocalShipping as InLabIcon,
  WarningAmber as OverdueIcon,
  CheckCircle as DoneIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  CallReceived as ReceiveIcon,
  Replay as ResendIcon,
  DoneAll as FitIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';

// Free-typeable suggestions — staff can enter anything not in the list.
const CASE_TYPES = ['3D Metal', 'CDS', 'PFM', 'Crown', 'Zirconia Crown', 'Bridge', 'Denture', 'Partial Denture', 'Veneer', 'Inlay/Onlay', 'Post & Core', 'Retainer', 'Aligner', 'Implant Crown'];
const STATUSES = ['Sent', 'Trial', 'Final', 'Fitted'];

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const STATUS_CFG = {
  Sent:          { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  Trial:         { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Final:         { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' },
  Fitted:        { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  // legacy values still rendered nicely
  'In Progress': { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Received:      { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' },
};

const todayStr = () => new Date().toISOString().split('T')[0];
const isOut = (c) => c.status === 'Sent' || c.status === 'In Progress';
const isOverdue = (c) => c.dueDate && c.dueDate < todayStr() && isOut(c);
const stampNote = (existing, line) => [existing, line].filter(Boolean).join('\n');

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

const EMPTY_FORM = {
  patientId: '', dentistId: '', labName: '', caseType: '3D Metal', toothNumber: '',
  units: 1, cost: '', dueDate: '', sentBy: '', whatsappSent: false, notes: '',
};

export default function LabWork() {
  const { patients, dentists, labCases, addLabCase, updateLabCase } = useClinicData();
  const { notify } = useNotification();

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuCase, setMenuCase] = useState(null);

  // Receive-back dialog (records Trial / Final outcome)
  const [recvCase, setRecvCase] = useState(null);
  const [recv, setRecv] = useState({ receivedDate: '', receivedBy: '', outcome: 'Trial', remarks: '' });
  // Re-send dialog (send a trial back to the same or another lab)
  const [resendCase, setResendCase] = useState(null);
  const [resend, setResend] = useState({ labName: '', dueDate: '', remarks: '' });

  // Suggest labs already used, plus a couple of defaults, for the free-type field.
  const labOptions = useMemo(() => {
    const set = new Set(labCases.map((c) => c.labName).filter(Boolean));
    return Array.from(set);
  }, [labCases]);

  const stats = useMemo(() => ({
    inLab: labCases.filter(isOut).length,
    trial: labCases.filter((c) => c.status === 'Trial').length,
    overdue: labCases.filter(isOverdue).length,
    fitted: labCases.filter((c) => c.status === 'Fitted').length,
  }), [labCases]);

  const filtered = useMemo(() => labCases.filter((c) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || c.patientName.toLowerCase().includes(qLow) || c.labName?.toLowerCase().includes(qLow) || c.caseType?.toLowerCase().includes(qLow);
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchQ && matchStatus;
  }), [labCases, q, statusFilter]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };
  const handleChange = (e) => setField(e.target.name, e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (!form.labName.trim()) { setFormError('Lab / person name is required.'); return; }
    const patient = patients.find((p) => p.id === form.patientId);
    addLabCase(form);
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`Lab case sent for ${patient?.name}.`, 'success');
  };

  const openMenu = (e, labCase) => { setMenuAnchor(e.currentTarget); setMenuCase(labCase); };
  const closeMenu = () => { setMenuAnchor(null); setMenuCase(null); };

  // ── Receive back ───────────────────────────────────────────────────────────
  const openReceive = () => {
    setRecvCase(menuCase);
    setRecv({ receivedDate: todayStr(), receivedBy: '', outcome: 'Trial', remarks: '' });
    closeMenu();
  };
  const submitReceive = () => {
    const line = `${recv.outcome} received ${formatDate(recv.receivedDate)}${recv.receivedBy ? ` by ${recv.receivedBy}` : ''}${recv.remarks ? ` — ${recv.remarks}` : ''}`;
    updateLabCase(recvCase.id, {
      status: recv.outcome, // 'Trial' or 'Final'
      receivedDate: recv.receivedDate || todayStr(),
      receivedBy: recv.receivedBy.trim(),
      notes: stampNote(recvCase.notes, line),
    });
    notify(`${recvCase.caseType} for ${recvCase.patientName} marked ${recv.outcome}.`, 'success');
    setRecvCase(null);
  };

  // ── Re-send a trial back to a lab (e.g. to Shafqat for porcelain) ───────────
  const openResend = () => {
    setResendCase(menuCase);
    setResend({ labName: menuCase.labName || '', dueDate: '', remarks: '' });
    closeMenu();
  };
  const submitResend = () => {
    const line = `Re-sent ${formatDate(todayStr())} to ${resend.labName}${resend.remarks ? ` — ${resend.remarks}` : ''}`;
    updateLabCase(resendCase.id, {
      status: 'Sent',
      labName: resend.labName.trim() || resendCase.labName,
      dueDate: resend.dueDate || '',
      receivedDate: null,
      notes: stampNote(resendCase.notes, line),
    });
    notify(`Re-sent ${resendCase.caseType} to ${resend.labName}.`, 'success');
    setResendCase(null);
  };

  // ── Fit to patient ──────────────────────────────────────────────────────────
  const fitCase = () => {
    updateLabCase(menuCase.id, {
      status: 'Fitted',
      receivedDate: menuCase.receivedDate || todayStr(),
    });
    notify(`${menuCase.caseType} fitted for ${menuCase.patientName}.`, 'success');
    closeMenu();
  };

  const statCards = [
    { label: 'In Lab',   value: stats.inLab,   icon: <InLabIcon />,   bg: '#FFFBEB', color: '#D97706' },
    { label: 'Trial',    value: stats.trial,   icon: <LabIcon />,     bg: '#FEF9C3', color: '#92400E' },
    { label: 'Overdue',  value: stats.overdue, icon: <OverdueIcon />, bg: '#FEF2F2', color: colors.error },
    { label: 'Fitted',   value: stats.fitted,  icon: <DoneIcon />,    bg: '#ECFDF5', color: colors.success },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Lab Dispatch</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Track every unit sent to the lab: sent to received, trial to final, until it is fitted.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          Send to Lab
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

      {/* Register table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Lab Dispatch Register</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{labCases.length} cases total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1040 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Case</TableCell>
                <TableCell>Tooth / Units</TableCell>
                <TableCell>Lab / Person</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Expected</TableCell>
                <TableCell align="center">WA</TableCell>
                <TableCell>Returned</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <LabIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || statusFilter !== 'All' ? 'No cases match your search' : 'No lab cases yet'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || statusFilter !== 'All' ? 'Try adjusting your filters.' : 'Click "Send to Lab" to record the first dispatch.'}</Typography>
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
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem' }}>{c.toothNumber && c.toothNumber !== '-' ? c.toothNumber : '-'}</Typography>
                        <Typography variant="caption" sx={{ color: colors.textSecondary }}>{c.units || 1} unit{(c.units || 1) !== 1 ? 's' : ''}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{c.labName}</Typography>
                        {c.sentBy ? <Typography variant="caption" sx={{ color: colors.textSecondary }}>by {c.sentBy}</Typography> : null}
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(c.sentDate)}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: overdue ? 700 : 400, color: overdue ? colors.error : colors.textSecondary }}>
                          {c.dueDate ? formatDate(c.dueDate) : '-'}{overdue ? ' · overdue' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {c.whatsappSent
                          ? <Tooltip title="WhatsApp confirmation sent"><WhatsAppIcon sx={{ fontSize: 17, color: '#25D366' }} /></Tooltip>
                          : <Typography variant="caption" sx={{ color: colors.textLight }}>-</Typography>}
                      </TableCell>
                      <TableCell>
                        {c.receivedDate
                          ? <>
                              <Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(c.receivedDate)}</Typography>
                              {c.receivedBy ? <Typography variant="caption" sx={{ color: colors.textSecondary }}>by {c.receivedBy}</Typography> : null}
                            </>
                          : <Typography variant="caption" sx={{ color: colors.textLight }}>-</Typography>}
                      </TableCell>
                      <TableCell><StatusPill status={c.status} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" aria-label="Open actions menu" onClick={(e) => openMenu(e, c)}><MoreIcon sx={{ fontSize: 18 }} /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Contextual actions menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        {menuCase && isOut(menuCase) && (
          <MenuItem onClick={openReceive} sx={{ fontSize: '0.85rem', gap: 1.25 }}>
            <ReceiveIcon sx={{ fontSize: 17, color: '#6D28D9' }} /> Receive back (Trial / Final)
          </MenuItem>
        )}
        {menuCase && menuCase.status === 'Trial' && (
          <MenuItem onClick={openResend} sx={{ fontSize: '0.85rem', gap: 1.25 }}>
            <ResendIcon sx={{ fontSize: 17, color: '#D97706' }} /> Re-send to lab
          </MenuItem>
        )}
        {menuCase && (menuCase.status === 'Trial' || menuCase.status === 'Final' || menuCase.status === 'Received') && (
          <MenuItem onClick={fitCase} sx={{ fontSize: '0.85rem', gap: 1.25 }}>
            <FitIcon sx={{ fontSize: 17, color: '#059669' }} /> Fit to patient
          </MenuItem>
        )}
        {menuCase && menuCase.status === 'Fitted' && (
          <MenuItem disabled sx={{ fontSize: '0.85rem' }}>Case completed</MenuItem>
        )}
      </Menu>

      {/* New dispatch dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Send to Lab
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
                  <MenuItem value="">Unassigned</MenuItem>
                  {dentists.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo options={CASE_TYPES} value={form.caseType}
                  onInputChange={(e, val) => setField('caseType', val)}
                  renderInput={(params) => <TextField {...params} label="Case / Treatment *" placeholder="e.g. 3D Metal, CDS, Crown" />}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Tooth / Teeth" name="toothNumber" value={form.toothNumber} onChange={handleChange} placeholder="e.g. 36 or 16,17" fullWidth />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Units" name="units" type="number" value={form.units} onChange={handleChange} fullWidth inputProps={{ min: 1 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo options={labOptions} value={form.labName}
                  onInputChange={(e, val) => setField('labName', val)}
                  renderInput={(params) => <TextField {...params} label="Lab / Person *" placeholder="e.g. Ijaz, Shafqat" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Sent By" name="sentBy" value={form.sentBy} onChange={handleChange} placeholder="Staff name" fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>Expected Ready Date</Typography>
                <Box component="input" type="date" name="dueDate" value={form.dueDate} min={todayStr()} onChange={handleChange} sx={DATE_INPUT_SX} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Lab Cost (PKR)" name="cost" type="number" value={form.cost} onChange={handleChange} fullWidth inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline rows={2} placeholder="Shade, material, instructions…" />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={form.whatsappSent} onChange={(e) => setField('whatsappSent', e.target.checked)} />}
                  label={<Typography variant="body2">WhatsApp confirmation sent to lab</Typography>}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Send to Lab</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Receive-back dialog */}
      <Dialog open={Boolean(recvCase)} onClose={() => setRecvCase(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Receive Back</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {recvCase && <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2 }}>{recvCase.caseType} for <strong>{recvCase.patientName}</strong> from {recvCase.labName}.</Typography>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField select label="Outcome" value={recv.outcome} onChange={(e) => setRecv((p) => ({ ...p, outcome: e.target.value }))} fullWidth>
                <MenuItem value="Trial">Trial (try in, may re-send)</MenuItem>
                <MenuItem value="Final">Final (ready to fit)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>Return Date</Typography>
              <Box component="input" type="date" value={recv.receivedDate} max={todayStr()} onChange={(e) => setRecv((p) => ({ ...p, receivedDate: e.target.value }))} sx={DATE_INPUT_SX} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Received By" value={recv.receivedBy} onChange={(e) => setRecv((p) => ({ ...p, receivedBy: e.target.value }))} placeholder="Staff name" fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Remarks" value={recv.remarks} onChange={(e) => setRecv((p) => ({ ...p, remarks: e.target.value }))} fullWidth multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
          <Button onClick={() => setRecvCase(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={submitReceive} variant="contained" sx={{ fontWeight: 700 }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Re-send dialog */}
      <Dialog open={Boolean(resendCase)} onClose={() => setResendCase(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Re-send to Lab</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {resendCase && <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2 }}>Send {resendCase.caseType} for <strong>{resendCase.patientName}</strong> back to the lab (e.g. for porcelain).</Typography>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                freeSolo options={labOptions} value={resend.labName}
                onInputChange={(e, val) => setResend((p) => ({ ...p, labName: val }))}
                renderInput={(params) => <TextField {...params} label="Lab / Person" placeholder="e.g. Shafqat" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>Expected Ready Date</Typography>
              <Box component="input" type="date" value={resend.dueDate} min={todayStr()} onChange={(e) => setResend((p) => ({ ...p, dueDate: e.target.value }))} sx={DATE_INPUT_SX} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Remarks" value={resend.remarks} onChange={(e) => setResend((p) => ({ ...p, remarks: e.target.value }))} placeholder="e.g. Send for porcelain" fullWidth multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
          <Button onClick={() => setResendCase(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={submitResend} variant="contained" sx={{ fontWeight: 700 }}>Re-send</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
