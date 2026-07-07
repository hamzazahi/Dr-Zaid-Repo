import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  Search as SearchIcon,
  Forum as InboxIcon,
  MarkChatUnread as UnreadIcon,
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
  MailOutline as MailIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { colors } from '../theme/theme';

const CHANNELS = ['WhatsApp', 'SMS'];
const CHANNEL_CFG = {
  WhatsApp: { icon: <WhatsAppIcon sx={{ fontSize: 13 }} />, bg: '#ECFDF5', color: '#065F46' },
  SMS:      { icon: <SmsIcon sx={{ fontSize: 13 }} />,      bg: '#EFF6FF', color: '#1D4ED8' },
  Email:    { icon: <MailIcon sx={{ fontSize: 13 }} />,     bg: '#F5F3FF', color: '#6D28D9' },
};

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function ChannelChip({ channel }) {
  const c = CHANNEL_CFG[channel] || CHANNEL_CFG.SMS;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: '7px', py: '2px', borderRadius: '6px', bgcolor: c.bg, color: c.color }}>
      {c.icon}
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'inherit' }}>{channel}</Typography>
    </Box>
  );
}

export default function Messages() {
  const { patients, conversations, sendMessage, markConversationRead, startConversation } = useClinicData();
  const { notify } = useNotification();

  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ patientId: '', channel: 'WhatsApp', text: '' });
  const [formError, setFormError] = useState('');
  const threadEndRef = useRef(null);

  // Sort by most recent message; filter by search.
  const sorted = useMemo(() => {
    const last = (c) => c.messages[c.messages.length - 1]?.at || '';
    return [...conversations]
      .filter((c) => !q.trim() || c.patientName.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => (last(a) < last(b) ? 1 : -1));
  }, [conversations, q]);

  const selected = conversations.find((c) => c.id === selectedId) || null;
  const unreadCount = conversations.filter((c) => c.unread).length;

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [selectedId, selected?.messages.length]);

  const openConversation = (conv) => {
    setSelectedId(conv.id);
    if (conv.unread) markConversationRead(conv.id);
  };

  const handleSend = () => {
    if (!draft.trim() || !selected) return;
    sendMessage(selected.id, draft);
    setDraft('');
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (!form.text.trim()) { setFormError('Please write a message.'); return; }
    const convId = startConversation(form);
    setOpenDialog(false);
    setForm({ patientId: '', channel: 'WhatsApp', text: '' });
    setFormError('');
    setSelectedId(convId);
    notify('Message sent (simulated until the messaging gateway is connected).', 'success');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Messages</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Two-way WhatsApp and SMS conversations with patients.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          New Message
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: '10px', bgcolor: '#EAF2FB', border: '1px solid #C3DCF3' }}>
        <InboxIcon sx={{ fontSize: 18, color: colors.primary }} />
        <Typography variant="body2" sx={{ color: '#0A3254', fontSize: '0.82rem' }}>
          Outgoing messages are <strong>simulated</strong> until the WhatsApp/SMS gateway is connected in the backend phase. Threads and history are fully functional.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 480 }}>
          {/* Conversation list */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0, borderRight: { md: `1px solid ${colors.border}` }, borderBottom: { xs: `1px solid ${colors.border}`, md: 'none' }, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1.5, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField placeholder="Search patients…" size="small" value={q} onChange={(e) => setQ(e.target.value)} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: colors.textLight }} /></InputAdornment> }} />
              {unreadCount > 0 && (
                <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1, '& .MuiBadge-badge': { fontSize: '0.65rem' } }}>
                  <UnreadIcon sx={{ fontSize: 18, color: colors.textSecondary }} />
                </Badge>
              )}
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: { xs: 220, md: 430 } }}>
              {sorted.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>No conversations yet.</Typography>
                </Box>
              ) : (
                sorted.map((c) => {
                  const lastMsg = c.messages[c.messages.length - 1];
                  const active = c.id === selectedId;
                  return (
                    <Box key={c.id} onClick={() => openConversation(c)} sx={{ display: 'flex', gap: 1.25, px: 1.5, py: 1.25, cursor: 'pointer', borderBottom: `1px solid ${colors.borderLight}`, bgcolor: active ? colors.primaryAlpha8 : 'transparent', borderLeft: active ? `3px solid ${colors.primary}` : '3px solid transparent', '&:hover': { bgcolor: active ? colors.primaryAlpha8 : colors.surfaceAlt } }}>
                      <Avatar sx={{ width: 34, height: 34, fontSize: '0.75rem', fontWeight: 700, bgcolor: avatarColor(c.patientName), flexShrink: 0 }}>
                        {c.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography noWrap sx={{ fontSize: '0.83rem', fontWeight: c.unread ? 800 : 600, color: colors.textPrimary }}>{c.patientName}</Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: colors.textLight, flexShrink: 0 }}>{fmtTime(lastMsg?.at)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                          <ChannelChip channel={c.channel} />
                          <Typography noWrap sx={{ fontSize: '0.74rem', color: c.unread ? colors.textPrimary : colors.textSecondary, fontWeight: c.unread ? 600 : 400, flex: 1, minWidth: 0 }}>
                            {lastMsg?.from === 'clinic' ? 'You: ' : ''}{lastMsg?.text}
                          </Typography>
                          {c.unread && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.primary, flexShrink: 0 }} />}
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {/* Thread */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {!selected ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 6 }}>
                <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <InboxIcon sx={{ fontSize: 24, color: colors.textLight }} />
                </Box>
                <Typography variant="body2" fontWeight={600}>Select a conversation</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Or start a new one with any patient.</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Avatar sx={{ width: 30, height: 30, fontSize: '0.7rem', fontWeight: 700, bgcolor: avatarColor(selected.patientName) }}>
                    {selected.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>{selected.patientName}</Typography>
                  <ChannelChip channel={selected.channel} />
                </Box>
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: { xs: 260, md: 360 }, bgcolor: colors.surfaceAlt }}>
                  {selected.messages.map((m) => (
                    <Box key={m.id} sx={{ alignSelf: m.from === 'clinic' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      <Box sx={{ px: 1.5, py: 1, borderRadius: m.from === 'clinic' ? '12px 12px 3px 12px' : '12px 12px 12px 3px', bgcolor: m.from === 'clinic' ? colors.primary : '#fff', border: m.from === 'clinic' ? 'none' : `1px solid ${colors.border}` }}>
                        <Typography sx={{ fontSize: '0.82rem', color: m.from === 'clinic' ? '#fff' : colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.65rem', color: colors.textLight, mt: 0.25, textAlign: m.from === 'clinic' ? 'right' : 'left' }}>{fmtTime(m.at)}</Typography>
                    </Box>
                  ))}
                  <Box ref={threadEndRef} />
                </Box>
                <Box sx={{ p: 1.5, borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 1 }}>
                  <TextField
                    placeholder={`Message ${selected.patientName}…`}
                    size="small"
                    fullWidth
                    multiline
                    maxRows={3}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                  <IconButton onClick={handleSend} disabled={!draft.trim()} sx={{ bgcolor: colors.primary, color: '#fff', borderRadius: '8px', '&:hover': { bgcolor: '#0A3254' }, '&.Mui-disabled': { bgcolor: colors.borderLight, color: colors.textLight } }} aria-label="Send message">
                    <SendIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Card>

      {/* New message dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          New Message
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Starts a thread — or continues the existing one for that patient.</Typography>
        </DialogTitle>
        <form onSubmit={handleStart} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField select label="Patient" value={form.patientId} onChange={(e) => { setForm((p) => ({ ...p, patientId: e.target.value })); setFormError(''); }} fullWidth required>
                  {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField select label="Channel" value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))} fullWidth>
                  {CHANNELS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Message" value={form.text} onChange={(e) => { setForm((p) => ({ ...p, text: e.target.value })); setFormError(''); }} fullWidth required multiline rows={3} placeholder="Type the message…" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" startIcon={<SendIcon sx={{ fontSize: 15 }} />} sx={{ fontWeight: 700 }}>Send</Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
}
