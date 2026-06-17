import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';

import { useClinicData } from '../hooks/useClinicData';
import { calculateAge, formatDate } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';

const Patients = () => {
  const { patients, addPatient } = useClinicData();
  const navigate = useNavigate();
  const location = useLocation();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    gender: 'Male',
    dob: '',
    phone: '',
    email: '',
    bloodGroup: 'O+',
    allergies: '',
    address: '',
    status: 'Active'
  });

  // Handle parameter passed from Quick Actions on dashboard
  useEffect(() => {
    if (location.state?.openRegister) {
      const timerId = window.setTimeout(() => {
        setOpenModal(true);
        window.history.replaceState({}, document.title);
      }, 0);

      return () => window.clearTimeout(timerId);
    }
  }, [location]);

  // Form Validation and submission
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.phone || !newPatient.dob) {
      alert('Please fill out Name, Phone, and Date of Birth.');
      return;
    }
    const createdPatient = addPatient(newPatient);
    setOpenModal(false);
    // Reset Form
    setNewPatient({
      name: '',
      gender: 'Male',
      dob: '',
      phone: '',
      email: '',
      bloodGroup: 'O+',
      allergies: '',
      address: '',
      status: 'Active'
    });
    navigate(`/patients/${createdPatient.id}`);
  };

  // Filtered Patients List
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = statusFilter === 'All' || patient.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Patient Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage comprehensive clinic dental records, demographics, and history.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#172E6E' }, textTransform: 'none', px: 3, borderRadius: '8px' }}
        >
          Register New Patient
        </Button>
      </Box>

      {/* Filter and Search Card */}
      <Card sx={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', borderRadius: '12px' }}>
        <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', p: '20px !important' }}>
          {/* Search bar */}
          <TextField
            placeholder="Search by name, phone, or email..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Filter Dropdown */}
          <TextField
            select
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon color="action" />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="All">All Patients</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Pending Payment">Pending Payment</MenuItem>
            <MenuItem value="Old Patients">Old Patients</MenuItem>
          </TextField>

          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontWeight: 'medium' }}>
            Showing {filteredPatients.length} record(s)
          </Typography>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', overflow: 'hidden' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Patient ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Gender</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Age</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Phone Number</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Registration Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Allergies</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Account Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No patient records found matching your search.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {patient.id}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ color: '#1E3A8A', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      {patient.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>{calculateAge(patient.dob)} yrs</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{formatDate(patient.registrationDate)}</TableCell>
                  <TableCell>
                    {patient.allergies !== 'None' ? (
                      <Chip
                        label={patient.allergies}
                        color="error"
                        size="small"
                        variant="soft"
                        sx={{ fontWeight: 'semibold', bgcolor: '#FEF2F2', color: '#EF4444', border: '1px solid #FEE2E2' }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={patient.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      sx={{ textTransform: 'none', borderColor: '#1E3A8A', color: '#1E3A8A', '&:hover': { bgcolor: 'rgba(30, 58, 138, 0.04)', borderColor: '#172E6E' } }}
                    >
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Register Patient Modal Form */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #E5E7EB', py: 2 }}>
          Register New Patient File
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  name="name"
                  value={newPatient.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={newPatient.dob}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Gender"
                  name="gender"
                  value={newPatient.gender}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  size="small"
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Blood Group"
                  name="bloodGroup"
                  value={newPatient.bloodGroup}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  name="phone"
                  value={newPatient.phone}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  placeholder="+92 300 1234567"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={newPatient.email}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Allergies (e.g. Penicillin, Latex, None)"
                  name="allergies"
                  value={newPatient.allergies}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="List clinical allergies or write 'None'"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Residential Address"
                  name="address"
                  value={newPatient.address}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E5E7EB', justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpenModal(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 'bold' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#172E6E' }, textTransform: 'none', fontWeight: 'bold', px: 3 }}
            >
              Register Patient
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Patients;
