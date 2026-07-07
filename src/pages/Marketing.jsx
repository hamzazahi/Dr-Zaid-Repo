import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
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
  Campaign as CampaignIcon,
  Send as SendIcon,
  MarkEmailRead as DeliveredIcon,
  Drafts as DraftIcon,
  Search as SearchIcon,
  DeleteOutline as DeleteIcon,
  MailOutline as MailIcon,
  Groups as AudienceIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/helpers';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { colors } from '../theme/theme';

const todayStr = () => new Date().toISOString().split('T')[0];

// Audience segments are computed LIVE from clinic data, so the recipient count
// shown in the dialog (and stamped at send time) always reflects reality.
const SEGMENT_BUILDERS = {
  'All Patients': ({ patients }) => patients,
  'Active Patients': ({ patients }) => patients.filter((p) => p.status === 'Active'),
  'Pending Payment': ({ patients }) => patients.filter((p) => p.status === 'Pending Payment'),
  'Overdue Recalls': ({ patients, recalls }) => {
    const t = todayStr();
    const ids = new Set(recalls.filter((r) => r.dueDate && r.dueDate < t && (r.status === 'Pending' || r.status === 'Reminded')).map((r) => r.patientId));
    return patients.filter((p) => ids.has(p.id));
  },
  Members: ({ patients, memberships }) => {
    const ids = new Set(memberships.map((m) => m.patientId));
    return patients.filter((p) => ids.has(p.id));
  },
};
const SEGMENTS = Object.keys(SEGMENT_BUILDERS);

const STATUS_CFG = {
  Draft: { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
  Sent:  { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
};

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Draft;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

const EMPTY_FORM = { name: '', segment: 'All Patients', subject: '', body: '' };

export default function Marketing() {
  const { patients, recalls, memberships, campaigns, addCampaign, sendCampaign, deleteCampaign } = useClinicData();
  const { notify } = useNotification();

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const segmentData = useMemo(() => ({ patients, recalls, memberships }), [patients, recalls, memberships]);
  const audienceSize = (segment) => (SEGMENT_BUILDERS[segment] || SEGMENT_BUILDERS['All Patients'])(segmentData).length;

  const stats = useMemo(() => ({
    total: campaigns.length,
    sent: campaigns.filter((c) => c.status === 'Sent').length,
    delivered: campaigns.reduce((sum, c) => sum + (Number(c.recipients) || 0), 0),
    drafts: campaigns.filter((c) => c.status === 'Draft').length,
  }), [campaigns]);

  const filtered = useMemo(() => campaigns.filter((c) => {
    const qLow = q.trim().toLowerCase();
    return !qLow || c.name.toLowerCase().includes(qLow) || c.subject?.toLowerCase().includes(qLow) || c.segment?.toLowerCase().includes(qLow);
  }), [campaigns, q]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Please enter a campaign name.'); return; }
    if (!form.subject.trim()) { setFormError('Please enter an email subject.'); return; }
    const c = addCampaign(form);
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`Campaign "${c.name}" saved as draft.`, 'success');
  };

  const handleSend = (c) => {
    const count = audienceSize(c.segment);
    if (count === 0) { notify(`No patients in the "${c.segment}" segment right now.`, 'warning'); return; }
    sendCampaign(c.id, count);
    notify(`"${c.name}" sent to ${count} patient${count !== 1 ? 's' : ''} by email.`, 'success');
  };

  const handleDelete = (c) => {
    deleteCampaign(c.id);
    notify(`Campaign "${c.name}" deleted.`, 'success');
  };

  const statCards = [
    { label: 'Campaigns',        value: stats.total,     icon: <CampaignIcon />,  bg: '#EEF2FF', color: colors.primary },
    { label: 'Sent',             value: stats.sent,      icon: <SendIcon />,      bg: '#ECFDF5', color: colors.success },
    { label: 'Emails Delivered', value: stats.delivered, icon: <DeliveredIcon />, bg: '#E0F2FE', color: '#0369A1' },
    { label: 'Drafts',           value: stats.drafts,    icon: <DraftIcon />,     bg: '#FFFBEB', color: '#D97706' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Marketing</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Create email campaigns and target patient segments.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          New Campaign
        </Button>
      </Box>

      {/* Email-only notice (matches Recalls) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: '10px', bgcolor: '#EAF2FB', border: '1px solid #C3DCF3' }}>
        <MailIcon sx={{ fontSize: 18, color: colors.primary }} />
        <Typography variant="body2" sx={{ color: '#0A3254', fontSize: '0.82rem' }}>
          Campaigns are sent by <strong>email only</strong>. Audience sizes are computed live from patient data at send time.
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

      {/* Audience segments overview */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AudienceIcon sx={{ fontSize: 18, color: colors.primary }} />
          <Typography variant="subtitle2" fontWeight={700}>Audience Segments</Typography>
        </Box>
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {SEGMENTS.map((s) => (
            <Chip key={s} label={`${s}: ${audienceSize(s)}`} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
          ))}
        </Box>
      </Card>

      {/* Search */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2, py: 1.75, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField placeholder="Search campaigns…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} campaign{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Campaign table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>All Campaigns</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 880 }}>
            <TableHead>
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell>Segment</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell align="right">Recipients</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <CampaignIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q ? 'No campaigns match your search' : 'No campaigns yet'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q ? 'Try a different search term.' : 'Click "New Campaign" to create the first one.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{c.name}</Typography>
                      <Typography variant="caption" sx={{ color: colors.textSecondary }}>Created {formatDate(c.createdDate)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${c.segment} · ${audienceSize(c.segment)}`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }} noWrap>{c.subject}</Typography>
                    </TableCell>
                    <TableCell><StatusPill status={c.status} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{c.sentAt ? formatDate(c.sentAt) : '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{c.status === 'Sent' ? c.recipients : '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        {c.status === 'Draft' && (
                          <Tooltip title="Send campaign now">
                            <Button size="small" variant="contained" startIcon={<SendIcon sx={{ fontSize: 14 }} />} onClick={() => handleSend(c)} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'none' }}>
                              Send
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete campaign">
                          <IconButton size="small" onClick={() => setConfirmTarget(c)} sx={{ color: colors.textLight, '&:hover': { color: colors.error } }}>
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

      {/* New campaign dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          New Email Campaign
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Saved as a draft — send it from the campaign list.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField label="Campaign Name" name="name" value={form.name} onChange={handleChange} fullWidth required placeholder="e.g. Summer Whitening Offer" />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField select label="Audience Segment" name="segment" value={form.segment} onChange={handleChange} fullWidth>
                  {SEGMENTS.map((s) => (
                    <MenuItem key={s} value={s}>{s} ({audienceSize(s)})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Email Subject" name="subject" value={form.subject} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Email Body" name="body" value={form.body} onChange={handleChange} fullWidth multiline rows={4} placeholder="Write the campaign message…" />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: '8px', py: 0.5 }}>
                  This campaign will reach <strong>{audienceSize(form.segment)}</strong> patient{audienceSize(form.segment) !== 1 ? 's' : ''} in the "{form.segment}" segment (computed at send time).
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Save Draft</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete this campaign?"
        message={confirmTarget ? `"${confirmTarget.name}" will be permanently removed.` : ''}
        onConfirm={() => handleDelete(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
      />
    </Box>
  );
}
