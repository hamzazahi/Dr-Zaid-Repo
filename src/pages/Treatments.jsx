import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Grid,
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
  LocalHospital as LocalHospitalIcon,
  MedicalServices as MedicalIcon,
  AttachMoney as MoneyIcon,
  ListAlt as ListIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { TREATMENT_COSTS, TREATMENT_TYPES, TOOTH_NUMBERS } from '../utils/constants';
import { colors } from '../theme/theme';

const EMPTY_FORM = { patientId: '', type: 'Filling', toothNumber: '11', cost: TREATMENT_COSTS.Filling, notes: '' };

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const PROC_COLORS = {
  Filling:      { bg: '#EFF6FF', color: '#2563EB' },
  Extraction:   { bg: '#FEF2F2', color: '#DC2626' },
  RootCanal:    { bg: '#F5F3FF', color: '#7C3AED' },
  Crown:        { bg: '#FFF7ED', color: '#C2410C' },
  Cleaning:     { bg: '#F0FDF4', color: '#059669' },
  Whitening:    { bg: '#FEFCE8', color: '#CA8A04' },
  Braces:       { bg: '#F0F9FF', color: '#0369A1' },
  Implant:      { bg: '#FDF4FF', color: '#7E22CE' },
  Consultation: { bg: '#F8FAFC', color: '#64748B' },
};

function ProcedurePill({ type }) {
  const cfg = PROC_COLORS[type] || { bg: colors.surfaceAlt, color: colors.textSecondary };
  return (
    <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: cfg.bg }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color }}>{type}</Typography>
    </Box>
  );
}

export default function Treatments() {
  const { patients, treatments, addTreatment } = useClinicData();
  const { notify } = useNotification();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const handleChange = (field, value) => {
    setFormError('');
    setForm((prev) => ({ ...prev, [field]: value, ...(field === 'type' ? { cost: TREATMENT_COSTS[value] ?? '' } : {}) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (!form.cost || Number(form.cost) <= 0) { setFormError('Please enter a valid fee amount.'); return; }
    const patient = patients.find((p) => p.id === form.patientId);
    addTreatment(form);
    setForm(EMPTY_FORM);
    notify(`Treatment logged for ${patient?.name}. Invoice generated automatically.`, 'success');
  };

  const totalRevenue = useMemo(() => treatments.reduce((sum, t) => sum + t.cost, 0), [treatments]);
  const uniqueProcs = useMemo(() => { const m = {}; treatments.forEach((t) => { m[t.type] = 1; }); return Object.keys(m).length; }, [treatments]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Treatment Cases</Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Record procedures — invoices are generated automatically.</Typography>
      </Box>

      <Grid container spacing={2}>
        {[
          { label: 'Total Procedures', value: treatments.length, icon: <ListIcon />, bg: '#EEF2FF', color: colors.primary },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: <MoneyIcon />, bg: '#F0FDF4', color: colors.success },
          { label: 'Procedure Types', value: uniqueProcs, icon: <MedicalIcon />, bg: '#FFF7ED', color: '#D97706' },
        ].map((kpi) => (
          <Grid item xs={12} sm={4} key={kpi.label}>
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>{kpi.label}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: colors.textPrimary, letterSpacing: '-0.02em', mt: 0.25 }}>{kpi.value}</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: kpi.bg, color: kpi.color, display: 'flex', fontSize: 22 }}>{kpi.icon}</Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Log New Treatment</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>Completing this form will auto-generate an invoice for the patient.</Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField select label="Patient *" value={form.patientId} onChange={(e) => handleChange('patientId', e.target.value)} fullWidth required error={Boolean(formError && !form.patientId)}>
                  {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select label="Procedure" value={form.type} onChange={(e) => handleChange('type', e.target.value)} fullWidth>
                  {TREATMENT_TYPES.filter((t) => t !== 'Consultation').map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select label="Tooth #" value={form.toothNumber} onChange={(e) => handleChange('toothNumber', e.target.value)} fullWidth>
                  <MenuItem value="All">All Teeth</MenuItem>
                  {TOOTH_NUMBERS.map((n) => <MenuItem key={n} value={n}>Tooth #{n}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField label="Fee (PKR)" type="number" value={form.cost} onChange={(e) => handleChange('cost', e.target.value)} fullWidth required inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button type="submit" variant="contained" startIcon={<LocalHospitalIcon />} fullWidth sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0B7A6F' }, height: 40, fontWeight: 700 }}>
                  Log Treatment
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Clinical Notes" value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} fullWidth multiline rows={2} placeholder="Describe procedure details, findings, or follow-up instructions…" />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Card>

      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>Treatment History</Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>{treatments.length} procedures logged</Typography>
          </Box>
          <Box sx={{ display: 'inline-flex', px: '10px', py: '4px', borderRadius: '8px', bgcolor: colors.successBg }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.success }}>Total: {formatCurrency(totalRevenue)}</Typography>
          </Box>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Procedure</TableCell>
                <TableCell>Tooth</TableCell>
                <TableCell>Dentist</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Fee</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {treatments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <LocalHospitalIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>No treatments logged yet</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>Use the form above to record the first procedure.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                treatments.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(t.patientName) }}>
                          {t.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem', color: colors.primary }}>{t.patientName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(t.date)}</Typography></TableCell>
                    <TableCell><ProcedurePill type={t.type} /></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.toothNumber === 'All' ? 'All Teeth' : `#${t.toothNumber}`}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{t.dentistName || '—'}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 300 }}><Typography variant="body2" sx={{ fontSize: '0.8rem', color: colors.textSecondary }} noWrap>{t.notes || '—'}</Typography></TableCell>
                    <TableCell align="right"><Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0D9488' }}>{formatCurrency(t.cost)}</Typography></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
