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
  Stack,
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
  Description as FormIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as DoneIcon,
  Search as SearchIcon,
  DeleteOutline as DeleteIcon,
  Draw as SignIcon,
  AssignmentInd as IntakeIcon,
  Gavel as ConsentIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/helpers';
import { mockFormTemplates } from '../utils/mockData';
import { colors } from '../theme/theme';

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const CAT_CFG = {
  Intake:    { bg: '#EEF2FF', color: '#1D4ED8' },
  Consent:   { bg: '#ECFDF5', color: '#15803D' },
  Financial: { bg: '#FFF7ED', color: '#C2410C' },
  Screening: { bg: '#F5F3FF', color: '#6D28D9' },
  Other:     { bg: '#F1F5F9', color: '#475569' },
};

const STATUS_CFG = {
  Pending:   { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Completed: { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
};

function CategoryChip({ category }) {
  const c = CAT_CFG[category] || CAT_CFG.Other;
  return (
    <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: c.color }}>{category}</Typography>
    </Box>
  );
}

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

export default function Forms() {
  const { patients, formSubmissions, assignForm, completeForm, deleteFormSubmission } = useClinicData();
  const { notify } = useNotification();

  const [openSend, setOpenSend] = useState(false);
  const [sendForm, setSendForm] = useState({ patientId: '', templateId: '' });
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [signSub, setSignSub] = useState(null);
  const [signature, setSignature] = useState('');

  const stats = useMemo(() => ({
    total: formSubmissions.length,
    pending: formSubmissions.filter((s) => s.status === 'Pending').length,
    completed: formSubmissions.filter((s) => s.status === 'Completed').length,
    templates: mockFormTemplates.length,
  }), [formSubmissions]);

  const filtered = useMemo(() => formSubmissions.filter((s) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || s.patientName.toLowerCase().includes(qLow) || s.templateName?.toLowerCase().includes(qLow);
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchQ && matchStatus;
  }), [formSubmissions, q, statusFilter]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!sendForm.patientId) { setError('Please select a patient.'); return; }
    if (!sendForm.templateId) { setError('Please select a form.'); return; }
    const patient = patients.find((p) => p.id === sendForm.patientId);
    const template = mockFormTemplates.find((t) => t.id === sendForm.templateId);
    assignForm({ patientId: sendForm.patientId, templateId: template.id, templateName: template.name, category: template.category });
    setOpenSend(false); setSendForm({ patientId: '', templateId: '' }); setError('');
    notify(`"${template.name}" sent to ${patient?.name}.`, 'success');
  };

  const openSign = (sub) => { setSignSub(sub); setSignature(sub.patientName); };
  const doSign = () => {
    if (!signature.trim()) return;
    completeForm(signSub.id, signature);
    notify(`${signSub.templateName} signed by ${signature}.`, 'success');
    setSignSub(null); setSignature('');
  };

  const statCards = [
    { label: 'Total Forms', value: stats.total,     icon: <FormIcon />,    bg: '#EEF2FF', color: colors.primary },
    { label: 'Pending',     value: stats.pending,   icon: <PendingIcon />, bg: '#FFFBEB', color: '#D97706' },
    { label: 'Completed',   value: stats.completed, icon: <DoneIcon />,    bg: '#ECFDF5', color: colors.success },
    { label: 'Templates',   value: stats.templates, icon: <SignIcon />,    bg: '#F5F3FF', color: '#6D28D9' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Forms &amp; e-Consent</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Send intake questionnaires and consent forms — patients complete and e-sign them.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => { setError(''); setOpenSend(true); }} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          Send Form
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

      {/* Template library */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Form Library</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{mockFormTemplates.length} templates available</Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            {mockFormTemplates.map((t) => {
              const Icon = t.category === 'Consent' ? ConsentIcon : IntakeIcon;
              const cat = CAT_CFG[t.category] || CAT_CFG.Other;
              return (
                <Grid item xs={12} sm={6} md={4} key={t.id}>
                  <Box sx={{ p: 2, borderRadius: '10px', border: `1px solid ${colors.border}`, height: '100%', display: 'flex', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '9px', flexShrink: 0, bgcolor: cat.bg, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon sx={{ fontSize: 19 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.25 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.84rem' }}>{t.name}</Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 0.75 }}>{t.description}</Typography>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <CategoryChip category={t.category} />
                        <Typography variant="caption" sx={{ color: colors.textLight }}>{t.fields} fields</Typography>
                      </Stack>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Card>

      {/* Filters */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2, py: 1.75, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField placeholder="Search patient or form…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
            {['All', 'Pending', 'Completed'].map((s) => <MenuItem key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} form{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Submissions table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Sent Forms</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{formSubmissions.length} forms total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 880 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Form</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Signed By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <FormIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || statusFilter !== 'All' ? 'No forms match your search' : 'No forms sent yet'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || statusFilter !== 'All' ? 'Try adjusting your filters.' : 'Click "Send Form" to assign the first one.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(s.patientName) }}>
                          {s.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{s.patientName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.83rem' }}>{s.templateName}</Typography></TableCell>
                    <TableCell><CategoryChip category={s.category} /></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(s.sentDate)}</Typography></TableCell>
                    <TableCell>
                      {s.signedBy
                        ? <Box><Typography variant="body2" sx={{ fontSize: '0.82rem', fontFamily: 'cursive', fontStyle: 'italic' }}>{s.signedBy}</Typography><Typography variant="caption" sx={{ color: colors.textLight }}>{formatDate(s.signatureDate)}</Typography></Box>
                        : <Typography variant="caption" sx={{ color: colors.textLight }}>Awaiting signature</Typography>}
                    </TableCell>
                    <TableCell><StatusPill status={s.status} /></TableCell>
                    <TableCell align="right">
                      {s.status === 'Pending' && (
                        <Button size="small" variant="contained" startIcon={<SignIcon sx={{ fontSize: 14 }} />} onClick={() => openSign(s)} sx={{ fontWeight: 700, fontSize: '0.74rem', whiteSpace: 'nowrap', mr: 0.5 }}>Sign</Button>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => { deleteFormSubmission(s.id); notify('Form removed.', 'success'); }}><DeleteIcon sx={{ fontSize: 18, color: colors.error }} /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Send form dialog */}
      <Dialog open={openSend} onClose={() => { setOpenSend(false); setError(''); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Send Form to Patient</DialogTitle>
        <form onSubmit={handleSend} noValidate>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}
            <TextField select label="Patient *" value={sendForm.patientId} onChange={(e) => { setSendForm((p) => ({ ...p, patientId: e.target.value })); setError(''); }} fullWidth required>
              {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField select label="Form *" value={sendForm.templateId} onChange={(e) => { setSendForm((p) => ({ ...p, templateId: e.target.value })); setError(''); }} fullWidth required>
              {mockFormTemplates.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenSend(false); setError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Send Form</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Sign / e-consent dialog */}
      <Dialog open={Boolean(signSub)} onClose={() => setSignSub(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>e-Sign Form</DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: colors.surfaceAlt, border: `1px solid ${colors.border}` }}>
            <Typography variant="body2" fontWeight={700}>{signSub?.templateName}</Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>For {signSub?.patientName} · {signSub?.category}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Type full name to sign</Typography>
            <TextField value={signature} onChange={(e) => setSignature(e.target.value)} fullWidth size="small" placeholder="Full name"
              sx={{ mt: 0.5, '& input': { fontFamily: 'cursive', fontStyle: 'italic', fontSize: '1.05rem' } }} />
          </Box>
          <Typography variant="caption" sx={{ color: colors.textLight }}>By signing, the patient agrees to the terms of this form. (Simulated e-signature — dated today.)</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
          <Button onClick={() => setSignSub(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={doSign} variant="contained" disabled={!signature.trim()} startIcon={<SignIcon sx={{ fontSize: 16 }} />} sx={{ fontWeight: 700 }}>Sign &amp; Complete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
