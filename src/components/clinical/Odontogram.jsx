import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { useClinicData } from '../../hooks/useClinicData';
import { useNotification } from '../../hooks/useNotification';
import { colors } from '../../theme/theme';
import {
  SURFACES,
  SURFACE_LABELS,
  TOOTH_STATUSES,
  LEGEND,
  UPPER_ARCH,
  LOWER_ARCH,
  ALL_TEETH,
  DEFAULT_STATUS,
  statusColor,
  statusLabel,
  isSurfaceStatus,
  isWholeToothStatus,
  resolveToothRecord,
} from '../../utils/dentalChart';

// Render a single tooth as a 5-surface SVG. Surface-based statuses fill only
// the affected surfaces; whole-tooth statuses fill the entire crown.
function ToothSVG({ status, surfaces, size = 34 }) {
  const color = statusColor(status);
  const isMissing = status === 'Missing';
  const whole = isWholeToothStatus(status);
  const surfaceMode = isSurfaceStatus(status);

  const fill = (surf) => {
    if (whole) return color;
    if (surfaceMode && surfaces?.includes(surf)) return color;
    return 'transparent';
  };

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ opacity: isMissing ? 0.25 : 1 }}>
      <rect x="0.5" y="0.5" width="39" height="39" fill="none" stroke={colors.border} strokeWidth="1" rx="3" />
      <rect x="12" y="12" width="16" height="16" fill={fill('O')} stroke={colors.textLight} strokeWidth="0.75" />
      <polygon points="0,0 40,0 28,12 12,12" fill={fill('B')} stroke={colors.textLight} strokeWidth="0.75" />
      <polygon points="12,28 28,28 40,40 0,40" fill={fill('L')} stroke={colors.textLight} strokeWidth="0.75" />
      <polygon points="0,0 12,12 12,28 0,40" fill={fill('M')} stroke={colors.textLight} strokeWidth="0.75" />
      <polygon points="40,0 40,40 28,28 28,12" fill={fill('D')} stroke={colors.textLight} strokeWidth="0.75" />
      {status === 'Root Canal' && (
        <line x1="20" y1="3" x2="20" y2="37" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      )}
      {status === 'Missing' && (
        <line x1="6" y1="6" x2="34" y2="34" stroke={colors.textLight} strokeWidth="2" />
      )}
    </svg>
  );
}

function Tooth({ number, record, selected, onClick, numberOnTop }) {
  const labelLine = (
    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: colors.textSecondary, lineHeight: 1.1, height: 14, textAlign: 'center' }}>
      {record.status === 'Healthy' ? '' : statusLabel(record.status).split(' ')[0]}
    </Typography>
  );
  const surfaceLine = (
    <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: colors.primary, lineHeight: 1.1, height: 12, textAlign: 'center' }}>
      {record.surfaces || ''}
    </Typography>
  );
  const numberChip = (
    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.textPrimary }}>{number}</Typography>
  );

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.25,
        p: 0.5,
        borderRadius: '8px',
        cursor: 'pointer',
        border: `1px solid ${selected ? colors.primary : 'transparent'}`,
        bgcolor: selected ? colors.surfaceAlt : 'transparent',
        transition: 'all 0.12s ease',
        '&:hover': { bgcolor: colors.surfaceAlt, transform: 'translateY(-1px)' },
      }}
    >
      {numberOnTop ? (
        <>
          {numberChip}
          <ToothSVG status={record.status} surfaces={record.surfaces} />
          {labelLine}
          {surfaceLine}
        </>
      ) : (
        <>
          {surfaceLine}
          {labelLine}
          <ToothSVG status={record.status} surfaces={record.surfaces} />
          {numberChip}
        </>
      )}
    </Box>
  );
}

export default function Odontogram({ patientId }) {
  const { toothRecords, toothHistory, treatments, updateTooth } = useClinicData();
  const { notify } = useNotification();

  const chart = useMemo(() => toothRecords[patientId] || {}, [toothRecords, patientId]);
  const patientTreatments = useMemo(
    () => treatments.filter((t) => t.patientId === patientId),
    [treatments, patientId]
  );

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [editStatus, setEditStatus] = useState('Healthy');
  const [editSurfaces, setEditSurfaces] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Resolve all 32 teeth once per data change (charted record → derived from
  // treatments → Healthy), instead of re-scanning treatments on every render.
  const resolved = useMemo(() => {
    const map = {};
    ALL_TEETH.forEach((num) => {
      map[num] = resolveToothRecord(num, chart, patientTreatments);
    });
    return map;
  }, [chart, patientTreatments]);

  const summary = useMemo(() => {
    const counts = {};
    Object.values(resolved).forEach(({ status }) => {
      if (status !== DEFAULT_STATUS) counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [resolved]);

  const patientHistory = useMemo(
    () => toothHistory.filter((h) => h.patientId === patientId),
    [toothHistory, patientId]
  );

  const recordFor = (num) => resolved[num];

  const openEditor = (num) => {
    const rec = recordFor(num);
    setSelectedTooth(num);
    setEditStatus(rec.status);
    setEditSurfaces(rec.surfaces || '');
    setEditNotes(rec.notes || '');
  };

  const toggleSurface = (surf) => {
    setEditSurfaces((prev) =>
      prev.includes(surf) ? prev.replace(surf, '') : SURFACES.filter((s) => prev.includes(s) || s === surf).join('')
    );
  };

  const handleSave = () => {
    const surfaces = isSurfaceStatus(editStatus) ? editSurfaces : '';
    updateTooth(patientId, selectedTooth, { status: editStatus, surfaces, notes: editNotes });
    notify(`Tooth #${selectedTooth} charted as ${statusLabel(editStatus)}.`, 'success');
    setSelectedTooth(null);
  };

  return (
    <Box>
      {/* Legend */}
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2.5 }}>
        {LEGEND.map((status) => (
          <Box key={status} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.4, borderRadius: '6px', bgcolor: colors.surfaceAlt }}>
            <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: statusColor(status) }} />
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: colors.textSecondary }}>{statusLabel(status)}</Typography>
          </Box>
        ))}
      </Stack>

      {/* Summary strip */}
      {Object.keys(summary).length > 0 && (
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {Object.entries(summary).map(([status, count]) => (
            <Box key={status} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: '999px', border: `1px solid ${statusColor(status)}33`, bgcolor: `${statusColor(status)}14` }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: statusColor(status) }}>{count}</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary }}>{statusLabel(status)}</Typography>
            </Box>
          ))}
        </Stack>
      )}

      <Box sx={{ p: 2, borderRadius: '12px', border: `1px solid ${colors.border}`, bgcolor: colors.surface, overflowX: 'auto' }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.textSecondary, textAlign: 'center', letterSpacing: '0.06em', mb: 1 }}>
          UPPER ARCH (MAXILLA)
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25, flexWrap: 'nowrap', minWidth: 'fit-content' }}>
          {UPPER_ARCH.map((num) => (
            <Tooth key={num} number={num} record={recordFor(num)} selected={selectedTooth === num} onClick={() => openEditor(num)} numberOnTop />
          ))}
        </Box>

        <Box sx={{ height: '1px', bgcolor: colors.borderLight, my: 1.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25, flexWrap: 'nowrap', minWidth: 'fit-content' }}>
          {LOWER_ARCH.map((num) => (
            <Tooth key={num} number={num} record={recordFor(num)} selected={selectedTooth === num} onClick={() => openEditor(num)} numberOnTop={false} />
          ))}
        </Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.textSecondary, textAlign: 'center', letterSpacing: '0.06em', mt: 1 }}>
          LOWER ARCH (MANDIBLE)
        </Typography>
      </Box>

      <Typography variant="caption" sx={{ color: colors.textLight, display: 'block', mt: 1 }}>
        Universal Numbering System (1–32). Click any tooth to chart its status, affected surfaces, and clinical notes.
      </Typography>

      {/* Charting history */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: colors.primary, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon fontSize="small" /> Charting History
        </Typography>
        {patientHistory.length === 0 ? (
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>No charting changes recorded yet.</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto', maxHeight: 240, overflowY: 'auto' }}>
            <Table size="small" sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Tooth</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Surfaces</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patientHistory.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.78rem', color: colors.textSecondary }}>{new Date(h.at).toLocaleString()}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={700}>#{h.toothNumber}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.78rem', color: statusColor(h.prevStatus) }}>{statusLabel(h.prevStatus)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 700, color: statusColor(h.newStatus) }}>{statusLabel(h.newStatus)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 700, color: colors.primary }}>{h.surfaces || '-'}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 240 }}><Typography variant="body2" sx={{ fontSize: '0.78rem', color: colors.textSecondary }} noWrap>{h.notes || '-'}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Tooth editor */}
      <Dialog open={selectedTooth !== null} onClose={() => setSelectedTooth(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Chart Tooth #{selectedTooth}</DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, py: 2, borderRadius: '10px', bgcolor: colors.surfaceAlt, border: `1px solid ${colors.border}` }}>
            <ToothSVG status={editStatus} surfaces={editSurfaces} size={84} />
            {isSurfaceStatus(editStatus) ? (
              <Box>
                <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, display: 'block', mb: 1 }}>Affected surfaces</Typography>
                <Stack direction="row" gap={0.75}>
                  {SURFACES.map((s) => (
                    <Button
                      key={s}
                      onClick={() => toggleSurface(s)}
                      variant={editSurfaces.includes(s) ? 'contained' : 'outlined'}
                      sx={{ minWidth: 36, px: 0, fontWeight: 700 }}
                      title={SURFACE_LABELS[s]}
                    >
                      {s}
                    </Button>
                  ))}
                </Stack>
                <Typography variant="caption" sx={{ color: colors.textLight, mt: 1, display: 'block' }}>
                  M·Mesial O·Occlusal D·Distal B·Buccal L·Lingual
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: colors.textLight, maxWidth: 160 }}>
                Surface selection applies to Caries, Filled and Watch statuses.
              </Typography>
            )}
          </Box>

          <TextField select label="Tooth Status" value={editStatus} onChange={(e) => setEditStatus(e.target.value)} fullWidth>
            {TOOTH_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>
            ))}
          </TextField>

          <TextField label="Clinical Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} fullWidth multiline rows={2} placeholder="Findings, plan, follow-up…" />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
          <Button onClick={() => setSelectedTooth(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ fontWeight: 700 }}>Save Record</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
