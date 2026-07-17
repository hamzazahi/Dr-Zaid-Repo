import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  FactCheck as PlanIcon,
  HourglassEmpty as ProposedIcon,
  Loop as ProgressIcon,
  CheckCircle as DoneIcon,
  RadioButtonUnchecked as UncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DeleteOutline as DeleteIcon,
  ReceiptLong as ReceiptIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useClinicData } from '../hooks/useClinicData';
import { usePermissions } from '../hooks/usePermissions';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/helpers';
import { TREATMENT_TYPES, TREATMENT_COSTS, TOOTH_NUMBERS } from '../utils/constants';
import { colors } from '../theme/theme';

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const STATUS_CFG = {
  Proposed:      { bg: '#F1F5F9', color: '#475569', dot: '#64748B' },
  Accepted:      { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  'In Progress': { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Completed:     { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
};

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Proposed;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

const EMPTY_ITEM = () => ({ procedure: 'Filling', toothNumber: '11', cost: TREATMENT_COSTS.Filling });

export default function TreatmentPlans() {
  const { patients, dentists, treatmentPlans, addTreatmentPlan, updateTreatmentPlanStatus, togglePlanItem } = useClinicData();
  const { canEdit } = usePermissions();
  const editable = canEdit('/treatment-plans');
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ patientId: '', dentistId: 'dentist-1', title: '', items: [EMPTY_ITEM()] });
  const [formError, setFormError] = useState('');

  const planTotal = (plan) => plan.items.reduce((s, it) => s + Number(it.cost || 0), 0);
  const planDone = (plan) => plan.items.filter((it) => it.done).length;

  const stats = useMemo(() => ({
    total: treatmentPlans.length,
    proposed: treatmentPlans.filter((p) => p.status === 'Proposed').length,
    active: treatmentPlans.filter((p) => p.status === 'Accepted' || p.status === 'In Progress').length,
    completed: treatmentPlans.filter((p) => p.status === 'Completed').length,
    value: treatmentPlans.reduce((s, p) => s + planTotal(p), 0),
  }), [treatmentPlans]);

  const formTotal = useMemo(() => form.items.reduce((s, it) => s + Number(it.cost || 0), 0), [form.items]);

  // ── New plan form helpers ──
  const updateItem = (idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [field]: value };
        if (field === 'procedure') next.cost = TREATMENT_COSTS[value] ?? it.cost;
        return next;
      }),
    }));
  };
  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, EMPTY_ITEM()] }));
  const removeItem = (idx) => setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const resetForm = () => { setForm({ patientId: '', dentistId: 'dentist-1', title: '', items: [EMPTY_ITEM()] }); setFormError(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (form.items.length === 0) { setFormError('Add at least one procedure item.'); return; }
    if (form.items.some((it) => !it.cost || Number(it.cost) < 0)) { setFormError('Each item needs a valid fee.'); return; }
    const patient = patients.find((p) => p.id === form.patientId);
    addTreatmentPlan(form);
    setOpenDialog(false);
    resetForm();
    notify(`Treatment plan created for ${patient?.name}.`, 'success');
  };

  const handleAccept = (plan) => {
    updateTreatmentPlanStatus(plan.id, 'Accepted');
    notify(`Plan accepted — invoice generated for ${plan.patientName}.`, 'success');
  };

  const statCards = [
    { label: 'Total Plans',  value: stats.total,     icon: <PlanIcon />,     bg: '#EEF2FF', color: colors.primary },
    { label: 'Proposed',     value: stats.proposed,  icon: <ProposedIcon />, bg: '#F1F5F9', color: '#475569' },
    { label: 'In Treatment', value: stats.active,    icon: <ProgressIcon />, bg: '#FFFBEB', color: '#D97706' },
    { label: 'Completed',    value: stats.completed, icon: <DoneIcon />,     bg: '#ECFDF5', color: colors.success },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Treatment Plans</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Build multi-visit plans, accept &amp; bill them, and track procedure progress.</Typography>
        </Box>
        {editable ? (
          <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
            New Plan
          </Button>
        ) : (
          <Box sx={{ px: 1.5, py: 0.75, borderRadius: '8px', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>View only — plans are managed by the doctor</Typography>
          </Box>
        )}
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

      {/* Plan list */}
      {treatmentPlans.length === 0 ? (
        <Card sx={{ borderRadius: '12px' }}>
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
              <PlanIcon sx={{ fontSize: 24, color: colors.textLight }} />
            </Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>No treatment plans yet</Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>Click "New Plan" to create the first multi-visit plan.</Typography>
          </Box>
        </Card>
      ) : (
        <Stack spacing={2}>
          {treatmentPlans.map((plan) => {
            const total = planTotal(plan);
            const done = planDone(plan);
            const pct = plan.items.length ? Math.round((done / plan.items.length) * 100) : 0;
            const isOpen = expanded === plan.id;
            const canChart = plan.status !== 'Proposed';
            return (
              <Card key={plan.id} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                {/* Plan header */}
                <Box sx={{ p: '16px 20px', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Avatar sx={{ width: 38, height: 38, fontSize: '0.8rem', fontWeight: 700, bgcolor: avatarColor(plan.patientName) }}>
                    {plan.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 180, flex: 1 }}>
                    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{plan.title}</Typography>
                      <StatusPill status={plan.status} />
                    </Stack>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                      {plan.patientName} · {plan.dentistName} · {formatDate(plan.createdDate)}
                    </Typography>
                  </Box>

                  {/* Progress */}
                  <Box sx={{ minWidth: 150 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: colors.textSecondary }}>{done}/{plan.items.length} done</Typography>
                      <Typography variant="caption" fontWeight={700}>{pct}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 999, bgcolor: colors.borderLight, '& .MuiLinearProgress-bar': { bgcolor: pct === 100 ? colors.success : colors.primary } }} />
                  </Box>

                  {/* Total */}
                  <Box sx={{ textAlign: 'right', minWidth: 90 }}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block' }}>Plan total</Typography>
                    <Typography sx={{ fontWeight: 800, color: colors.textPrimary }}>{formatCurrency(total)}</Typography>
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" gap={1} alignItems="center">
                    {plan.status === 'Proposed' && editable && (
                      <Button size="small" variant="contained" startIcon={<ReceiptIcon sx={{ fontSize: 15 }} />} onClick={() => handleAccept(plan)} sx={{ fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        Accept &amp; Bill
                      </Button>
                    )}
                    {plan.invoiceId && (
                      <Button size="small" onClick={() => navigate('/billing')} sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'none' }}>
                        View invoice
                      </Button>
                    )}
                    <IconButton size="small" onClick={() => setExpanded(isOpen ? null : plan.id)}>
                      {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Stack>
                </Box>

                {/* Items */}
                <Collapse in={isOpen} unmountOnExit>
                  <Box sx={{ borderTop: `1px solid ${colors.border}`, bgcolor: colors.surfaceAlt }}>
                    {!canChart && (
                      <Box sx={{ px: 2.5, pt: 1.5 }}>
                        <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                          Accept the plan to start marking procedures complete.
                        </Typography>
                      </Box>
                    )}
                    <Stack sx={{ p: 1.5 }} spacing={0.5}>
                      {plan.items.map((it) => (
                        <Box
                          key={it.id}
                          onClick={() => canChart && togglePlanItem(plan.id, it.id)}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, borderRadius: '8px',
                            bgcolor: colors.surface, border: `1px solid ${colors.border}`,
                            cursor: canChart ? 'pointer' : 'default',
                            transition: 'background .12s ease',
                            '&:hover': canChart ? { bgcolor: '#F8F9FF' } : {},
                          }}
                        >
                          {it.done
                            ? <DoneIcon sx={{ fontSize: 20, color: colors.success }} />
                            : <UncheckedIcon sx={{ fontSize: 20, color: canChart ? colors.textLight : colors.borderLight }} />}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary, textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.6 : 1 }}>
                              {it.procedure}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                              Tooth {it.toothNumber}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 700, color: colors.textPrimary }}>{formatCurrency(it.cost)}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* New plan dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Create Treatment Plan
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Group multiple procedures into one plan. Fields marked * are required.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} sm={5}>
                <TextField select label="Patient" value={form.patientId} onChange={(e) => { setForm((p) => ({ ...p, patientId: e.target.value })); setFormError(''); }} fullWidth required>
                  {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField select label="Lead Dentist" value={form.dentistId} onChange={(e) => setForm((p) => ({ ...p, dentistId: e.target.value }))} fullWidth>
                  {dentists.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Plan Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Full Mouth Rehab" fullWidth />
              </Grid>
            </Grid>

            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Procedures</Typography>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {form.items.map((it, idx) => (
                <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
                  <TextField select label="Procedure" value={it.procedure} onChange={(e) => updateItem(idx, 'procedure', e.target.value)} sx={{ flex: 1 }} size="small">
                    {TREATMENT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                  <TextField select label="Tooth" value={it.toothNumber} onChange={(e) => updateItem(idx, 'toothNumber', e.target.value)} sx={{ width: 110 }} size="small">
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="—">—</MenuItem>
                    {TOOTH_NUMBERS.map((n) => <MenuItem key={n} value={n}>#{n}</MenuItem>)}
                  </TextField>
                  <TextField label="Fee (PKR)" type="number" value={it.cost} onChange={(e) => updateItem(idx, 'cost', e.target.value)} sx={{ width: 130 }} size="small" inputProps={{ min: 0 }} />
                  <IconButton size="small" onClick={() => removeItem(idx)} disabled={form.items.length === 1} sx={{ color: colors.error }}>
                    <DeleteIcon sx={{ fontSize: 19 }} />
                  </IconButton>
                </Stack>
              ))}
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Button startIcon={<AddIcon sx={{ fontSize: 17 }} />} onClick={addItem} sx={{ fontWeight: 600, textTransform: 'none' }}>Add procedure</Button>
              <Typography sx={{ fontWeight: 800, color: colors.textPrimary }}>Total: {formatCurrency(formTotal)}</Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Create Plan</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
