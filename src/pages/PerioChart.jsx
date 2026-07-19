import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Straighten as DepthIcon,
  WarningAmber as DeepIcon,
  Bloodtype as BleedIcon,
  GridOn as ChartedIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { UPPER_ARCH, LOWER_ARCH } from '../utils/dentalChart';
import { colors } from '../theme/theme';

const SITES = ['MB', 'B', 'DB', 'ML', 'L', 'DL'];

const depthColor = (d) => {
  if (!d || d <= 0) return colors.borderLight;
  if (d >= 6) return '#EF4444';
  if (d >= 4) return '#F59E0B';
  return '#10B981';
};

function ToothCell({ number, record, onClick }) {
  const depths = record?.depths || [];
  const deepest = depths.length ? Math.max(...depths.map((n) => Number(n) || 0)) : 0;
  return (
    <Box
      onClick={onClick}
      sx={{
        width: 46, flexShrink: 0, cursor: 'pointer', textAlign: 'center', p: 0.5, borderRadius: '8px',
        border: `1px solid ${record ? depthColor(deepest) : colors.border}`,
        bgcolor: record ? `${depthColor(deepest)}12` : colors.surface,
        transition: 'all .12s ease', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
      }}
    >
      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: colors.textSecondary }}>{number}</Typography>
      <Box sx={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: record ? depthColor(deepest) : colors.textLight }}>
          {record ? deepest : '·'}
        </Typography>
      </Box>
      {record?.bop && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#EF4444', mx: 'auto' }} />}
    </Box>
  );
}

export default function PerioChart() {
  const { patients, perioCharts, updatePerioTooth } = useClinicData();
  const { notify } = useNotification();

  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const chart = useMemo(() => perioCharts[patientId] || {}, [perioCharts, patientId]);

  const [editTooth, setEditTooth] = useState(null);
  const [editDepths, setEditDepths] = useState(['', '', '', '', '', '']);
  const [editBop, setEditBop] = useState(false);

  const summary = useMemo(() => {
    const entries = Object.values(chart);
    let deepest = 0, deepSites = 0, bopTeeth = 0;
    entries.forEach((rec) => {
      (rec.depths || []).forEach((d) => { const v = Number(d) || 0; if (v > deepest) deepest = v; if (v >= 4) deepSites += 1; });
      if (rec.bop) bopTeeth += 1;
    });
    return { deepest, deepSites, bopTeeth, charted: entries.length };
  }, [chart]);

  const openEditor = (num) => {
    const rec = chart[num];
    setEditTooth(num);
    setEditDepths(rec?.depths?.length ? rec.depths.map((d) => String(d)) : ['', '', '', '', '', '']);
    setEditBop(Boolean(rec?.bop));
  };

  const setDepth = (i, val) => {
    const clean = val === '' ? '' : Math.max(0, Math.min(12, Number(val) || 0));
    setEditDepths((prev) => prev.map((d, idx) => (idx === i ? clean : d)));
  };

  const saveTooth = () => {
    const depths = editDepths.map((d) => Number(d) || 0);
    updatePerioTooth(patientId, editTooth, { depths, bop: editBop });
    notify(`Perio recorded for tooth ${editTooth}.`, 'success');
    setEditTooth(null);
  };

  const statCards = [
    { label: 'Deepest Pocket', value: summary.deepest ? `${summary.deepest} mm` : '-', icon: <DepthIcon />,   bg: '#EEF2FF', color: colors.primary },
    { label: 'Sites ≥4mm',     value: summary.deepSites,                                  icon: <DeepIcon />,    bg: '#FFFBEB', color: '#D97706' },
    { label: 'BOP Teeth',      value: summary.bopTeeth,                                   icon: <BleedIcon />,   bg: '#FEF2F2', color: colors.error },
    { label: 'Charted Teeth',  value: summary.charted,                                    icon: <ChartedIcon />, bg: '#ECFDF5', color: colors.success },
  ];

  const patient = patients.find((p) => p.id === patientId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Periodontal Chart</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Record 6-site pocket depths and bleeding on probing per tooth.</Typography>
        </Box>
        <TextField select size="small" label="Patient" value={patientId} onChange={(e) => setPatientId(e.target.value)} sx={{ minWidth: 220 }}>
          {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2}>
        {statCards.map((card) => (
          <Grid item xs={6} md={3} key={card.label}>
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>{card.label}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: colors.textPrimary, letterSpacing: '-0.02em', mt: 0.25 }}>{card.value}</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: card.bg, color: card.color, display: 'flex', fontSize: 22 }}>{card.icon}</Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Chart */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>{patient?.name || 'Select a patient'}</Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>Click a tooth to record its measurements</Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            {[['≤3 mm', '#10B981'], ['4–5 mm', '#F59E0B'], ['≥6 mm', '#EF4444']].map(([label, c]) => (
              <Box key={label} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: c }} />
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: colors.textSecondary }}>{label}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
        <Box sx={{ p: 2.5, overflowX: 'auto' }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.textSecondary, textAlign: 'center', letterSpacing: '0.06em', mb: 1 }}>UPPER ARCH</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, minWidth: 'fit-content', mb: 2 }}>
            {UPPER_ARCH.map((num) => <ToothCell key={num} number={num} record={chart[num]} onClick={() => openEditor(num)} />)}
          </Box>
          <Box sx={{ height: 1, bgcolor: colors.borderLight, my: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, minWidth: 'fit-content' }}>
            {LOWER_ARCH.map((num) => <ToothCell key={num} number={num} record={chart[num]} onClick={() => openEditor(num)} />)}
          </Box>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.textSecondary, textAlign: 'center', letterSpacing: '0.06em', mt: 1 }}>LOWER ARCH</Typography>
        </Box>
      </Card>

      {/* Editor dialog */}
      <Dialog open={editTooth !== null} onClose={() => setEditTooth(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Tooth #{editTooth} - Pocket Depths</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buccal</Typography>
          <Stack direction="row" spacing={1.5} sx={{ mt: 1, mb: 2 }}>
            {[0, 1, 2].map((i) => (
              <Box key={i} sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: colors.textLight, mb: 0.5 }}>{SITES[i]}</Typography>
                <TextField type="number" size="small" value={editDepths[i]} onChange={(e) => setDepth(i, e.target.value)} fullWidth inputProps={{ min: 0, max: 12, style: { textAlign: 'center', fontWeight: 700, color: depthColor(Number(editDepths[i])) } }} />
              </Box>
            ))}
          </Stack>
          <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lingual</Typography>
          <Stack direction="row" spacing={1.5} sx={{ mt: 1, mb: 2 }}>
            {[3, 4, 5].map((i) => (
              <Box key={i} sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: colors.textLight, mb: 0.5 }}>{SITES[i]}</Typography>
                <TextField type="number" size="small" value={editDepths[i]} onChange={(e) => setDepth(i, e.target.value)} fullWidth inputProps={{ min: 0, max: 12, style: { textAlign: 'center', fontWeight: 700, color: depthColor(Number(editDepths[i])) } }} />
              </Box>
            ))}
          </Stack>
          <Box onClick={() => setEditBop((b) => !b)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, cursor: 'pointer', userSelect: 'none', mt: 0.5 }}>
            <Box sx={{ width: 18, height: 18, borderRadius: '5px', border: `1.5px solid ${editBop ? '#EF4444' : colors.inputBorder || colors.border}`, bgcolor: editBop ? '#EF4444' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {editBop && <BleedIcon sx={{ fontSize: 13, color: '#fff' }} />}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Bleeding on probing (BOP)</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
          <Button onClick={() => setEditTooth(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={saveTooth} variant="contained" sx={{ fontWeight: 700 }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
