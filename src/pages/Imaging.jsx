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
  CameraAlt as PhotoIcon,
  FilterCenterFocus as XRayIcon,
  ViewInAr as CbctIcon,
  Collections as ImagingIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  DeleteOutline as DeleteIcon,
  InfoOutlined as InfoIcon,
  BrokenImage as NoImageIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { usePermissions } from '../hooks/usePermissions';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/helpers';
import { TOOTH_NUMBERS } from '../utils/constants';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { colors } from '../theme/theme';

const IMAGING_TYPES = ['Periapical X-Ray', 'Bitewing X-Ray', 'Panoramic (OPG)', 'Cephalometric', 'CBCT Scan', 'Intraoral Photo'];

// Colour-coded pill per modality so the list scans easily.
const TYPE_CFG = {
  'Periapical X-Ray': { bg: '#EFF6FF', color: '#1D4ED8' },
  'Bitewing X-Ray':   { bg: '#EFF6FF', color: '#1D4ED8' },
  'Panoramic (OPG)':  { bg: '#F5F3FF', color: '#6D28D9' },
  Cephalometric:      { bg: '#F5F3FF', color: '#6D28D9' },
  'CBCT Scan':        { bg: '#FFF7ED', color: '#C2410C' },
  'Intraoral Photo':  { bg: '#ECFDF5', color: '#065F46' },
};

const isXRay = (type) => type.includes('X-Ray') || type === 'Panoramic (OPG)' || type === 'Cephalometric';

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

function TypePill({ type }) {
  const c = TYPE_CFG[type] || TYPE_CFG['Periapical X-Ray'];
  return (
    <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: c.color }}>{type}</Typography>
    </Box>
  );
}

const EMPTY_FORM = { patientId: '', type: 'Periapical X-Ray', toothNumber: 'All', date: '', takenBy: '', notes: '' };

const DATE_INPUT_SX = {
  border: '1px solid #DFE4EC', borderRadius: '7px', bgcolor: '#FBFCFE', px: '12px', py: '14px',
  fontSize: '0.9rem', fontFamily: 'inherit', color: '#1F2937', width: '100%', boxSizing: 'border-box',
  colorScheme: 'light', cursor: 'pointer',
  '&:hover': { borderColor: '#0F4C81' }, '&:focus': { outline: 'none', borderColor: '#0F4C81' },
};

export default function Imaging() {
  const { patients, dentists, imagingRecords, addImagingRecord, deleteImagingRecord } = useClinicData();
  const { canEdit } = usePermissions();
  const editable = canEdit('/imaging');
  const { notify } = useNotification();

  const [openDialog, setOpenDialog] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const stats = useMemo(() => ({
    total: imagingRecords.length,
    xrays: imagingRecords.filter((r) => isXRay(r.type)).length,
    scansPhotos: imagingRecords.filter((r) => !isXRay(r.type)).length,
    thisMonth: imagingRecords.filter((r) => r.date?.startsWith(thisMonth)).length,
  }), [imagingRecords, thisMonth]);

  const filtered = useMemo(() => imagingRecords.filter((r) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || r.patientName.toLowerCase().includes(qLow) || r.type.toLowerCase().includes(qLow) || r.takenBy?.toLowerCase().includes(qLow);
    const matchType = typeFilter === 'All' || r.type === typeFilter;
    return matchQ && matchType;
  }), [imagingRecords, q, typeFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (!form.takenBy) { setFormError('Please select who captured the image.'); return; }
    const rec = addImagingRecord(form);
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`${rec.type} recorded for ${rec.patientName}.`, 'success');
  };

  const handleDelete = (r) => {
    deleteImagingRecord(r.id);
    notify(`Imaging record deleted for ${r.patientName}.`, 'success');
  };

  const statCards = [
    { label: 'Total Images',   value: stats.total,       icon: <ImagingIcon />, bg: '#EEF2FF', color: colors.primary },
    { label: 'Radiographs',    value: stats.xrays,       icon: <XRayIcon />,    bg: '#F5F3FF', color: '#6D28D9' },
    { label: 'Scans & Photos', value: stats.scansPhotos, icon: <CbctIcon />,    bg: '#FFF7ED', color: '#C2410C' },
    { label: 'This Month',     value: stats.thisMonth,   icon: <PhotoIcon />,   bg: '#ECFDF5', color: colors.success },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Imaging</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Track X-rays, scans and clinical photos per patient and tooth.</Typography>
        </Box>
        {editable ? (
          <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
            New Image Record
          </Button>
        ) : (
          <Box sx={{ px: 1.5, py: 0.75, borderRadius: '8px', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>View only — imaging is captured by clinicians</Typography>
          </Box>
        )}
      </Box>

      {/* Metadata-only notice (matches Documents) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: '10px', bgcolor: '#EAF2FB', border: '1px solid #C3DCF3' }}>
        <InfoIcon sx={{ fontSize: 18, color: colors.primary }} />
        <Typography variant="body2" sx={{ color: '#0A3254', fontSize: '0.82rem' }}>
          Records store image <strong>metadata only</strong> — actual image files will be attached once cloud storage is connected (backend phase).
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
          <TextField placeholder="Search patient, type, or clinician…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="All">All Types</MenuItem>
            {IMAGING_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Records table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Imaging Records</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{imagingRecords.length} records total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 880 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Tooth</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Captured By</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <ImagingIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || typeFilter !== 'All' ? 'No records match your filters' : 'No imaging records yet'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || typeFilter !== 'All' ? 'Try adjusting your search.' : 'Click "New Image Record" to log the first one.'}</Typography>
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
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{r.patientName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><TypePill type={r.type} /></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem' }}>{r.toothNumber === 'All' ? 'Full Mouth' : `#${r.toothNumber}`}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(r.date)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{r.takenBy}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 220 }}><Typography variant="body2" sx={{ fontSize: '0.8rem', color: colors.textSecondary }} noWrap>{r.notes || '—'}</Typography></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => setViewRecord(r)} sx={{ color: colors.primary }}>
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete record">
                          <IconButton size="small" onClick={() => setConfirmTarget(r)} sx={{ color: colors.textLight, '&:hover': { color: colors.error } }}>
                            <DeleteIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Detail dialog */}
      <Dialog open={Boolean(viewRecord)} onClose={() => setViewRecord(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          {viewRecord?.type}
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>
            {viewRecord?.patientName} · {viewRecord?.toothNumber === 'All' ? 'Full Mouth' : `Tooth #${viewRecord?.toothNumber}`} · {viewRecord ? formatDate(viewRecord.date) : ''}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {/* Image placeholder — bytes are not stored in the frontend-only build */}
          <Box sx={{ height: 220, borderRadius: '10px', bgcolor: '#0A1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <NoImageIcon sx={{ fontSize: 42, color: 'rgba(255,255,255,0.25)' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Image preview available after cloud storage is connected</Typography>
          </Box>
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>Captured By</Typography>
              <Typography variant="body2" fontWeight={600}>{viewRecord?.takenBy}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>Record ID</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{viewRecord?.id}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>Clinical Notes</Typography>
              <Typography variant="body2">{viewRecord?.notes || '—'}</Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
          <Button onClick={() => setViewRecord(null)} color="inherit" sx={{ fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* New record dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          New Imaging Record
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
                <TextField select label="Image Type" name="type" value={form.type} onChange={handleChange} fullWidth>
                  {IMAGING_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Tooth" name="toothNumber" value={form.toothNumber} onChange={handleChange} fullWidth>
                  <MenuItem value="All">Full Mouth</MenuItem>
                  {TOOTH_NUMBERS.map((n) => <MenuItem key={n} value={n}>Tooth #{n}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Captured By" name="takenBy" value={form.takenBy} onChange={handleChange} fullWidth required>
                  {dentists.map((d) => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>Capture Date (defaults to today)</Typography>
                <Box component="input" type="date" name="date" value={form.date} onChange={handleChange} sx={DATE_INPUT_SX} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Clinical Notes" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline rows={2} placeholder="Findings, exposure details…" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Save Record</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete this imaging record?"
        message={confirmTarget ? `${confirmTarget.type} for ${confirmTarget.patientName} will be permanently removed.` : ''}
        onConfirm={() => handleDelete(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
      />
    </Box>
  );
}
