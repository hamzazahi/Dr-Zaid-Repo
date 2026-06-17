import { useMemo, useState } from 'react';
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
  Tooltip,
  LinearProgress
} from '@mui/material';

import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency } from '../utils/helpers';
import { APPOINTMENT_STATUSES } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import { colors } from '../theme/theme';
import { People as PeopleIcon, CalendarMonth as CalendarMonthIcon, CheckCircleOutlined as CheckCircleOutlineIcon, HourglassEmpty as HourglassEmptyIcon, Payments as PaymentsIcon, ArrowForward as ArrowForwardIcon, MoreVert as MoreVertIcon, EditCalendar as EditCalendarIcon, LocalHospital as LocalHospitalIcon, Payment as PaymentIcon } from '@mui/icons-material';

const PROCEDURE_TYPES = ['Root Canal', 'Crown', 'Scaling', 'Filling', 'Extraction', 'Consultation'];

const MetricCard = ({ title, value, icon, bgColor, description }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: '20px !important' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ p: 1, borderRadius: '8px', bgcolor: bgColor }}>{icon}</Box>
      </Box>
      <Typography variant="h5" fontWeight={700} sx={{ color: colors.textPrimary, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: colors.textLight }}>
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { getTodayAppointments, getTodayMetrics, updateAppointmentStatus } = useClinicData();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const todayAppts = useMemo(() => getTodayAppointments(), [getTodayAppointments]);
  const metrics = useMemo(() => getTodayMetrics(), [getTodayMetrics]);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedApptId, setSelectedApptId] = useState(null);

  const handleOpenMenu = (e, id) => { setAnchorEl(e.currentTarget); setSelectedApptId(id); };
  const handleCloseMenu = () => { setAnchorEl(null); setSelectedApptId(null); };

  const handleStatusChange = (status) => {
    if (selectedApptId) {
      updateAppointmentStatus(selectedApptId, status);
      notify(`Appointment status updated to "${status}"`, 'success');
    }
    handleCloseMenu();
  };

  const metricCards = [
    {
      title: "Today's Patients",
      value: metrics.totalPatientsToday,
      icon: <PeopleIcon sx={{ fontSize: 22, color: '#1E40AF' }} />,
      bgColor: '#EFF6FF',
      description: 'Active cases today',
    },
    {
      title: 'Appointments Today',
      value: metrics.appointmentsTodayCount,
      icon: <CalendarMonthIcon sx={{ fontSize: 22, color: '#2563EB' }} />,
      bgColor: '#EEF2FF',
      description: 'Scheduled slots',
    },
    {
      title: 'Completed Treatments',
      value: metrics.completedTreatmentsCount,
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 22, color: colors.success }} />,
      bgColor: '#ECFDF5',
      description: 'Concluded procedures',
    },
    {
      title: 'Pending Collections',
      value: formatCurrency(metrics.totalPendingPayments),
      icon: <HourglassEmptyIcon sx={{ fontSize: 22, color: colors.error }} />,
      bgColor: '#FEF2F2',
      description: 'Outstanding balance',
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(metrics.revenueToday),
      icon: <PaymentsIcon sx={{ fontSize: 22, color: '#0D9488' }} />,
      bgColor: '#F0FDFA',
      description: 'Collected today',
    },
  ];

  const procedureStats = useMemo(() => PROCEDURE_TYPES.map((proc) => {
    const count = todayAppts.filter((a) => a.type === proc).length;
    const percent = todayAppts.length > 0 ? (count / todayAppts.length) * 100 : 0;
    return { proc, count, percent };
  }).filter((s) => s.count > 0), [todayAppts]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          Clinical Operations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Daily overview of appointments, treatments, and billing metrics.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {metricCards.map((card) => (
          <Grid item xs={12} sm={6} md={2.4} key={card.title}>
            <MetricCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ p: '16px 20px !important' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: colors.textPrimary }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/patients', { state: { openRegister: true } })}
            >
              Register Patient
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditCalendarIcon />}
              onClick={() => navigate('/appointments', { state: { openSchedule: true } })}
            >
              Book Appointment
            </Button>
            <Button
              variant="outlined"
              startIcon={<LocalHospitalIcon />}
              onClick={() => navigate('/treatments')}
              sx={{ color: '#0D9488', borderColor: '#0D9488', '&:hover': { borderColor: '#0B7A6F', bgcolor: 'rgba(13, 148, 136, 0.04)' } }}
            >
              Record Treatment
            </Button>
            <Button
              variant="outlined"
              startIcon={<PaymentIcon />}
              onClick={() => navigate('/billing')}
              sx={{ color: '#D97706', borderColor: '#D97706', '&:hover': { borderColor: '#B45309', bgcolor: 'rgba(217, 119, 6, 0.04)' } }}
            >
              View Billing
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <TableContainer component={Paper} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}` }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>Today's Schedule</Typography>
                <Typography variant="caption" color="text.secondary">Appointments scheduled for today</Typography>
              </Box>
              <Chip
                label={`${todayAppts.length} appointment${todayAppts.length !== 1 ? 's' : ''}`}
                color="info"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {todayAppts.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <CalendarMonthIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No appointments scheduled for today.</Typography>
              </Box>
            ) : (
              <Table sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Dentist</TableCell>
                    <TableCell>Procedure</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayAppts.map((appt) => (
                    <TableRow key={appt.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{appt.time}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: colors.primary, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => navigate(`/patients/${appt.patientId}`)}
                        >
                          {appt.patientName}
                        </Typography>
                      </TableCell>
                      <TableCell>{appt.dentistName}</TableCell>
                      <TableCell>
                        <Chip label={appt.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StatusBadge status={appt.status} />
                          <Tooltip title="Change status">
                            <IconButton size="small" onClick={(e) => handleOpenMenu(e, appt.id)}>
                              <MoreVertIcon sx={{ fontSize: 16 }} />
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
                          sx={{ textTransform: 'none', color: colors.primary, fontWeight: 600 }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${colors.border}` }}>
              <Typography variant="subtitle2" fontWeight={700}>Today's Procedure Mix</Typography>
              <Typography variant="caption" color="text.secondary">Breakdown by type</Typography>
            </Box>
            <CardContent sx={{ py: 3 }}>
              {procedureStats.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  No appointments today yet.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {procedureStats.map(({ proc, count, percent }) => (
                    <Box key={proc}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>{proc}</Typography>
                        <Typography variant="body2" color="text.secondary">{count} ({Math.round(percent)}%)</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{ height: 6, borderRadius: 999, bgcolor: colors.borderLight }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{ sx: { minWidth: 150, borderRadius: '8px' } }}
      >
        {APPOINTMENT_STATUSES.map((s) => (
          <MenuItem key={s} onClick={() => handleStatusChange(s)} sx={{ fontSize: '0.875rem' }}>
            {s}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default Dashboard;
