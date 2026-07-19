import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as SparkIcon,
  Send as SendIcon,
  ErrorOutline as CriticalIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
  CheckCircleOutline as PositiveIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useClinicData } from '../hooks/useClinicData';
import { buildInsights, answerQuestion } from '../utils/insights';
import { colors } from '../theme/theme';

const SEVERITY_CFG = {
  critical: { icon: <CriticalIcon sx={{ fontSize: 19 }} />, color: '#DC2626', bg: '#FEF2F2', border: '#F5C6C6', label: 'Needs attention' },
  warning:  { icon: <WarningIcon sx={{ fontSize: 19 }} />,  color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', label: 'Worth a look' },
  info:     { icon: <InfoIcon sx={{ fontSize: 19 }} />,     color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', label: 'Opportunity' },
  positive: { icon: <PositiveIcon sx={{ fontSize: 19 }} />, color: '#15803D', bg: '#ECFDF5', border: '#A7F3D0', label: 'Healthy' },
};

const SUGGESTIONS = [
  'Revenue this month',
  "Today's appointments",
  'Who has outstanding balance?',
  'Any no-show risks?',
  'Overdue recalls',
  'Top procedures',
];

export default function Assistant() {
  const data = useClinicData();
  const navigate = useNavigate();

  const insights = useMemo(() => buildInsights(data), [data]);

  const [thread, setThread] = useState([
    { from: 'bot', text: "Hi! I'm DentIQ - I watch your clinic data and answer questions instantly. Ask me anything below, or tap a suggestion." },
  ]);
  const [draft, setDraft] = useState('');
  const threadEndRef = useRef(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [thread.length]);

  const ask = (question) => {
    const qText = question.trim();
    if (!qText) return;
    const answer = answerQuestion(qText, data);
    setThread((prev) => [...prev, { from: 'user', text: qText }, { from: 'bot', text: answer.text, action: answer.action }]);
    setDraft('');
  };

  const counts = useMemo(() => ({
    critical: insights.filter((i) => i.severity === 'critical').length,
    warning: insights.filter((i) => i.severity === 'warning').length,
    opportunities: insights.filter((i) => i.severity === 'info').length,
  }), [insights]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: 'linear-gradient(135deg, #7C3AED, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SparkIcon sx={{ fontSize: 17, color: '#fff' }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>DentIQ Assistant</Typography>
            <Chip label="Beta" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F5F3FF', color: '#6D28D9' }} />
          </Box>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.5 }}>
            Practice intelligence computed live from your clinic data - every insight is explainable and actionable.
          </Typography>
        </Box>
      </Box>

      {/* Transparency note */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: '10px', bgcolor: '#F5F3FF', border: '1px solid #DDD6FE' }}>
        <BoltIcon sx={{ fontSize: 18, color: '#6D28D9' }} />
        <Typography variant="body2" sx={{ color: '#4C1D95', fontSize: '0.82rem' }}>
          DentIQ runs <strong>on-device</strong> - your data never leaves the browser. Cloud AI (X-ray analysis, smart replies) arrives with the backend phase.
        </Typography>
      </Box>

      {/* Pulse row */}
      <Grid container spacing={2}>
        {[
          { label: 'Needs attention', value: counts.critical, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Worth a look', value: counts.warning, color: '#B45309', bg: '#FFFBEB' },
          { label: 'Opportunities', value: counts.opportunities, color: '#1D4ED8', bg: '#EFF6FF' },
          { label: 'Checks run', value: 10, color: '#6D28D9', bg: '#F5F3FF' },
        ].map((c) => (
          <Grid item xs={6} md={3} key={c.label}>
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>{c.label}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: c.color, letterSpacing: '-0.02em' }}>{c.value}</Typography>
                </Box>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color, boxShadow: `0 0 0 4px ${c.bg}` }} />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} alignItems="flex-start">
        {/* Insight feed */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
              <Typography variant="subtitle2" fontWeight={700}>Smart Insights</Typography>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>Recomputed automatically whenever clinic data changes</Typography>
            </Box>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {insights.map((ins) => {
                const cfg = SEVERITY_CFG[ins.severity];
                return (
                  <Box key={ins.id} sx={{ display: 'flex', gap: 1.5, p: '14px 16px', borderRadius: '10px', bgcolor: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <Box sx={{ color: cfg.color, flexShrink: 0, mt: '1px' }}>{cfg.icon}</Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: '0.87rem', fontWeight: 700, color: colors.textPrimary }}>{ins.title}</Typography>
                        <Chip label={ins.category} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.7)', color: cfg.color }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, lineHeight: 1.55, mt: 0.5 }}>{ins.detail}</Typography>
                      {ins.action && (
                        <Button size="small" onClick={() => navigate(ins.action.path)} sx={{ mt: 0.75, fontWeight: 700, fontSize: '0.74rem', textTransform: 'none', color: cfg.color, p: '2px 8px', minWidth: 0 }}>
                          {ins.action.label} →
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Grid>

        {/* Ask DentIQ */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
              <Typography variant="subtitle2" fontWeight={700}>Ask DentIQ</Typography>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>Instant answers from your live clinic data</Typography>
            </Box>

            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25, maxHeight: 380, overflowY: 'auto', bgcolor: colors.surfaceAlt }}>
              {thread.map((m, i) => (
                <Box key={i} sx={{ alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                  <Box sx={{
                    px: 1.5, py: 1.1,
                    borderRadius: m.from === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                    bgcolor: m.from === 'user' ? colors.primary : '#fff',
                    border: m.from === 'user' ? 'none' : `1px solid ${colors.border}`,
                  }}>
                    <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.55, color: m.from === 'user' ? '#fff' : colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {m.text}
                    </Typography>
                    {m.action && (
                      <Button size="small" onClick={() => navigate(m.action.path)} sx={{ mt: 0.5, fontWeight: 700, fontSize: '0.72rem', textTransform: 'none', p: '1px 6px', minWidth: 0 }}>
                        {m.action.label} →
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
              <Box ref={threadEndRef} />
            </Box>

            <Box sx={{ px: 2, pt: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map((s) => (
                <Chip key={s} label={s} size="small" onClick={() => ask(s)} sx={{ fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', bgcolor: '#F5F3FF', color: '#6D28D9', '&:hover': { bgcolor: '#EDE9FE' } }} />
              ))}
            </Box>

            <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
              <TextField
                placeholder="Ask about revenue, appointments, risks…"
                size="small"
                fullWidth
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ask(draft); } }}
                inputProps={{ 'aria-label': 'Ask DentIQ a question' }}
              />
              <IconButton onClick={() => ask(draft)} disabled={!draft.trim()} aria-label="Send question"
                sx={{ bgcolor: colors.primary, color: '#fff', borderRadius: '8px', '&:hover': { bgcolor: '#0A3254' }, '&.Mui-disabled': { bgcolor: colors.borderLight, color: colors.textLight } }}>
                <SendIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
