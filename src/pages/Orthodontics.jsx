import { useMemo } from 'react';
import {
  Avatar,
  Box,
  Card,
  Grid,
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
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export default function Orthodontics() {
  const { patients, treatments, dentists } = useClinicData();

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
    { label: 'Patients', value: stats.patients, icon: <PeopleIcon />, bg: '#EEF2FF', color: colors.primary },
    { label: 'Cases / Treatments', value: stats.cases, icon: <ListIcon />, bg: '#F0FDF4', color: '#0D9488' },
    { label: 'Total Fees', value: formatCurrency(stats.fees), icon: <MoneyIcon />, bg: '#FFF7ED', color: '#D97706' },
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

      {!ortho ? (
        <Card sx={{ borderRadius: '12px', p: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            No orthodontist found. Add <strong>Dr. Babar</strong> (role: Dentist) on the Staff page, then log treatments for him.
          </Typography>
        </Card>
      ) : (
        <>
          <Grid container spacing={2}>
            {kpis.map((kpi) => (
              <Grid item xs={12} sm={4} key={kpi.label}>
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

          <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>{ortho.name}&apos;s Cases</Typography>
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
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>No cases yet</Typography>
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
