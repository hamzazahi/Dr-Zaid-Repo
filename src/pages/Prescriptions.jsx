import { useState } from 'react';
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
  LocalPharmacy as LocalPharmacyIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';

const EMPTY_FORM = { patientId: '', medication: '', dosage: '', frequency: '', duration: '', reason: '', dentistId: 'dentist-1', status: 'active' };
const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

function StatusPill({ status }) {
  const isActive = status === 'active';
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: isActive ? '#EFF6FF' : '#F0FDF4' }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isActive ? '#3B82F6' : '#10B981' }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: isActive ? '#1D4ED8' : '#065F46' }}>{isActive ? 'Active' : 'Completed'}</Typography>
    </Box>
  );
}

export default function Prescriptions() {
  const { patients, dentists, prescriptions, addPrescription, updatePrescriptionStatus } = useClinicData();
  const { notify } = useNotification();
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (!form.medication.trim()) { setFormError('Medication name is required.'); return; }
    if (!form.dosage.trim()) { setFormError('Dosage is required.'); return; }
    const patient = patients.find((p) => p.id === form.patientId);
    addPrescription(form);
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`Prescription created for ${patient?.name}.`, 'success');
  };

  const toggleStatus = (px) => {
    const next = px.status === 'active' ? 'completed' : 'active';
    updatePrescriptionStatus(px.id, next);
    notify(`Prescription for ${px.patientName} marked ${next}.`, 'success');
  };

  const selectedPatient = patients.find((p) => p.id === form.patientId);
  const selectedAllergies = selectedPatient?.allergies && selectedPatient.allergies.toLowerCase() !== 'none'
    ? selectedPatient.allergies : null;

  const activeCount = prescriptions.filter((p) => p.status === 'active').length;
  const completedCount = prescriptions.filter((p) => p.status === 'completed').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Prescription Management</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Track and manage all patient prescriptions.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          New Prescription
        </Button>
      </Box>

      <Grid container spacing={2}>
        {[
          { label: 'Total Prescriptions', value: prescriptions.length, icon: <LocalPharmacyIcon />, bg: '#EEF2FF', color: colors.primary },
          { label: 'Active', value: activeCount, icon: <AccessTimeIcon />, bg: '#E0F2FE', color: '#0369A1' },
          { label: 'Completed', value: completedCount, icon: <CheckCircleIcon />, bg: '#ECFDF5', color: colors.success },
        ].map((card) => (
          <Grid item xs={12} sm={4} key={card.label}>
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

      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Prescription Records</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{prescriptions.length} records</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Medication</TableCell>
                <TableCell>Dosage</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Prescribed By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <LocalPharmacyIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>No prescriptions issued yet</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>Click "New Prescription" to create the first record.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((px) => (
                  <TableRow key={px.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(px.patientName) }}>
                          {px.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{px.patientName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(px.date)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={700} sx={{ color: colors.primary }}>{px.medication}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{px.dosage}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{px.frequency || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{px.duration || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{px.doctorName}</Typography></TableCell>
                    <TableCell><StatusPill status={px.status} /></TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => toggleStatus(px)} sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'none', whiteSpace: 'nowrap' }}>
                        {px.status === 'active' ? 'Mark Completed' : 'Reactivate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Create New Prescription
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Fields marked * are required.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            {selectedAllergies && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: '8px' }}>
                Allergy alert: {selectedPatient.name} is allergic to <strong>{selectedAllergies}</strong>. Verify medication safety before prescribing.
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select label="Patient" name="patientId" value={form.patientId} onChange={handleChange} fullWidth required>
                  {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Prescribing Dentist" name="dentistId" value={form.dentistId} onChange={handleChange} fullWidth>
                  {dentists.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Medication Name" name="medication" value={form.medication} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Dosage" name="dosage" value={form.dosage} onChange={handleChange} placeholder="e.g. 500mg" fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Frequency" name="frequency" value={form.frequency} onChange={handleChange} placeholder="e.g. Twice daily" fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Duration" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 7 days" fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Reason / Clinical Notes" name="reason" value={form.reason} onChange={handleChange} fullWidth multiline rows={2} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Create Prescription</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
