import { Box, Card, CardContent, Typography, Grid, Stack, Button, Dialog, TextField, MenuItem, Chip } from '@mui/material';
import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { colors } from '../theme/theme';
import { DataTable } from '../components/table/DataTable';
import { StatsCard } from '../components/cards/CardComponents';
import { StatusBadge } from '../components/common/StateComponents';
import { mockPrescriptions } from '../utils/mockData';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState(mockPrescriptions);
  const [openDialog, setOpenDialog] = useState(false);

  const prescriptionColumns = [
    { id: 'patientName', label: 'Patient', sortable: true, minWidth: 150 },
    { id: 'medication', label: 'Medication', sortable: true, minWidth: 150 },
    { id: 'dosage', label: 'Dosage', minWidth: 120 },
    { id: 'frequency', label: 'Frequency', minWidth: 130 },
    { id: 'duration', label: 'Duration', minWidth: 100 },
    { id: 'doctorName', label: 'Prescribed By', minWidth: 140 },
    { 
      id: 'status', 
      label: 'Status',
      render: (value) => <StatusBadge status={value === 'active' ? 'active' : 'completed'} size="small" />
    },
  ];

  const activeCount = prescriptions.filter(p => p.status === 'active').length;
  const completedCount = prescriptions.filter(p => p.status === 'completed').length;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary }}>
            Prescription Management
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.5 }}>
            Track and manage all patient prescriptions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: colors.primary }}
        >
          New Prescription
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Prescriptions"
            value={prescriptions.length.toString()}
            icon={<LocalPharmacyIcon sx={{ fontSize: '1.5rem' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Prescriptions"
            value={activeCount.toString()}
            icon={<AccessTimeIcon sx={{ fontSize: '1.5rem' }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Completed"
            value={completedCount.toString()}
            icon={<CheckCircleIcon sx={{ fontSize: '1.5rem' }} />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Prescriptions Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataTable
            columns={prescriptionColumns}
            data={prescriptions}
            selectable={true}
          />
        </CardContent>
      </Card>

      {/* New Prescription Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Create New Prescription
          </Typography>
          <Stack spacing={2}>
            <TextField select label="Patient" fullWidth>
              <MenuItem value="">Select Patient</MenuItem>
            </TextField>
            <TextField label="Medication Name" fullWidth />
            <TextField label="Dosage" placeholder="e.g., 500mg" fullWidth />
            <TextField label="Frequency" placeholder="e.g., Twice daily" fullWidth />
            <TextField label="Duration" placeholder="e.g., 7 days" fullWidth />
            <TextField label="Reason for Prescription" fullWidth multiline rows={2} />
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setOpenDialog(false)} variant="outlined">
                Cancel
              </Button>
              <Button variant="contained" color="primary">
                Create Prescription
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
}
