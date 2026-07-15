import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/helpers';
import { APPOINTMENT_STATUSES, TREATMENT_TYPES } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import { colors } from '../theme/theme';
import { Add as AddIcon, CalendarMonth as CalendarMonthIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, List as ListIcon, Edit as EditIcon, ArrowForward as ArrowForwardIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';

const EMPTY_FORM = {
  patientId: '',
  dentistId: 'dentist-1',
  date: new Date().toISOString().split('T')[0],
  time: '10:00 AM',
  type: 'Consultation',
  notes: '',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const buildCalendarDays = (year, month) => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = first.getDay();
  const days = [];

  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push({ dayNum: d, dateString: `${year}-${mm}-${dd}` });
  }
  return days;
};

const Appointments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    appointments,
    patients,
    dentists,
    addAppointment,
    updateAppointmentStatus,
    assignDentist,
  } = useClinicData();
  const { notify } = useNotification();

  const today = new Date();
  const [viewMode, setViewMode] = useState('list');
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const [anchorElStatus, setAnchorElStatus] = useState(null);
  const [anchorElDentist, setAnchorElDentist] = useState(null);
  const [activeApptId, setActiveApptId] = useState(null);

  // Open the schedule dialog once when navigated here with that intent.
  // Done in render (keyed off location.key) rather than an effect to avoid
  // the cascading-render anti-pattern.
  const [appliedNavKey, setAppliedNavKey] = useState(location.key);
  if (location.key !== appliedNavKey) {
    setAppliedNavKey(location.key);
    if (location.state?.openSchedule) setOpenModal(true);
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) { setFormError('Please select a patient.'); return; }
    if (!formData.date) { setFormError('Please pick a date.'); return; }
    try {
      const added = await addAppointment(formData);
      setOpenModal(false);
      setFormData(EMPTY_FORM);
      setFormError('');
      notify(`Appointment booked for ${added.patientName} on ${formatDate(added.date)}.`, 'success');
    } catch (err) {
      console.error('Book appointment failed:', err);
      setFormError('Could not save the appointment — please try again.');
    }
  };

  const handleStatusChange = (status) => {
    updateAppointmentStatus(activeApptId, status);
    notify(`Status updated to "${status}".`, 'info');
    setAnchorElStatus(null);
    setActiveApptId(null);
  };

  const handleDentistChange = (dentistId) => {
    assignDentist(activeApptId, dentistId);
    notify('Dentist assignment updated.', 'success');
    setAnchorElDentist(null);
    setActiveApptId(null);
  };

  const todayStr = today.toISOString().split('T')[0];

  const calendarDays = useMemo(
    () => buildCalendarDays(calYear, calMonth),
    [calYear, calMonth]
  );

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Appointment Scheduler</Typography>
          <Typography variant="body2" color="text.secondary">
            Coordinate shifts, assign practitioners, and track patient status.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              startIcon={<ListIcon />}
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
              startIcon={<CalendarMonthIcon />}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </Button>
          </ButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}>
            Schedule Slot
          </Button>
        </Box>
      </Box>

      {viewMode === 'list' && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Procedure</TableCell>
                <TableCell>Practitioner</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CalendarMonthIcon sx={{ fontSize: 36, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No appointments recorded yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appt) => (
                  <TableRow key={appt.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{formatDate(appt.date)}</TableCell>
                    <TableCell>{appt.time}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: colors.primary }}>{appt.patientName}</TableCell>
                    <TableCell><Chip label={appt.type} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2">{appt.dentistName}</Typography>
                        <Tooltip title="Re-assign dentist">
                          <IconButton size="small" onClick={(e) => { setAnchorElDentist(e.currentTarget); setActiveApptId(appt.id); }}>
                            <EditIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StatusBadge status={appt.status} />
                        <Tooltip title="Change status">
                          <IconButton size="small" onClick={(e) => { setAnchorElStatus(e.currentTarget); setActiveApptId(appt.id); }}>
                            <MoreVertIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', maxWidth: 220, fontSize: '0.8rem' }}>
                      {appt.notes || '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="text"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(`/patients/${appt.patientId}`)}
                        sx={{ textTransform: 'none', color: colors.primary, fontWeight: 700 }}
                      >
                        Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {viewMode === 'calendar' && (
        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ bgcolor: colors.primary, color: '#fff', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton size="small" onClick={prevMonth} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={700}>
              {MONTH_NAMES[calMonth]} {calYear}
            </Typography>
            <IconButton size="small" onClick={nextMonth} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#fff' }}>
            <Grid container spacing={0.5} sx={{ textAlign: 'center', mb: 1 }}>
              {WEEKDAYS.map((w) => (
                <Grid item xs={12 / 7} key={w} sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', py: 0.75 }}>
                  {w}
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={0.5}>
              {calendarDays.map((day, idx) => {
                if (!day) return <Grid item xs={12 / 7} key={`e-${idx}`} sx={{ height: 110 }} />;
                const dayAppts = appointments.filter((a) => a.date === day.dateString);
                const isToday = day.dateString === todayStr;
                return (
                  <Grid
                    item
                    xs={12 / 7}
                    key={day.dayNum}
                    sx={{
                      height: 110,
                      border: `1px solid ${isToday ? colors.primary : colors.border}`,
                      borderRadius: '4px',
                      p: 0.5,
                      bgcolor: isToday ? '#EFF6FF' : '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.4,
                      overflow: 'hidden',
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        color: isToday ? colors.primary : 'text.primary',
                        bgcolor: isToday ? '#DBEAFE' : 'transparent',
                        px: 0.8,
                        py: 0.15,
                        borderRadius: '4px',
                        display: 'inline-block',
                        alignSelf: 'flex-start',
                        fontSize: '0.75rem',
                      }}
                    >
                      {day.dayNum}
                    </Typography>
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      {dayAppts.map((appt) => (
                        <Box
                          key={appt.id}
                          title={`${appt.time} — ${appt.patientName} (${appt.type})`}
                          onClick={() => navigate(`/patients/${appt.patientId}`)}
                          sx={{
                            fontSize: '0.62rem',
                            bgcolor: appt.status === 'Completed' ? '#D1FAE5' : '#FEF3C7',
                            color: appt.status === 'Completed' ? '#065F46' : '#92400E',
                            p: '2px 4px',
                            borderRadius: '3px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            borderLeft: `3px solid ${appt.status === 'Completed' ? '#10B981' : '#F59E0B'}`,
                            cursor: 'pointer',
                          }}
                        >
                          {appt.time}: {appt.patientName}
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

      {/* Book Appointment Dialog */}
      <Dialog open={openModal} onClose={() => { setOpenModal(false); setFormError(''); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Book Appointment Slot
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {formError && <Alert severity="error" sx={{ borderRadius: '8px', py: 0.5 }}>{formError}</Alert>}
            <TextField
              select
              label="Patient"
              name="patientId"
              value={formData.patientId}
              onChange={handleInputChange}
              fullWidth
              required
            >
              {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Assign Dentist"
              name="dentistId"
              value={formData.dentistId}
              onChange={handleInputChange}
              fullWidth
            >
              {dentists.map((d) => <MenuItem key={d.id} value={d.id}>{d.name} — {d.specialty}</MenuItem>)}
            </TextField>
            <TextField
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time Slot"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              fullWidth
              placeholder="e.g. 10:00 AM"
            />
            <TextField
              select
              label="Procedure Type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              fullWidth
            >
              {TREATMENT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField
              label="Internal Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              placeholder="Clinical symptoms or prep instructions…"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenModal(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>
              Save Appointment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Menu
        anchorEl={anchorElStatus}
        open={Boolean(anchorElStatus)}
        onClose={() => setAnchorElStatus(null)}
        PaperProps={{ sx: { minWidth: 150, borderRadius: '8px' } }}
      >
        {APPOINTMENT_STATUSES.map((s) => (
          <MenuItem key={s} onClick={() => handleStatusChange(s)} sx={{ fontSize: '0.875rem' }}>{s}</MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={anchorElDentist}
        open={Boolean(anchorElDentist)}
        onClose={() => setAnchorElDentist(null)}
        PaperProps={{ sx: { minWidth: 200, borderRadius: '8px' } }}
      >
        {dentists.map((d) => (
          <MenuItem key={d.id} onClick={() => handleDentistChange(d.id)} sx={{ fontSize: '0.875rem' }}>{d.name}</MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default Appointments;
