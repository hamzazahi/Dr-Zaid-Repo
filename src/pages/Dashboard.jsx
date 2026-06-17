import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PaymentsIcon from '@mui/icons-material/Payments';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PaymentIcon from '@mui/icons-material/Payment';

import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';

const Dashboard = () => {
  const { getTodayAppointments, getTodayMetrics, updateAppointmentStatus } = useClinicData();
  const todayAppts = getTodayAppointments();
  const metrics = getTodayMetrics();
  const navigate = useNavigate();

  // For Inline Status update menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedApptId, setSelectedApptId] = useState(null);

  const handleOpenStatusMenu = (event, id) => {
    setAnchorEl(event.currentTarget);
    setSelectedApptId(id);
  };

  const handleCloseStatusMenu = () => {
    setAnchorEl(null);
    setSelectedApptId(null);
  };

  const handleStatusChange = (status) => {
    if (selectedApptId) {
      updateAppointmentStatus(selectedApptId, status);
    }
    handleCloseStatusMenu();
  };

  // Metrics Data Map
  const metricCards = [
    {
      title: "Today's Patients",
      value: metrics.totalPatientsToday,
      icon: <PeopleIcon sx={{ fontSize: 32, color: '#1E3A8A' }} />,
      bgColor: '#EFF6FF',
      description: 'Active cases seen today'
    },
    {
      title: "Appointments Today",
      value: metrics.appointmentsTodayCount,
      icon: <CalendarMonthIcon sx={{ fontSize: 32, color: '#2563EB' }} />,
      bgColor: '#EEF2F6',
      description: 'Scheduled slots'
    },
    {
      title: "Completed Treatments",
      value: metrics.completedTreatmentsCount,
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 32, color: '#10B981' }} />,
      bgColor: '#ECFDF5',
      description: 'Concluded procedures'
    },
    {
      title: "Pending Payments",
      value: formatCurrency(metrics.totalPendingPayments),
      icon: <HourglassEmptyIcon sx={{ fontSize: 32, color: '#EF4444' }} />,
      bgColor: '#FEF2F2',
      description: 'Outstanding collections'
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(metrics.revenueToday),
      icon: <PaymentsIcon sx={{ fontSize: 32, color: '#0D9488' }} />,
      bgColor: '#F0FDFA',
      description: 'Collected earnings'
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Welcome Banner */}
      <Box>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Clinical Operations Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of daily dental care workflows, schedules, and billing metrics.
        </Typography>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={3}>
        {metricCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card sx={{ height: '100%', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)', borderRadius: '12px' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: '20px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                    {card.title}
                  </Typography>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: card.bgColor, display: 'flex', alignItems: 'center' }}>
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#111827', mt: 1 }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Shortcuts */}
      <Card sx={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', borderRadius: '12px', p: 1 }}>
        <CardContent sx={{ p: '16px !important' }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: '#374151' }}>
            Clinical Fast-Track Actions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/patients', { state: { openRegister: true } })}
              sx={{ bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#172E6E' }, textTransform: 'none', px: 3, py: 1, borderRadius: '8px' }}
            >
              Register New Patient
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditCalendarIcon />}
              onClick={() => navigate('/appointments', { state: { openSchedule: true } })}
              sx={{ color: '#1E3A8A', borderColor: '#1E3A8A', '&:hover': { borderColor: '#172E6E', bgcolor: 'rgba(30, 58, 138, 0.04)' }, textTransform: 'none', px: 3, py: 1, borderRadius: '8px' }}
            >
              Book Appointment
            </Button>
            <Button
              variant="outlined"
              startIcon={<LocalHospitalIcon />}
              onClick={() => navigate('/treatments')}
              sx={{ color: '#0D9488', borderColor: '#0D9488', '&:hover': { borderColor: '#0B7A6F', bgcolor: 'rgba(13, 148, 136, 0.04)' }, textTransform: 'none', px: 3, py: 1, borderRadius: '8px' }}
            >
              Record Treatment Case
            </Button>
            <Button
              variant="outlined"
              startIcon={<PaymentIcon />}
              onClick={() => navigate('/billing')}
              sx={{ color: '#E28743', borderColor: '#E28743', '&:hover': { borderColor: '#C46D2E', bgcolor: 'rgba(226, 135, 67, 0.04)' }, textTransform: 'none', px: 3, py: 1, borderRadius: '8px' }}
            >
              Issue Invoice / Record Payment
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Main Grid: Today's Appointments & Analytics preview */}
      <Grid container spacing={3}>
        {/* Today's appointments schedule */}
        <Grid item xs={12} lg={8}>
          <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Today's Appointment Schedule
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Patients checked-in or scheduled for today's shifts
                </Typography>
              </Box>
              <Chip label={`${todayAppts.length} Scheduled`} color="info" size="small" sx={{ fontWeight: 'bold' }} />
            </Box>

            {todayAppts.length === 0 ? (
              <Box sx={{ p: 6, textCenter: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <CalendarMonthIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  No appointments scheduled for today.
                </Typography>
              </Box>
            ) : (
              <Table sx={{ minWidth: 600 }}>
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Assigned Dentist</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Procedure Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Workflow Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayAppts.map((appt) => (
                    <TableRow key={appt.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 'semibold', color: '#374151' }}>
                        {appt.time}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{
                            color: '#1E3A8A',
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => navigate(`/patients/${appt.patientId}`)}
                        >
                          {appt.patientName}
                        </Typography>
                      </TableCell>
                      <TableCell>{appt.dentistName}</TableCell>
                      <TableCell>
                        <Chip label={appt.type} size="small" variant="outlined" sx={{ fontWeight: 'medium' }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StatusBadge status={appt.status} />
                          <Tooltip title="Advance Status">
                            <IconButton
                              size="small"
                              onClick={(e) => handleOpenStatusMenu(e, appt.id)}
                            >
                              <MoreVertIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="text"
                          size="small"
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => navigate(`/patients/${appt.patientId}`)}
                          sx={{ textTransform: 'none', color: '#1E3A8A', fontWeight: 'bold' }}
                        >
                          Patient Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Grid>

        {/* Clinical Distribution Insights */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #E5E7EB' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Clinical Service Stats
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Today's procedure breakdown
              </Typography>
            </Box>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 3 }}>
              {/* Custom SVG Mini Bar Chart / Stats */}
              {todayAppts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  Add treatments to view stats
                </Typography>
              ) : (
                ['Root Canal', 'Crown', 'Scaling', 'Filling', 'Extraction'].map((proc) => {
                  const count = todayAppts.filter(a => a.type === proc).length;
                  const percent = todayAppts.length > 0 ? (count / todayAppts.length) * 100 : 0;
                  return (
                    <Box key={proc} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="bold" color="text.primary">
                          {proc}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.secondary">
                          {count} ({Math.round(percent)}%)
                        </Typography>
                      </Box>
                      <Box sx={{ width: '100%', height: '8px', bgcolor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                        <Box sx={{ width: `${percent}%`, height: '100%', bgcolor: '#1E3A8A', borderRadius: '4px' }} />
                      </Box>
                    </Box>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dropdown Menu for Status Advancement */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseStatusMenu}
        PaperProps={{
          elevation: 2,
          sx: { minWidth: 140, borderRadius: '8px', mt: 0.5 }
        }}
      >
        <MenuItem onClick={() => handleStatusChange('Scheduled')}>Scheduled</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Arrived')}>Arrived</MenuItem>
        <MenuItem onClick={() => handleStatusChange('In Progress')}>In Progress</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Completed')}>Completed</MenuItem>
        <MenuItem onClick={() => handleStatusChange('No Show')}>No Show</MenuItem>
      </Menu>
    </Box>
  );
};

export default Dashboard;
