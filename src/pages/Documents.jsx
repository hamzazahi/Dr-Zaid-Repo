import { useMemo, useRef, useState } from 'react';
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
  Folder as FolderIcon,
  Image as ImageIcon,
  HealthAndSafety as ConsentIcon,
  Description as FileIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  DeleteOutline as DeleteIcon,
  UploadFile as UploadIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';

const CATEGORIES = ['X-Ray', 'Scan/CBCT', 'Consent Form', 'Lab Report', 'Insurance', 'Clinical Photo', 'Prescription', 'Other'];

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const CAT_CFG = {
  'X-Ray':         { bg: '#EEF2FF', color: '#1D4ED8' },
  'Scan/CBCT':     { bg: '#F5F3FF', color: '#6D28D9' },
  'Consent Form':  { bg: '#ECFDF5', color: '#15803D' },
  'Lab Report':    { bg: '#ECFEFF', color: '#0E7490' },
  Insurance:       { bg: '#FFF7ED', color: '#C2410C' },
  'Clinical Photo':{ bg: '#FDF2F8', color: '#BE185D' },
  Prescription:    { bg: '#FEFCE8', color: '#A16207' },
  Other:           { bg: '#F1F5F9', color: '#475569' },
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const extType = (filename) => {
  const ext = filename.includes('.') ? filename.split('.').pop().toUpperCase() : 'FILE';
  return ext.slice(0, 5);
};

function CategoryChip({ category }) {
  const c = CAT_CFG[category] || CAT_CFG.Other;
  return (
    <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: c.color }}>{category}</Typography>
    </Box>
  );
}

function FileTypeBadge({ type, category }) {
  const Icon = category === 'X-Ray' || category === 'Clinical Photo' ? ImageIcon
    : category === 'Consent Form' ? ConsentIcon : FileIcon;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 30, height: 30, borderRadius: '7px', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary }}>
        <Icon sx={{ fontSize: 17 }} />
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: colors.textSecondary }}>{type}</Typography>
    </Box>
  );
}

const EMPTY_FORM = { patientId: '', name: '', category: 'X-Ray', fileType: '', size: 0, uploadedBy: '', notes: '' };

export default function Documents() {
  const { patients, documents, addDocument, deleteDocument } = useClinicData();
  const { notify } = useNotification();
  const fileRef = useRef(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const stats = useMemo(() => ({
    total: documents.length,
    imaging: documents.filter((d) => d.category === 'X-Ray' || d.category === 'Scan/CBCT' || d.category === 'Clinical Photo').length,
    consent: documents.filter((d) => d.category === 'Consent Form').length,
    size: documents.reduce((s, d) => s + (d.size || 0), 0),
  }), [documents]);

  const filtered = useMemo(() => documents.filter((d) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || d.name.toLowerCase().includes(qLow) || d.patientName.toLowerCase().includes(qLow);
    const matchCat = catFilter === 'All' || d.category === catFilter;
    return matchQ && matchCat;
  }), [documents, q, catFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, name: file.name, size: file.size, fileType: extType(file.name) }));
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (!form.name.trim()) { setFormError('Choose a file or enter a document name.'); return; }
    const patient = patients.find((p) => p.id === form.patientId);
    addDocument({ ...form, fileType: form.fileType || extType(form.name) });
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`Document added to ${patient?.name}'s records.`, 'success');
  };

  const handleDelete = (doc) => {
    deleteDocument(doc.id);
    notify(`"${doc.name}" removed.`, 'success');
  };

  const statCards = [
    { label: 'Total Documents', value: stats.total,             icon: <FolderIcon />,  bg: '#EEF2FF', color: colors.primary },
    { label: 'Imaging',         value: stats.imaging,           icon: <ImageIcon />,   bg: '#F5F3FF', color: '#6D28D9' },
    { label: 'Consent Forms',   value: stats.consent,           icon: <ConsentIcon />, bg: '#ECFDF5', color: colors.success },
    { label: 'Storage Used',    value: formatSize(stats.size),  icon: <UploadIcon />,  bg: '#E0F2FE', color: '#0369A1' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Documents</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Store and organise patient X-rays, scans, consent forms, and reports.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          Add Document
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
          <TextField placeholder="Search file or patient…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} sx={{ minWidth: 170 }}>
            <MenuItem value="All">All Categories</MenuItem>
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} file{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Document Library</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{documents.length} files total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <FolderIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || catFilter !== 'All' ? 'No documents match your search' : 'No documents yet'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || catFilter !== 'All' ? 'Try adjusting your filters.' : 'Click "Add Document" to upload the first file.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Box>
                        <FileTypeBadge type={doc.fileType} category={doc.category} />
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.84rem', mt: 0.5 }}>{doc.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: '0.66rem', fontWeight: 700, bgcolor: avatarColor(doc.patientName) }}>
                          {doc.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{doc.patientName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><CategoryChip category={doc.category} /></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatSize(doc.size)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(doc.uploadedDate)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{doc.uploadedBy}</Typography></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Preview (not available in demo)">
                        <IconButton size="small" onClick={() => notify('File preview is not available in this demo build.', 'info')}><ViewIcon sx={{ fontSize: 18, color: colors.textSecondary }} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(doc)}><DeleteIcon sx={{ fontSize: 18, color: colors.error }} /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Add document dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Add Document
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Fields marked * are required.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}

            {/* File picker */}
            <Box
              onClick={() => fileRef.current?.click()}
              sx={{
                border: `1.5px dashed ${colors.border}`, borderRadius: '10px', p: 2.5, mb: 2,
                textAlign: 'center', cursor: 'pointer', bgcolor: colors.surfaceAlt,
                transition: 'border-color .15s ease', '&:hover': { borderColor: colors.primary },
              }}
            >
              <input ref={fileRef} type="file" hidden onChange={handleFilePick} />
              <UploadIcon sx={{ fontSize: 26, color: colors.primary, mb: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{form.name || 'Click to choose a file'}</Typography>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                {form.name ? `${form.fileType} · ${formatSize(form.size)}` : 'X-ray, scan, consent PDF, photo…'}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select label="Patient *" name="patientId" value={form.patientId} onChange={handleChange} fullWidth required>
                  {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Category" name="category" value={form.category} onChange={handleChange} fullWidth>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Document Name *" name="name" value={form.name} onChange={handleChange} fullWidth required placeholder="e.g. Bitewing X-Ray.jpg" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Uploaded By" name="uploadedBy" value={form.uploadedBy} onChange={handleChange} fullWidth placeholder="e.g. Reception" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline rows={2} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Add Document</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
