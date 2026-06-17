import { Box, Grid, Card, CardContent, Typography, Button, Stack, TextField, MenuItem, Chip } from '@mui/material';
import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { colors } from '../theme/theme';
import { DataTable } from '../components/table/DataTable';
import { StatsCard } from '../components/cards/CardComponents';
import { StatusBadge } from '../components/common/StateComponents';
import { mockPatients } from '../utils/mockData';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function Patients() {
  const [patients, setPatients] = useState(mockPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const patientColumns = [
    { id: 'name', label: 'Name', sortable: true, minWidth: 150 },
    { id: 'email', label: 'Email', sortable: true, minWidth: 180 },
    { id: 'phone', label: 'Phone', minWidth: 130 },
    { id: 'age', label: 'Age', minWidth: 80 },
    { id: 'registrationDate', label: 'Registered', sortable: true, minWidth: 120 },
    { 
      id: 'status', 
      label: 'Status', 
      render: (value) => <StatusBadge status={value === 'active' ? 'active' : 'inactive'} />
    },
    { 
      id: 'appointmentsCount', 
      label: 'Appointments', 
      align: 'center',
      minWidth: 110,
    },
    { 
      id: 'totalAmount', 
      label: 'Total Billing', 
      minWidth: 120,
    },
  ];

  const activeCount = patients.filter(p => p.status === 'active').length;
  const inactiveCount = patients.filter(p => p.status === 'inactive').length;
  const totalBilling = patients.reduce((sum, p) => {
    const amount = parseFloat(p.totalAmount.replace(/[$,]/g, ''));
    return sum + amount;
  }, 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary }}>
            Patient Registry
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.5 }}>
            Manage and view all patient records and information
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: colors.primary,
            '&:hover': { bgcolor: colors.primaryDark },
          }}
        >
          New Patient
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Total Patients"
            value={patients.length.toString()}
            icon={<PeopleIcon sx={{ fontSize: '1.5rem' }} />}
            color="primary"
            trend={12}
            subtitle="vs last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Active Patients"
            value={activeCount.toString()}
            icon={<TrendingUpIcon sx={{ fontSize: '1.5rem' }} />}
            color="success"
            trend={8}
            subtitle={`${inactiveCount} inactive`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Total Billing"
            value={`Rs. ${(totalBilling / 1000).toFixed(1)}k`}
            icon={<Box sx={{ fontSize: '1.5rem' }}>₹</Box>}
            color="info"
            trend={15}
            subtitle="Total collected"
          />
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
            <TextField
              fullWidth
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: colors.textSecondary }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colors.surface,
                }
              }}
            />
            <TextField
              select
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              sx={{
                color: colors.primary,
                borderColor: colors.primary,
                '&:hover': { bgcolor: colors.surfaceAlt },
              }}
            >
              More Filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataTable
            columns={patientColumns}
            data={filteredPatients}
            selectable={true}
            onRowClick={(patient) => setSelectedPatient(patient)}
            emptyState={`No patients found${searchTerm ? ' matching your search' : ''}`}
          />
        </CardContent>
      </Card>

      {/* Selected Patient Detail Panel */}
      {selectedPatient && (
        <Card sx={{ mt: 3, bgcolor: colors.surfaceAlt }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Patient Details: {selectedPatient.name}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSelectedPatient(null)}
              >
                Close
              </Button>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                    Email
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedPatient.email}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                    Phone
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedPatient.phone}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                    Insurance
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedPatient.insurance}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                    Last Visit
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedPatient.lastVisit}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                    Medical History
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedPatient.medicalHistory}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                    Appointments
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedPatient.appointmentsCount}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                    Total Billing
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedPatient.totalAmount}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                    Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedPatient.address}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <Button variant="contained" color="primary">
                View Full Profile
              </Button>
              <Button variant="outlined">
                Schedule Appointment
              </Button>
              <Button variant="outlined">
                View Treatments
              </Button>
              <Button variant="outlined">
                View Invoices
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
