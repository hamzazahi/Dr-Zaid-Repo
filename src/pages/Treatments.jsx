import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useState } from 'react';
import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate } from '../utils/helpers';

const treatmentCosts = {
  Filling: 5000,
  Scaling: 4000,
  'Root Canal': 15000,
  Extraction: 3500,
  Crown: 25000
};

export default function Treatments() {
  const { patients, treatments, addTreatment } = useClinicData();
  const [form, setForm] = useState({
    patientId: '',
    type: 'Filling',
    toothNumber: '11',
    cost: treatmentCosts.Filling,
    notes: ''
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'type' ? { cost: treatmentCosts[value] || '' } : {})
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    addTreatment(form);
    setForm({
      patientId: '',
      type: 'Filling',
      toothNumber: '11',
      cost: treatmentCosts.Filling,
      notes: ''
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight="bold">Treatment Cases</Typography>
        <Typography variant="body2" color="text.secondary">
          Record procedures and generate patient invoices automatically.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField select label="Patient" value={form.patientId} onChange={(e) => handleChange('patientId', e.target.value)} fullWidth required size="small">
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>{patient.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select label="Procedure" value={form.type} onChange={(e) => handleChange('type', e.target.value)} fullWidth required size="small">
                  {Object.keys(treatmentCosts).map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select label="Tooth" value={form.toothNumber} onChange={(e) => handleChange('toothNumber', e.target.value)} fullWidth required size="small">
                  {Array.from({ length: 32 }, (_, index) => String(index + 1)).map((tooth) => (
                    <MenuItem key={tooth} value={tooth}>Tooth #{tooth}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField label="Fee" type="number" value={form.cost} onChange={(e) => handleChange('cost', e.target.value)} fullWidth required size="small" />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button type="submit" variant="contained" startIcon={<LocalHospitalIcon />} fullWidth sx={{ bgcolor: '#0D9488', textTransform: 'none', height: 40 }}>
                  Log Treatment
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Clinical notes" value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} fullWidth multiline rows={2} size="small" />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Procedure</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tooth</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Fee</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {treatments.map((treatment) => (
              <TableRow key={treatment.id} hover>
                <TableCell>{formatDate(treatment.date)}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1E3A8A' }}>{treatment.patientName}</TableCell>
                <TableCell><Chip label={treatment.type} size="small" variant="outlined" /></TableCell>
                <TableCell>#{treatment.toothNumber}</TableCell>
                <TableCell sx={{ color: 'text.secondary', maxWidth: 420 }}>{treatment.notes || '-'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(treatment.cost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
