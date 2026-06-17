import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../context/NotificationContext';
import { formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';
import { Add as AddIcon, LocalPharmacy as LocalPharmacyIcon, AccessTime as AccessTimeIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

const EMPTY_FORM = {
  patientId: '',
  medication: '',
  dosage: '',
  frequency: '',
  duration: '',
  reason: '',
  dentistId: 'dentist-1',
  status: 'active',
};

export default function Prescriptions() {
  const { patients, dentists } = useClinicData();
  const { notify } = useNotification();
  const [prescriptions, setPrescriptions] = useState([]);
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
    const dentist = dentists.find((d) => d.id === form.dentistId);
    const newPx = {
      ...form,
      id: `px-${Date.now()}`,
      patientName: patient?.name || 'Unknown',
      doctorName: dentist?.name || 'Unknown',
      date: new Date().toISOString().split('T')[0],
    };
    setPrescriptions((prev) => [newPx, ...prev]);
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`Prescription created for ${patient?.name}.`, 'success');
  };

  const activeCount = prescriptions.filter((p) => p.status === 'active').length;
  const completedCount = prescriptions.filter((p) => p.status === 'completed').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Prescription Management</Typography>
          <Typography variant="body2" color="text.secondary">Track and manage all patient prescriptions.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
          New Prescription
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {[
          { label: 'Total Prescriptions', value: prescriptions.length, icon: <LocalPharmacyIcon />, bg: '#EEF2FF', color: colors.primary },
          { label: 'Active', value: activeCount, icon: <AccessTimeIcon />, bg: '#E0F2FE', color: '#0369A1' },
          { label: 'Completed', value: completedCount, icon: <CheckCircleIcon />, bg: '#ECFDF5', color: colors.success },
        ].map((card) => (
          <Grid item xs={12} sm={4} key={card.label}>
            <Card>
              <CardContent sx={{ p: '20px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600, mb: 1 }}>{card.label}</Typography>
                    <Typography variant="h4" fontWeight={700}>{card.value}</Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: card.bg, color: card.color, display: 'flex' }}>
                    {card.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Prescription Records</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Medication</TableCell>
              <TableCell>Dosage</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Prescribed By</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <LocalPharmacyIcon sx={{ fontSize: 36, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No prescriptions issued yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((px) => (
                <TableRow key={px.id} hover>
                  <TableCell>{formatDate(px.date)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{px.patientName}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.primary }}>{px.medication}</TableCell>
                  <TableCell>{px.dosage}</TableCell>
                  <TableCell>{px.frequency}</TableCell>
                  <TableCell>{px.duration}</TableCell>
                  <TableCell>{px.doctorName}</TableCell>
                  <TableCell>
                    <Chip
                      label={px.status === 'active' ? 'Active' : 'Completed'}
                      size="small"
                      color={px.status === 'active' ? 'info' : 'success'}
                      variant="outlined"
                      sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Create New Prescription
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && (
              <Box sx={{ mb: 2 }}>
                <Typography color="error" variant="body2">{formError}</Typography>
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select label="Patient *" name="patientId" value={form.patientId} onChange={handleChange} fullWidth required>
                  {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Prescribing Dentist" name="dentistId" value={form.dentistId} onChange={handleChange} fullWidth>
                  {dentists.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Medication Name *" name="medication" value={form.medication} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Dosage *" name="dosage" value={form.dosage} onChange={handleChange} placeholder="e.g. 500mg" fullWidth required />
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
