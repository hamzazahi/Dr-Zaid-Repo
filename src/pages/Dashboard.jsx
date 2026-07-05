import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, Chip, Grid, IconButton,
  Menu, MenuItem, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import {
  People as PeopleIcon,
  CalendarMonth as CalIcon,
  Payments as RevenueIcon,
  HourglassEmpty as PendingIcon,
  MoreVert as MoreIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  Add as AddIcon,
  EditCalendar as BookIcon,
  Warning as WarnIcon,
  CheckCircleOutline as DoneIcon,
  AccessTime as ClockIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useClinicData } from '../hooks/useClinicData';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency } from '../utils/helpers';
import { APPOINTMENT_STATUSES } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import { colors } from '../theme/theme';

// ─── constants ───────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const AV_COLORS = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0D9488','#DB2777'];
const avatarBg = (name) => AV_COLORS[(name?.charCodeAt(0) || 0) % AV_COLORS.length];

const PROC_CFG = {
  'Root Canal':    '#7C3AED',
  Crown:           '#D97706',
  Scaling:         '#0D9488',
  Filling:         '#2563EB',
  Extraction:      '#DC2626',
  Consultation:    '#64748B',
  Whitening:       '#CA8A04',
  Braces:          '#0369A1',
  Implant:         '#7E22CE',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Spark({ data, color }) {
  const gid = `sg${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.35}/>
            <stop offset="100%" stopColor={color} stopOpacity={0.02}/>
          </linearGradient>
        </defs>
        <Area
          type="monotone" dataKey="v"
          stroke={color} strokeWidth={2.5}
          fill={`url(#${gid})`}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accentColor, spark, trend, trendUp, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: '14px',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.18s, transform 0.18s',
        '&:hover': onClick ? { boxShadow: '0 6px 20px rgba(0,0,0,0.09)', transform: 'translateY(-2px)' } : {},
        position: 'relative',
      }}
    >
      {/* accent stripe */}
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)` }} />

      <Box sx={{ px: '20px', pt: '16px', pb: '12px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.25 }}>
          <Box>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: colors.textLight, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {value}
            </Typography>
            {sub && (
              <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, mt: 0.4 }}>{sub}</Typography>
            )}
          </Box>
          <Box sx={{
            p: 1.1, borderRadius: '10px',
            bgcolor: `${accentColor}18`,
            border: `1px solid ${accentColor}22`,
            color: accentColor, display: 'flex', fontSize: 20,
            flexShrink: 0,
          }}>
            {icon}
          </Box>
        </Box>

        {/* Sparkline */}
        <Spark data={spark} color={accentColor} />

        {/* Trend */}
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {trendUp !== false
              ? <TrendUpIcon sx={{ fontSize: 13, color: colors.success }} />
              : <TrendDownIcon sx={{ fontSize: 13, color: colors.error }} />}
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: trendUp !== false ? colors.success : colors.error }}>
              {trend}% vs last week
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}

// ─── Today Focus card ─────────────────────────────────────────────────────────
function FocusCard({ icon, label, value, color, bg, cta, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 2, py: 1.5,
        borderRadius: '10px',
        bgcolor: bg,
        border: `1px solid ${color}28`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s',
        '&:hover': onClick ? { filter: 'brightness(0.97)', transform: 'translateY(-1px)' } : {},
      }}
    >
      <Box sx={{ color, display: 'flex', fontSize: 20, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: '0.68rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: colors.textPrimary, mt: 0.2 }}>{value}</Typography>
      </Box>
      {cta && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700 }}>{cta}</Typography>
          <ArrowIcon sx={{ fontSize: 13 }} />
        </Box>
      )}
    </Box>
  );
}

// ─── Custom recharts tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      bgcolor: '#fff', border: `1px solid ${colors.border}`, borderRadius: '10px',
      px: 1.5, py: 1.1, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    }}>
      <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, mb: 0.35 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: colors.textPrimary }}>
        {prefix}{typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value}{suffix}
      </Typography>
    </Box>
  );
}

// ─── Procedure type pill ──────────────────────────────────────────────────────
function TypePill({ type }) {
  const c = PROC_CFG[type] || '#64748B';
  return (
    <Box sx={{ display: 'inline-flex', px: '7px', py: '2px', borderRadius: '5px', bgcolor: `${c}15` }}>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: c }}>{type}</Typography>
    </Box>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHead({ title, sub, action }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: colors.textPrimary }}>{title}</Typography>
        {sub && <Typography sx={{ fontSize: '0.72rem', color: colors.textSecondary, mt: '2px' }}>{sub}</Typography>}
      </Box>
      {action}
    </Box>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { getTodayAppointments, getTodayMetrics, updateAppointmentStatus, appointments, payments, patients, invoices, treatments } = useClinicData();
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  // Greet by first name ("Dr. Hamza Zahid" → "Dr. Hamza"); fall back gracefully.
  const firstName = user?.name ? user.name.split(' ').slice(0, 2).join(' ') : 'Doctor';

  const todayAppts = useMemo(() => getTodayAppointments(), [getTodayAppointments]);
  const metrics    = useMemo(() => getTodayMetrics(),       [getTodayMetrics]);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuApptId, setMenuApptId] = useState(null);

  const openMenu  = (e, id) => { setMenuAnchor(e.currentTarget); setMenuApptId(id); };
  const closeMenu = () => { setMenuAnchor(null); setMenuApptId(null); };
  const changeStatus = (s) => {
    if (menuApptId) { updateAppointmentStatus(menuApptId, s); notify(`Status → "${s}"`, 'success'); }
    closeMenu();
  };

  // ── Data derivations ────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];

  const overdueInvoices = useMemo(() =>
    invoices.filter((inv) => inv.balanceDue > 0 && new Date(inv.dueDate) < new Date()),
    [invoices]
  );

  const pendingAppts = useMemo(() =>
    todayAppts.filter((a) => a.status === 'Scheduled' || a.status === 'Pending'),
    [todayAppts]
  );

  const completedToday = useMemo(() =>
    treatments.filter((t) => t.date === todayStr).length,
    [treatments, todayStr]
  );

  // 6-month revenue trend
  const revTrend = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { month: MONTHS[d.getMonth()], revenue: 0, y: d.getFullYear(), m: d.getMonth() };
    });
    payments.forEach((p) => {
      const d = new Date(p.date);
      const b = buckets.find((bk) => bk.m === d.getMonth() && bk.y === d.getFullYear());
      if (b) b.revenue += Number(p.amount || 0);
    });
    return buckets;
  }, [payments]);

  // Procedure distribution (pie)
  const procDist = useMemo(() => {
    const counts = {};
    appointments.forEach((a) => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [appointments]);

  // 6-month appointment count
  const apptTrend = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { month: MONTHS[d.getMonth()], count: 0, y: d.getFullYear(), m: d.getMonth() };
    });
    appointments.forEach((a) => {
      const d = new Date(a.date);
      const b = buckets.find((bk) => bk.m === d.getMonth() && bk.y === d.getFullYear());
      if (b) b.count += 1;
    });
    return buckets;
  }, [appointments]);

  // sparkline generator — uses different phase offsets so each card looks unique
  const spark = (base, v = 0.3, phase = 0) =>
    Array.from({ length: 9 }, (_, i) => ({
      v: Math.max(1, Math.round(base * (0.7 + 0.3 * Math.abs(Math.sin((i + phase) * 0.75)) + v * Math.sin((i + phase) * 1.4))))
    }));

  // ── KPI cards config ────────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Total Patients',
      value: patients.length.toLocaleString(),
      sub: `${patients.filter(p => p.status === 'Active').length} active`,
      accentColor: '#2563EB', icon: <PeopleIcon fontSize="inherit"/>,
      spark: spark(patients.length, 0.12, 0), trend: 12, trendUp: true,
      onClick: () => navigate('/patients'),
    },
    {
      label: "Today's Appointments",
      value: metrics.appointmentsTodayCount,
      sub: `${pendingAppts.length} still pending`,
      accentColor: '#7C3AED', icon: <CalIcon fontSize="inherit"/>,
      spark: spark(metrics.appointmentsTodayCount || 4, 0.4, 2), trend: 8, trendUp: true,
      onClick: () => navigate('/appointments'),
    },
    {
      label: "Revenue Today",
      value: formatCurrency(metrics.revenueToday),
      sub: 'collected payments',
      accentColor: '#059669', icon: <RevenueIcon fontSize="inherit"/>,
      spark: spark(metrics.revenueToday || 8000, 0.25, 4), trend: 5, trendUp: true,
      onClick: () => navigate('/payments'),
    },
    {
      label: 'Pending Collections',
      value: formatCurrency(metrics.totalPendingPayments),
      sub: `${overdueInvoices.length} overdue invoices`,
      accentColor: '#D97706', icon: <PendingIcon fontSize="inherit"/>,
      spark: spark(metrics.totalPendingPayments || 50000, 0.18, 6), trend: 3, trendUp: false,
      onClick: () => navigate('/billing'),
    },
  ];

  // ── Pie chart colours ───────────────────────────────────────────────────────
  const PIE_COLORS = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0D9488'];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ══ Header row ══ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: colors.textPrimary, letterSpacing: '-0.025em' }}>
            {greeting()}, {firstName} 👋
          </Typography>
          <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem', mt: 0.25 }}>
            Here's what needs your attention today.
          </Typography>
        </Box>
        <Stack direction="row" gap={1.25} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<BookIcon sx={{ fontSize: 16 }}/>}
            onClick={() => navigate('/appointments', { state: { openSchedule: true } })}
            sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', borderColor: colors.border, color: colors.textPrimary, '&:hover': { borderColor: colors.primary, color: colors.primary } }}
          >
            Book Appointment
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 16 }}/>}
            onClick={() => navigate('/patients', { state: { openRegister: true } })}
            sx={{ borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', boxShadow: '0 2px 8px rgba(15,76,129,0.25)' }}
          >
            New Patient
          </Button>
        </Stack>
      </Box>

      {/* ══ TODAY FOCUS STRIP ══ */}
      <Box sx={{
        p: '14px 18px',
        borderRadius: '12px',
        bgcolor: '#fff',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <ClockIcon sx={{ fontSize: 14, color: colors.textLight }} />
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: colors.textLight, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Today's Focus
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <FocusCard
            icon={<WarnIcon fontSize="inherit"/>}
            label="Overdue Payments"
            value={overdueInvoices.length > 0 ? `${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? 's' : ''} overdue` : 'All clear'}
            color={overdueInvoices.length > 0 ? '#DC2626' : '#059669'}
            bg={overdueInvoices.length > 0 ? '#FFF5F5' : '#F0FDF4'}
            cta={overdueInvoices.length > 0 ? 'Review' : null}
            onClick={() => navigate('/billing')}
          />
          <FocusCard
            icon={<CalIcon fontSize="inherit"/>}
            label="Pending Appointments"
            value={pendingAppts.length > 0 ? `${pendingAppts.length} not yet started` : 'Schedule clear'}
            color={pendingAppts.length > 0 ? '#7C3AED' : '#059669'}
            bg={pendingAppts.length > 0 ? '#FAF5FF' : '#F0FDF4'}
            cta={pendingAppts.length > 0 ? 'View' : null}
            onClick={() => navigate('/appointments')}
          />
          <FocusCard
            icon={<DoneIcon fontSize="inherit"/>}
            label="Completed Today"
            value={`${completedToday} treatment${completedToday !== 1 ? 's' : ''} done`}
            color="#059669"
            bg="#F0FDF4"
            cta="Details"
            onClick={() => navigate('/treatments')}
          />
        </Box>
      </Box>

      {/* ══ KPI cards ══ */}
      <Grid container spacing={2}>
        {kpis.map((k) => (
          <Grid item xs={12} sm={6} xl={3} key={k.label}>
            <KpiCard {...k}/>
          </Grid>
        ))}
      </Grid>

      {/* ══ Charts row ══ */}
      <Grid container spacing={2}>

        {/* Revenue trend */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: '14px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', p: '20px 24px' }}>
            <SectionHead
              title="Revenue Trend"
              sub="6-month collection history"
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: '6px', bgcolor: '#F0FDF4' }}>
                  <TrendUpIcon sx={{ fontSize: 14, color: colors.success }}/>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: colors.success }}>Growing</Typography>
                </Box>
              }
            />
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={revTrend} margin={{ top: 5, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F4C81" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#0F4C81" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} vertical={false}/>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: colors.textLight }} axisLine={false} tickLine={false}/>
                <YAxis
                  tick={{ fontSize: 11, fill: colors.textLight }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} width={36}
                  domain={[0, (dataMax) => Math.ceil((dataMax * 1.25) / 5000) * 5000]}
                />
                <RTooltip content={<ChartTooltip prefix="Rs. "/>}/>
                <Area type="monotoneX" dataKey="revenue" stroke={colors.primary} strokeWidth={2.5} fill="url(#revG)" dot={{ r: 3, fill: colors.primary, strokeWidth: 0 }} activeDot={{ r: 5, fill: colors.primary, strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false}/>
              </AreaChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${colors.borderLight}`, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {[
                { label: '6-Month Total', val: formatCurrency(revTrend.reduce((s, r) => s + r.revenue, 0)) },
                { label: 'Peak Month',    val: revTrend.reduce((max, r) => r.revenue > max.revenue ? r : max, revTrend[0])?.month || '—' },
                { label: 'Avg / Month',   val: formatCurrency(Math.round(revTrend.reduce((s, r) => s + r.revenue, 0) / 6)) },
              ].map(({ label, val }) => (
                <Box key={label}>
                  <Typography sx={{ fontSize: '0.65rem', color: colors.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: colors.textPrimary }}>{val}</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Procedure mix — donut */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: '14px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', p: '20px 24px', height: '100%' }}>
            <SectionHead title="Procedure Mix" sub="All-time distribution"/>
            {procDist.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.82rem' }}>No data yet</Typography>
              </Box>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={procDist} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={72}
                      paddingAngle={2} dataKey="value"
                      isAnimationActive={false}
                    >
                      {procDist.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                      ))}
                    </Pie>
                    <RTooltip content={<ChartTooltip suffix=" appts"/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
                  {procDist.slice(0, 4).map((p, i) => (
                    <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }}/>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, flex: 1 }}>{p.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textPrimary }}>{p.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ══ Appointments + Volume ══ */}
      <Grid container spacing={2}>

        {/* Today's schedule */}
        <Grid item xs={12} xl={8}>
          <Card sx={{ borderRadius: '14px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, pt: 2.5, pb: 0 }}>
              <SectionHead
                title="Today's Schedule"
                sub={`${todayAppts.length} appointment${todayAppts.length !== 1 ? 's' : ''} scheduled`}
                action={
                  <Button
                    size="small"
                    endIcon={<ArrowIcon sx={{ fontSize: 14 }}/>}
                    onClick={() => navigate('/appointments')}
                    sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.primary, px: 1 }}
                  >
                    View all
                  </Button>
                }
              />
            </Box>

            {todayAppts.length === 0 ? (
              <Box sx={{ py: 7, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '2rem', mb: 1 }}>📅</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.25 }}>No appointments today</Typography>
                <Typography sx={{ fontSize: '0.78rem', color: colors.textSecondary }}>Schedule is clear — enjoy the quiet.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 620 }}>
                  <TableHead>
                    <TableRow sx={{ '& .MuiTableCell-root': {
                      bgcolor: '#FAFBFC', py: '9px', px: '16px',
                      fontSize: '0.68rem', fontWeight: 700, color: colors.textLight,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: `1px solid ${colors.border}`,
                    }}}>
                      <TableCell>Time</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Dentist</TableCell>
                      <TableCell>Procedure</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right"/>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todayAppts.map((appt) => {
                      const bg = avatarBg(appt.patientName);
                      return (
                        <TableRow
                          key={appt.id}
                          sx={{
                            '& .MuiTableCell-root': { py: '11px', px: '16px', borderBottom: `1px solid ${colors.borderLight}` },
                            '&:hover': { bgcolor: '#F8FAFF' },
                            '&:last-child .MuiTableCell-root': { borderBottom: 'none' },
                          }}
                        >
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace', color: colors.textPrimary }}>
                              {appt.time}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" gap={1.25}>
                              <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#fff' }}>
                                  {appt.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                </Typography>
                              </Box>
                              <Typography
                                sx={{ fontWeight: 600, fontSize: '0.83rem', color: colors.primary, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                onClick={() => navigate(`/patients/${appt.patientId}`)}
                              >
                                {appt.patientName}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>{appt.dentistName}</Typography>
                          </TableCell>
                          <TableCell>
                            <TypePill type={appt.type}/>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" gap={0.25}>
                              <StatusBadge status={appt.status}/>
                              <Tooltip title="Change status">
                                <IconButton size="small" onClick={(e) => openMenu(e, appt.id)} sx={{ color: colors.textLight }}>
                                  <MoreIcon sx={{ fontSize: 15 }}/>
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => navigate(`/patients/${appt.patientId}`)}
                              sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.primary, minWidth: 0, px: 1 }}
                            >
                              View →
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Monthly volume bar */}
        <Grid item xs={12} xl={4}>
          <Card sx={{ borderRadius: '14px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', p: '20px 24px', height: '100%' }}>
            <SectionHead
              title="Monthly Volume"
              sub="Appointments per month"
              action={
                <Chip
                  label={`${appointments.length} total`}
                  size="small"
                  sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: '#EFF6FF', color: '#1D4ED8', border: 'none' }}
                />
              }
            />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={apptTrend} margin={{ top: 5, right: 4, bottom: 0, left: -10 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} vertical={false}/>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: colors.textLight }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: colors.textLight }} axisLine={false} tickLine={false}/>
                <RTooltip content={<ChartTooltip suffix=" appts"/>}/>
                <Bar dataKey="count" fill="#EFF6FF" stroke="#2563EB" strokeWidth={1.5} radius={[4, 4, 0, 0]} isAnimationActive={false}/>
              </BarChart>
            </ResponsiveContainer>
            {/* Insight line */}
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${colors.borderLight}` }}>
              <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, lineHeight: 1.5 }}>
                <strong style={{ color: colors.textPrimary }}>
                  {apptTrend.reduce((max, b) => b.count > max.count ? b : max, apptTrend[0])?.month}
                </strong>
                {' '}was the busiest month — {apptTrend.reduce((max, b) => b.count > max.count ? b : max, apptTrend[0])?.count} appointments.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Status change menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        PaperProps={{ sx: { minWidth: 165, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
      >
        <Box sx={{ px: 1.5, py: 1, borderBottom: `1px solid ${colors.borderLight}` }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: colors.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Set Status</Typography>
        </Box>
        {APPOINTMENT_STATUSES.map((s) => (
          <MenuItem key={s} onClick={() => changeStatus(s)} sx={{ fontSize: '0.83rem', py: 0.9 }}>
            {s}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
