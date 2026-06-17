import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Menu,
  IconButton,
  ButtonGroup,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListIcon from '@mui/icons-material/List';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { useClinicData } from '../hooks/useClinicData';
import { formatDate } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';

const Appointments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    appointments,
    patients,
    dentists,
    addAppointment,
    updateAppointmentStatus,
    assignDentist
  } = useClinicData();

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [openModal, setOpenModal] = useState(false);

  // New Appointment Form state
  const [newAppt, setNewAppt] = useState({
    patientId: '',
    dentistId: 'dentist-1',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    type: 'Consultation',
    notes: ''
  });

  // Inline status and dentist edit anchor states
  const [anchorElStatus, setAnchorElStatus] = useState(null);
  const [anchorElDentist, setAnchorElDentist] = useState(null);
  const [activeApptId, setActiveApptId] = useState(null);

  useEffect(() => {
    if (location.state?.openSchedule) {
      const timerId = window.setTimeout(() => {
        setOpenModal(true);
        window.history.replaceState({}, document.title);
      }, 0);

      return () => window.clearTimeout(timerId);
    }
  }, [location]);

  const handleOpenStatus = (e, id) => {
    setAnchorElStatus(e.currentTarget);
    setActiveApptId(id);
  };

  const handleOpenDentist = (e, id) => {
    setAnchorElDentist(e.currentTarget);
    setActiveApptId(id);
  };

  const handleStatusChange = (status) => {
    updateAppointmentStatus(activeApptId, status);
    setAnchorElStatus(null);
    setActiveApptId(null);
  };

  const handleDentistChange = (dentistId) => {
    assignDentist(activeApptId, dentistId);
    setAnchorElDentist(null);
    setActiveApptId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAppt(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newAppt.patientId || !newAppt.date) {
      alert('Please fill out all required fields.');
      return;
    }
    addAppointment(newAppt);
    setOpenModal(false);
    // Reset Form
    setNewAppt({
      patientId: '',
      dentistId: 'dentist-1',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      type: 'Consultation',
      notes: ''
    });
  };

  // Generate simple monthly calendar dates for June 2026
  const getCalendarDays = () => {
    const days = [];
    const date = new Date(2026, 5, 1); // June is index 5
    const startOffset = date.getDay(); // Day of week (0-6) of 1st June

    // Add empty placeholders before June 1
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // June has 30 days
    for (let i = 1; i <= 30; i++) {
      const dateString = `2026-06-${String(i).padStart(2, '0')}`;
      days.push({
        dayNum: i,
        dateString,
        isToday: i === 16 // June 16, 2026 is current local time metadata
      });
    }

    return days;
  };

  const calendarDays = getCalendarDays();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Appointment Scheduler
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Coordinate shifts, assign clinical practitioners, and monitor patient status flows.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <ButtonGroup variant="outlined" size="small" sx={{ bgcolor: '#FFFFFF' }}>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              startIcon={<ListIcon />}
              onClick={() => setViewMode('list')}
              sx={viewMode === 'list' ? { bgcolor: '#1E3A8A' } : { color: '#1E3A8A', borderColor: '#1E3A8A' }}
            >
              List Grid
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
              startIcon={<CalendarMonthIcon />}
              onClick={() => setViewMode('calendar')}
              sx={viewMode === 'calendar' ? { bgcolor: '#1E3A8A' } : { color: '#1E3A8A', borderColor: '#1E3A8A' }}
            >
              Month Calendar
            </Button>
          </ButtonGroup>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
            sx={{ bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#172E6E' }, textTransform: 'none', px: 3, borderRadius: '8px' }}
          >
            Schedule Slot
          </Button>
        </Box>
      </Box>

      {/* RENDER LIST VIEW */}
      {viewMode === 'list' && (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', overflow: 'hidden' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Scheduled Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Time Slot</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Patient Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Procedure</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Assigned Practitioner</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status Badge</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Internal Notes</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    No appointments recorded.
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appt) => (
                  <TableRow key={appt.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{formatDate(appt.date)}</TableCell>
                    <TableCell>{appt.time}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1E3A8A' }}>
                      {appt.patientName}
                    </TableCell>
                    <TableCell>
                      <Chip label={appt.type} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{appt.dentistName}</Typography>
                        <IconButton size="small" onClick={(e) => handleOpenDentist(e, appt.id)}>
                          <EditIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StatusBadge status={appt.status} />
                        <IconButton size="small" onClick={(e) => handleOpenStatus(e, appt.id)}>
                          <MoreVertIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', maxWidth: 220, fontSize: '0.8rem' }}>
                      {appt.notes || '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="text"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(`/patients/${appt.patientId}`)}
                        sx={{ textTransform: 'none', color: '#1E3A8A', fontWeight: 'bold' }}
                      >
                        Clinical File
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* RENDER CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <Card sx={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#1E3A8A', color: '#FFFFFF', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              June 2026
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Clinic Calendar Grid View
            </Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#FFFFFF' }}>
            {/* Week Headers */}
            <Grid container spacing={1} sx={{ textAlign: 'center', mb: 1 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
                <Grid item xs={1.71} key={w} sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'text.secondary', py: 1 }}>
                  {w}
                </Grid>
              ))}
            </Grid>
            {/* Calendar Cells */}
            <Grid container spacing={1}>
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <Grid item xs={1.71} key={`empty-${idx}`} sx={{ height: 100, border: '1px solid #F3F4F6' }} />;
                }

                // Get appointments for this day
                const dayAppts = appointments.filter(a => a.date === day.dateString);

                return (
                  <Grid
                    item
                    xs={1.71}
                    key={day.dayNum}
                    sx={{
                      height: 120,
                      border: '1px solid #E5E7EB',
                      p: 0.5,
                      bgcolor: day.isToday ? '#EFF6FF' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      position: 'relative'
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{
                        color: day.isToday ? '#1E3A8A' : 'text.primary',
                        bgcolor: day.isToday ? '#DBEAFE' : 'transparent',
                        px: 0.8,
                        py: 0.2,
                        borderRadius: '4px',
                        display: 'inline-block',
                        alignSelf: 'flex-start',
                        fontSize: '0.75rem'
                      }}
                    >
                      {day.dayNum}
                    </Typography>

                    {/* Day Appts Chips */}
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      {dayAppts.map(appt => (
                        <Box
                          key={appt.id}
                          sx={{
                            fontSize: '0.65rem',
                            bgcolor: appt.status === 'Completed' ? '#D1FAE5' : '#FEF3C7',
                            color: appt.status === 'Completed' ? '#065F46' : '#92400E',
                            p: 0.5,
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            borderLeft: `3px solid ${appt.status === 'Completed' ? '#10B981' : '#F59E0B'}`,
                            cursor: 'pointer'
                          }}
                          title={`${appt.time} - ${appt.patientName} (${appt.type})`}
                        >
                          {appt.time} : {appt.patientName}
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Card>
      )}

      {/* Book Appointment Dialog Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #E5E7EB', py: 2 }}>
          Book Appointment Slot
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              select
              label="Select Patient"
              name="patientId"
              value={newAppt.patientId}
              onChange={handleInputChange}
              fullWidth
              required
              size="small"
            >
              {patients.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.name} ({p.id})</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Assign Dentist"
              name="dentistId"
              value={newAppt.dentistId}
              onChange={handleInputChange}
              fullWidth
              required
              size="small"
            >
              {dentists.map(d => (
                <MenuItem key={d.id} value={d.id}>{d.name} ({d.specialty})</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Appointment Date"
              name="date"
              type="date"
              value={newAppt.date}
              onChange={handleInputChange}
              fullWidth
              required
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Time Slot (e.g. 10:00 AM)"
              name="time"
              value={newAppt.time}
              onChange={handleInputChange}
              fullWidth
              required
              size="small"
            />

            <TextField
              select
              label="Procedure Type"
              name="type"
              value={newAppt.type}
              onChange={handleInputChange}
              fullWidth
              required
              size="small"
            >
              <MenuItem value="Consultation">Consultation</MenuItem>
              <MenuItem value="Filling">Filling</MenuItem>
              <MenuItem value="Scaling">Scaling</MenuItem>
              <MenuItem value="Root Canal">Root Canal</MenuItem>
              <MenuItem value="Extraction">Extraction</MenuItem>
              <MenuItem value="Crown">Crown</MenuItem>
            </TextField>

            <TextField
              label="Internal Scheduler Notes"
              name="notes"
              value={newAppt.notes}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Clinical symptoms or prep instructions..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
            <Button onClick={() => setOpenModal(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#172E6E' }, textTransform: 'none', fontWeight: 'bold' }}
            >
              Save Schedule
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dropdown Menu for Status Advancement */}
      <Menu
        anchorEl={anchorElStatus}
        open={Boolean(anchorElStatus)}
        onClose={() => setAnchorElStatus(null)}
        PaperProps={{ sx: { minWidth: 140, borderRadius: '8px' } }}
      >
        <MenuItem onClick={() => handleStatusChange('Scheduled')}>Scheduled</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Arrived')}>Arrived</MenuItem>
        <MenuItem onClick={() => handleStatusChange('In Progress')}>In Progress</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Completed')}>Completed</MenuItem>
        <MenuItem onClick={() => handleStatusChange('No Show')}>No Show</MenuItem>
      </Menu>

      {/* Dropdown Menu for Dentist Assignment */}
      <Menu
        anchorEl={anchorElDentist}
        open={Boolean(anchorElDentist)}
        onClose={() => setAnchorElDentist(null)}
        PaperProps={{ sx: { minWidth: 180, borderRadius: '8px' } }}
      >
        {dentists.map(d => (
          <MenuItem key={d.id} onClick={() => handleDentistChange(d.id)}>{d.name}</MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default Appointments;
