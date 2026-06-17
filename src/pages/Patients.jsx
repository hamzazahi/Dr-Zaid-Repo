import { useEffect, useMemo, useState } from 'react';
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
  Chip,
  FormHelperText,
} from '@mui/material';

import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../context/NotificationContext';
import { calculateAge, formatDate } from '../utils/helpers';
import { BLOOD_GROUPS, PATIENT_STATUSES } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import { colors } from '../theme/theme';
import { Search as SearchIcon, Add as AddIcon, FilterList as FilterListIcon, Person as PersonIcon } from '@mui/icons-material';

const EMPTY_FORM = {
  name: '',
  gender: 'Male',
  dob: '',
  phone: '',
  email: '',
  bloodGroup: 'O+',
  allergies: '',
  address: '',
  status: 'Active',
};

const Patients = () => {
  const { patients, addPatient } = useClinicData();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (location.state?.openRegister) {
      setOpenModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Full name is required.';
    if (!form.phone.trim()) errors.phone = 'Phone number is required.';
    if (!form.dob) errors.dob = 'Date of birth is required.';
    else if (new Date(form.dob) > new Date()) errors.dob = 'Date of birth cannot be in the future.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email address.';
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const created = addPatient(form);
    setOpenModal(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
    notify(`Patient "${created.name}" registered successfully.`, 'success');
    navigate(`/patients/${created.id}`);
  };

  const handleClose = () => {
    setOpenModal(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const filteredPatients = useMemo(() =>
    patients.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) || (p.email && p.email.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    }),
    [patients, searchQuery, statusFilter]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Patient Directory</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage patient records, demographics, and history.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}>
          Register Patient
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', p: '16px 20px !important' }}>
          <TextField
            placeholder="Search by name, phone, or email…"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="Status Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 170 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="All">All Patients</MenuItem>
            {PATIENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {filteredPatients.length} record{filteredPatients.length !== 1 ? 's' : ''}
          </Typography>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Patient ID</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Registered</TableCell>
              <TableCell>Allergies</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <PersonIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                  <Typography variant="body2" color="text.secondary">No patients match your search.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: colors.textSecondary }}>
                    {patient.id}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: colors.primary, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
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
                    {patient.allergies && patient.allergies.toLowerCase() !== 'none' ? (
                      <Chip
                        label={patient.allergies}
                        size="small"
                        sx={{ bgcolor: '#FEF2F2', color: colors.error, border: `1px solid #FEE2E2`, fontWeight: 600 }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={patient.status} /></TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      sx={{ textTransform: 'none' }}
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

      <Dialog open={openModal} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Register New Patient
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={Boolean(formErrors.name)}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formErrors.dob)}
                  helperText={formErrors.dob}
                  inputProps={{ max: new Date().toISOString().split('T')[0] }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Gender" name="gender" value={form.gender} onChange={handleInputChange} fullWidth required>
                  {['Male', 'Female', 'Other'].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Blood Group" name="bloodGroup" value={form.bloodGroup} onChange={handleInputChange} fullWidth>
                  {BLOOD_GROUPS.map((bg) => <MenuItem key={bg} value={bg}>{bg}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  placeholder="+92 300 1234567"
                  error={Boolean(formErrors.phone)}
                  helperText={formErrors.phone}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  fullWidth
                  error={Boolean(formErrors.email)}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Allergies"
                  name="allergies"
                  value={form.allergies}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="List allergies or enter 'None'"
                />
                <FormHelperText>Enter known drug or material allergies. This will be flagged in the patient profile.</FormHelperText>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Residential Address"
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, px: 3 }}>
              Register Patient
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Patients;
