import { useMemo } from 'react';
import {
  Avatar,
  Box,
  Card,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Straighten as BracesIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  ListAlt as ListIcon,
  EventBusy as DebondDueIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate } from '../utils/helpers';
import { orthoCaseProgress, ORTHO_PHASE } from '../utils/orthoCase';
import { colors } from '../theme/theme';

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export default function Orthodontics() {
  const { patients, treatments, dentists, treatmentPlans } = useClinicData();

  // Real ortho cases: treatment plans filed under the Ortho category, each
  // carrying its banding and expected debond dates. Everything shown about a
  // case - months of treatment, how far through it is, whether it is overdue
  // for debonding - derives from that span.
  const orthoCases = useMemo(() => (treatmentPlans || [])
    .filter((p) => p.category === 'Ortho')
    .map((plan) => ({
      plan,
      progress: orthoCaseProgress(
        { bandingDate: plan.bandingDate, debondDate: plan.debondDate },
        undefined,
        plan.status === 'Completed',
      ),
      value: plan.items.reduce((sum, it) => sum + Number(it.cost || 0), 0),
    })), [treatmentPlans]);

  const caseStats = useMemo(() => ({
    active: orthoCases.filter((c) => c.progress?.phase === ORTHO_PHASE.ACTIVE).length,
    dueForDebond: orthoCases.filter((c) => c.progress?.overdueForDebond).length,
    value: orthoCases.reduce((sum, c) => sum + c.value, 0),
  }), [orthoCases]);

  // The orthodontist: Dr. Babar (fall back to any dentist whose specialty
  // mentions orthodontics, so the page still works if the name changes).
  const ortho = useMemo(
    () => dentists.find((d) => /babar/i.test(d.name)) || dentists.find((d) => /ortho|brace/i.test(d.specialty || '')),
    [dentists],
  );

  const orthoTreatments = useMemo(() => {
    if (!ortho) return [];
    return treatments.filter((t) => t.dentistId === ortho.id || t.dentistName === ortho.name);
  }, [treatments, ortho]);

  // Everyone under orthodontic care: case patients and anyone with a treatment
  // logged against the orthodontist, counted once.
  const orthoPatientCount = useMemo(() => {
    const ids = new Set(orthoCases.map((c) => c.plan.patientId));
    orthoTreatments.forEach((t) => ids.add(t.patientId));
    return ids.size;
  }, [orthoCases, orthoTreatments]);

  const patientById = useMemo(() => {
    const m = {};
    patients.forEach((p) => { m[p.id] = p; });
    return m;
  }, [patients]);

  const stats = useMemo(() => {
    const patientIds = new Set(orthoTreatments.map((t) => t.patientId));
    const fees = orthoTreatments.reduce((sum, t) => sum + Number(t.cost || 0), 0);
    return { patients: patientIds.size, cases: orthoTreatments.length, fees };
  }, [orthoTreatments]);

  const kpis = [
    { label: 'Cases In Treatment', value: caseStats.active, icon: <BracesIcon />, bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Due For Debond', value: caseStats.dueForDebond, icon: <DebondDueIcon />, bg: caseStats.dueForDebond > 0 ? '#FEF2F2' : '#F1F5F9', color: caseStats.dueForDebond > 0 ? colors.error : '#64748B' },
    { label: 'Patients', value: orthoPatientCount, icon: <PeopleIcon />, bg: '#EEF2FF', color: colors.primary },
    { label: 'Treatments Logged', value: stats.cases, icon: <ListIcon />, bg: '#F0FDF4', color: '#0D9488' },
    { label: 'Total Fees', value: formatCurrency(stats.fees + caseStats.value), icon: <MoneyIcon />, bg: '#FFF7ED', color: '#D97706' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 1.25, borderRadius: '12px', bgcolor: '#F5F3FF', color: '#7C3AED', display: 'flex' }}>
          <BracesIcon />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>
            Orthodontics{ortho ? ` — ${ortho.name}` : ''}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>
            Braces &amp; orthodontic cases, their treatments, and fees.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid item xs={6} sm={4} md={2.4} key={kpi.label}>
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>{kpi.label}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: colors.textPrimary, letterSpacing: '-0.02em', mt: 0.25 }}>{kpi.value}</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: kpi.bg, color: kpi.color, display: 'flex', fontSize: 22 }}>{kpi.icon}</Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Real ortho cases - the plans filed under the Ortho category. */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Ortho Cases</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>
            {orthoCases.length === 0
              ? 'Create a treatment plan with the Ortho category to open a case.'
              : `${orthoCases.length} case${orthoCases.length !== 1 ? 's' : ''} · banding to debond`}
          </Typography>
        </Box>
        {orthoCases.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Banded</TableCell>
                  <TableCell>Expected debond</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell align="right">Case fee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orthoCases.map(({ plan, progress, value }) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(plan.patientName) }}>
                          {plan.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem', color: colors.primary }}>{plan.patientName}</Typography>
                          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{plan.title}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{plan.bandingDate ? formatDate(plan.bandingDate) : '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: progress?.overdueForDebond ? colors.error : 'inherit', fontWeight: progress?.overdueForDebond ? 700 : 400 }}>{plan.debondDate ? formatDate(plan.debondDate) : '—'}</Typography></TableCell>
                    <TableCell sx={{ minWidth: 170 }}>
                      {progress ? (
                        <>
                          <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                            month {progress.elapsedMonths} of {progress.totalMonths} · {progress.visitsSoFar}/{progress.expectedVisits} visits
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={progress.percent}
                            sx={{ mt: 0.5, height: 5, borderRadius: 999, bgcolor: colors.borderLight, '& .MuiLinearProgress-bar': { bgcolor: progress.overdueForDebond ? colors.error : progress.phase === ORTHO_PHASE.DONE ? colors.success : '#7C3AED' } }}
                          />
                        </>
                      ) : (
                        <Typography variant="caption" sx={{ color: colors.textLight }}>Dates not set</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: progress?.overdueForDebond ? '#FEF2F2' : '#F5F3FF' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: progress?.overdueForDebond ? colors.error : '#7C3AED' }}>
                          {progress?.phase || plan.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right"><Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0D9488' }}>{formatCurrency(value)}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {!ortho ? (
        <Card sx={{ borderRadius: '12px', p: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            No orthodontist found. Add <strong>Dr. Babar</strong> (role: Dentist) on the Staff page to see chairside treatments logged for him here.
          </Typography>
        </Card>
      ) : (
        <>
          <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>Treatments logged for {ortho.name}</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>{orthoTreatments.length} treatment{orthoTreatments.length !== 1 ? 's' : ''} recorded</Typography>
              </Box>
              <Box sx={{ display: 'inline-flex', px: '10px', py: '4px', borderRadius: '8px', bgcolor: colors.successBg }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.success }}>Total: {formatCurrency(stats.fees)}</Typography>
              </Box>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Treatment Type</TableCell>
                    <TableCell>Teeth</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Fee</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orthoTreatments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                        <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                          <BracesIcon sx={{ fontSize: 24, color: colors.textLight }} />
                        </Box>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>No treatments logged</Typography>
                        <Typography variant="caption" sx={{ color: colors.textSecondary }}>Log a treatment on the Treatments page and choose {ortho.name} as the dentist.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orthoTreatments.map((t) => {
                      const p = patientById[t.patientId];
                      return (
                        <TableRow key={t.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                              <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(t.patientName) }}>
                                {t.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem', color: colors.primary }}>{t.patientName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{p?.phone || '-'}</Typography></TableCell>
                          <TableCell>
                            <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: '#F5F3FF' }}>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#7C3AED' }}>{t.type}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.toothNumber === 'All' ? 'All' : t.toothNumber}</Typography></TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(t.date)}</Typography></TableCell>
                          <TableCell align="right"><Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0D9488' }}>{formatCurrency(t.cost)}</Typography></TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </>
      )}
    </Box>
  );
}
