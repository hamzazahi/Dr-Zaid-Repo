import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ErrorOutline as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

// ─── Inline keyframe styles injected once ──────────────────────────────────
const KEYFRAMES = `
  @keyframes floatA { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
  @keyframes floatB { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
  @keyframes pulse  { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes slideUp{ 0%{opacity:0;transform:translateY(16px)} 100%{opacity:1;transform:translateY(0)} }
`;

// ─── Left panel floating metric card ───────────────────────────────────────
function MetricFloat({ value, label, icon, style }) {
  return (
    <Box sx={{
      position: 'absolute',
      display: 'flex', alignItems: 'center', gap: 1.25,
      px: 1.75, py: 1.25,
      borderRadius: '12px',
      bgcolor: 'rgba(255,255,255,0.09)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.14)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      ...style,
    }}>
      <Typography sx={{ fontSize: '1.1rem' }}>{icon}</Typography>
      <Box>
        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.1 }}>{value}</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', fontWeight: 500 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

// ─── Trust badge row ────────────────────────────────────────────────────────
function TrustBadge({ icon, label }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.75, borderRadius: '8px', bgcolor: '#F8FAFF', border: '1px solid #E8EEFF' }}>
      <Typography sx={{ fontSize: '0.85rem' }}>{icon}</Typography>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>{label}</Typography>
    </Box>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [remember, setRemember]     = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  const validate = () => {
    if (!email.trim())                                        return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))   return 'Enter a valid email address.';
    if (!password)                                            return 'Password is required.';
    if (password.length < 6)                                  return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    if (email.trim().toLowerCase() !== 'admin@drzaiddental.com' || password !== 'admin123') {
      setError('Incorrect email or password. Please try again.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setSuccess(true);
      setTimeout(() => signIn({ email: email.trim(), keepSignedIn: remember }), 600);
    }, 900);
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      <Box sx={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>

        {/* ══════════════════════════════════════════════
            LEFT PANEL — Branding & Visual
        ══════════════════════════════════════════════ */}
        <Box sx={{
          display: { xs: 'none', lg: 'flex' },
          width: '48%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #060F1E 0%, #0A1E3D 35%, #0D3B73 70%, #0F4C8F 100%)',
          p: '44px 52px',
        }}>

          {/* ── Decorative orbs ── */}
          <Box sx={{ position:'absolute', top:-100, right:-80, width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)', pointerEvents:'none' }} />
          <Box sx={{ position:'absolute', bottom:-80, left:-60, width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />
          <Box sx={{ position:'absolute', top:'42%', right:'8%', width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />

          {/* ── SVG mesh/grid overlay ── */}
          <Box sx={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.06 }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.8"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </Box>

          {/* ── Logo ── */}
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, position:'relative', zIndex:1 }}>
            <Box sx={{
              width:42, height:42, borderRadius:'11px',
              background:'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)',
              border:'1px solid rgba(255,255,255,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              backdropFilter:'blur(8px)',
              boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
            }}>
              {/* Custom dental cross logo */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="8" y="2" width="6" height="18" rx="2" fill="white" fillOpacity="0.9"/>
                <rect x="2" y="8" width="18" height="6" rx="2" fill="white" fillOpacity="0.9"/>
              </svg>
            </Box>
            <Box>
              <Typography sx={{ color:'#fff', fontWeight:800, fontSize:'1rem', letterSpacing:'-0.01em', lineHeight:1.2 }}>
                Dr. Zaid Dental
              </Typography>
              <Typography sx={{ color:'rgba(255,255,255,0.45)', fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                Clinic Management
              </Typography>
            </Box>
          </Box>

          {/* ── Center hero content ── */}
          <Box sx={{ position:'relative', zIndex:1 }}>

            {/* Floating metric cards */}
            <MetricFloat
              value="2,400+"  label="Patients managed"  icon="🦷"
              style={{ top:'-90px', right:'-12px', animation:'floatA 4s ease-in-out infinite' }}
            />
            <MetricFloat
              value="98.4%"  label="Appointment rate"  icon="📅"
              style={{ bottom:'-30px', right:'20px', animation:'floatB 5s ease-in-out infinite 0.8s' }}
            />

            {/* Main illustration — abstract dental/health SVG */}
            <Box sx={{ mb: 3.5 }}>
              <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer glow ring */}
                <circle cx="70" cy="62" r="52" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                {/* Inner ring */}
                <circle cx="70" cy="62" r="36" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
                {/* Tooth shape */}
                <path d="M55 46 C51 46 46 51 46 60 C46 72 51 88 55 88 C57 88 58 85 59 80 C60 85 62 88 65 88 C67 88 69 84 70 78 C71 84 73 88 75 88 C77 88 79 84 80 78 C81 84 83 88 85 88 C89 88 94 72 94 60 C94 51 89 46 85 46 C82 46 80 48 79 51 C77 48 75 46 70 46 C65 46 62 48 61 51 C59 48 57 46 55 46Z"
                  fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinejoin="round"/>
                {/* Shine on tooth */}
                <path d="M59 52 C57 55 56 60 57 65" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
                {/* Sparkle dots */}
                <circle cx="108" cy="30" r="3" fill="rgba(147,197,253,0.7)" style={{animation:'pulse 2s ease-in-out infinite'}}/>
                <circle cx="130" cy="50" r="2" fill="rgba(196,181,253,0.7)" style={{animation:'pulse 2.5s ease-in-out infinite 0.5s'}}/>
                <circle cx="120" cy="90" r="2.5" fill="rgba(110,231,183,0.7)" style={{animation:'pulse 3s ease-in-out infinite 1s'}}/>
                <circle cx="20" cy="40" r="2" fill="rgba(253,186,116,0.6)" style={{animation:'pulse 2.2s ease-in-out infinite 0.3s'}}/>
                {/* Connecting lines */}
                <line x1="108" y1="30" x2="130" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3"/>
                <line x1="130" y1="50" x2="120" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3"/>
              </svg>
            </Box>

            <Typography sx={{
              color:'#fff', fontWeight:800, fontSize:'1.85rem',
              lineHeight:1.2, letterSpacing:'-0.03em', mb:1.5,
            }}>
              The complete platform<br />for modern dental clinics
            </Typography>
            <Typography sx={{ color:'rgba(255,255,255,0.55)', fontSize:'0.875rem', lineHeight:1.75, mb:3.5, maxWidth:380 }}>
              Manage patients, appointments, treatments, billing, and inventory — all from one secure, intuitive dashboard.
            </Typography>

            {/* Feature list */}
            <Stack spacing={1.5}>
              {[
                { icon:'👤', text:'Patient records & complete medical history' },
                { icon:'📆', text:'Smart appointment scheduling & reminders' },
                { icon:'💳', text:'Billing, invoices & payment tracking' },
                { icon:'📊', text:'Analytics, inventory & prescription management' },
              ].map(({ icon, text }) => (
                <Box key={text} sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                  <Box sx={{
                    width:28, height:28, borderRadius:'7px', flexShrink:0,
                    bgcolor:'rgba(255,255,255,0.08)',
                    border:'1px solid rgba(255,255,255,0.1)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.8rem',
                  }}>{icon}</Box>
                  <Typography sx={{ color:'rgba(255,255,255,0.72)', fontSize:'0.82rem', fontWeight:500 }}>{text}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* ── Testimonial card ── */}
          <Box sx={{
            position:'relative', zIndex:1,
            p:'16px 20px',
            borderRadius:'12px',
            bgcolor:'rgba(255,255,255,0.07)',
            border:'1px solid rgba(255,255,255,0.12)',
            backdropFilter:'blur(8px)',
          }}>
            <Typography sx={{ color:'rgba(255,255,255,0.8)', fontSize:'0.8rem', lineHeight:1.65, fontStyle:'italic', mb:1.25 }}>
              "Switched from paper-based management. Patient flow is now 3× faster and billing errors dropped to near zero."
            </Typography>
            <Box sx={{ display:'flex', alignItems:'center', gap:1.25 }}>
              <Box sx={{ width:30, height:30, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Typography sx={{ fontSize:'0.75rem', fontWeight:700, color:'#fff' }}>SA</Typography>
              </Box>
              <Box>
                <Typography sx={{ color:'#fff', fontSize:'0.75rem', fontWeight:700 }}>Dr. Sara Ahmed</Typography>
                <Typography sx={{ color:'rgba(255,255,255,0.4)', fontSize:'0.65rem' }}>Dental Surgeon · Lahore</Typography>
              </Box>
              {/* Star rating */}
              <Box sx={{ ml:'auto', display:'flex', gap:0.25 }}>
                {[1,2,3,4,5].map((s) => <Typography key={s} sx={{ fontSize:'0.7rem', color:'#FCD34D' }}>★</Typography>)}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ══════════════════════════════════════════════
            RIGHT PANEL — Sign In Form
        ══════════════════════════════════════════════ */}
        <Box sx={{
          flex:1,
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          justifyContent:'center',
          bgcolor:'#FFFFFF',
          position:'relative',
          minHeight:'100vh',
          overflowY:'auto',
          p:{ xs:'40px 24px', sm:'48px 40px' },
          // Subtle dot pattern
          backgroundImage:'radial-gradient(circle, #E2E8F0 1px, transparent 1px)',
          backgroundSize:'28px 28px',
        }}>

          {/* White card that sits on top of dot pattern */}
          <Box sx={{
            position:'relative', zIndex:1,
            width:'100%', maxWidth:420,
            bgcolor:'#fff',
            borderRadius:'20px',
            border:'1px solid #EEF2F6',
            boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 50px -12px rgba(15,76,129,0.12)',
            p:{ xs:'32px 28px', sm:'40px 44px' },
            animation:'slideUp 0.45s ease-out both',
          }}>

            {/* Mobile logo */}
            <Box sx={{ display:{ xs:'flex', lg:'none' }, alignItems:'center', gap:1.5, mb:3.5 }}>
              <Box sx={{ width:36, height:36, borderRadius:'9px', bgcolor:'#0F4C81', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <rect x="8" y="2" width="6" height="18" rx="2" fill="white"/>
                  <rect x="2" y="8" width="18" height="6" rx="2" fill="white"/>
                </svg>
              </Box>
              <Typography sx={{ fontWeight:800, fontSize:'0.95rem', color:'#0F4C81' }}>Dr. Zaid Dental</Typography>
            </Box>

            {/* Heading */}
            <Box sx={{ mb:3 }}>
              <Typography sx={{ fontWeight:800, fontSize:'1.5rem', color:'#0F172A', letterSpacing:'-0.025em', lineHeight:1.25, mb:0.5 }}>
                Sign in to your account
              </Typography>
              <Typography sx={{ color:'#64748B', fontSize:'0.875rem', lineHeight:1.5 }}>
                Access your clinic dashboard securely
              </Typography>
            </Box>

            {/* Error banner */}
            {error && (
              <Box sx={{
                display:'flex', alignItems:'flex-start', gap:1,
                mb:2.5, px:1.5, py:1.25,
                borderRadius:'10px',
                bgcolor:'#FFF1F2',
                border:'1px solid #FFD6D9',
                animation:'slideUp 0.2s ease-out',
              }}>
                <ErrorIcon sx={{ color:'#E11D48', fontSize:17, mt:'1px', flexShrink:0 }} />
                <Typography sx={{ color:'#BE123C', fontSize:'0.82rem', fontWeight:500 }}>{error}</Typography>
              </Box>
            )}

            {/* Success banner */}
            {success && (
              <Box sx={{
                display:'flex', alignItems:'center', gap:1,
                mb:2.5, px:1.5, py:1.25,
                borderRadius:'10px',
                bgcolor:'#F0FDF4',
                border:'1px solid #BBF7D0',
              }}>
                <CheckIcon sx={{ color:'#16A34A', fontSize:17 }} />
                <Typography sx={{ color:'#15803D', fontSize:'0.82rem', fontWeight:600 }}>Authenticated — redirecting…</Typography>
              </Box>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.25}>

                {/* Email */}
                <Box>
                  <Typography sx={{ fontSize:'0.78rem', fontWeight:600, color:'#334155', mb:0.6, letterSpacing:'0.01em' }}>
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="you@clinic.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    disabled={loading || success}
                    autoComplete="email"
                    autoFocus
                    size="medium"
                    InputProps={{
                      startAdornment:(
                        <InputAdornment position="start">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                        </InputAdornment>
                      ),
                      sx:{
                        bgcolor:'#F8FAFC',
                        borderRadius:'10px',
                        fontSize:'0.875rem',
                        '& input':{ py:'13px', lineHeight:'1.5' },
                        '& fieldset':{ borderColor:'#E2E8F0', borderRadius:'10px' },
                        '&:hover fieldset':{ borderColor:'#94A3B8' },
                        '&.Mui-focused fieldset':{ borderColor:'#0F4C81', borderWidth:'1.5px' },
                        '&.Mui-focused':{ bgcolor:'#fff' },
                      },
                    }}
                  />
                </Box>

                {/* Password */}
                <Box>
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:0.6 }}>
                    <Typography sx={{ fontSize:'0.78rem', fontWeight:600, color:'#334155', letterSpacing:'0.01em' }}>
                      Password
                    </Typography>
                    <Typography sx={{ fontSize:'0.75rem', fontWeight:600, color:'#0F4C81', cursor:'pointer', '&:hover':{ color:'#0A3254', textDecoration:'underline' } }}>
                      Forgot password?
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    disabled={loading || success}
                    autoComplete="current-password"
                    size="medium"
                    InputProps={{
                      startAdornment:(
                        <InputAdornment position="start">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </InputAdornment>
                      ),
                      endAdornment:(
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPw((p) => !p)} tabIndex={-1} edge="end"
                            sx={{ color:'#94A3B8', '&:hover':{ color:'#64748B', bgcolor:'transparent' } }}>
                            {showPw
                              ? <VisibilityOff sx={{ fontSize:17 }} />
                              : <Visibility sx={{ fontSize:17 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx:{
                        bgcolor:'#F8FAFC',
                        borderRadius:'10px',
                        fontSize:'0.875rem',
                        '& input':{ py:'13px', lineHeight:'1.5' },
                        '& fieldset':{ borderColor:'#E2E8F0', borderRadius:'10px' },
                        '&:hover fieldset':{ borderColor:'#94A3B8' },
                        '&.Mui-focused fieldset':{ borderColor:'#0F4C81', borderWidth:'1.5px' },
                        '&.Mui-focused':{ bgcolor:'#fff' },
                      },
                    }}
                  />
                </Box>

                {/* Remember me */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      size="small"
                      sx={{ color:'#CBD5E1', p:0.75, '&.Mui-checked':{ color:'#0F4C81' } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize:'0.8rem', color:'#64748B', fontWeight:500 }}>
                      Keep me signed in for 30 days
                    </Typography>
                  }
                  sx={{ mx:0 }}
                />

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading || success}
                  sx={{
                    py:'13px',
                    borderRadius:'10px',
                    fontSize:'0.9rem',
                    fontWeight:700,
                    letterSpacing:'0.01em',
                    background: success
                      ? 'linear-gradient(135deg, #16A34A, #15803D)'
                      : 'linear-gradient(135deg, #0F4C81 0%, #1565A8 100%)',
                    boxShadow: success
                      ? '0 4px 14px rgba(22,163,74,0.35)'
                      : '0 4px 14px rgba(15,76,129,0.3)',
                    transition:'all 0.3s ease',
                    '&:hover':{ background:'linear-gradient(135deg, #0A3254 0%, #0F4C81 100%)', boxShadow:'0 6px 20px rgba(15,76,129,0.4)', transform:'translateY(-1px)' },
                    '&:active':{ transform:'translateY(0)' },
                    '&:disabled':{ background:'#CBD5E1', boxShadow:'none', color:'#94A3B8' },
                  }}
                >
                  {loading
                    ? <Stack direction="row" alignItems="center" spacing={1.25}>
                        <CircularProgress size={16} sx={{ color:'rgba(255,255,255,0.8)' }} />
                        <span>Verifying credentials…</span>
                      </Stack>
                    : success
                    ? <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckIcon sx={{ fontSize:18 }} />
                        <span>Access Granted</span>
                      </Stack>
                    : 'Sign In to Dashboard'}
                </Button>
              </Stack>
            </Box>

            {/* Divider */}
            <Box sx={{ mt:4, mb:2.5, display:'flex', alignItems:'center', gap:1.5 }}>
              <Box sx={{ flex:1, height:'1px', bgcolor:'#F1F5F9' }} />
              <Typography sx={{ fontSize:'0.7rem', color:'#CBD5E1', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Security
              </Typography>
              <Box sx={{ flex:1, height:'1px', bgcolor:'#F1F5F9' }} />
            </Box>

            {/* Trust badges */}
            <Stack direction="row" spacing={1} sx={{ flexWrap:'wrap', gap:1, justifyContent:'center' }}>
              <TrustBadge icon="🔒" label="256-bit SSL" />
              <TrustBadge icon="🛡️" label="HIPAA Compliant" />
              <TrustBadge icon="✅" label="Verified Secure" />
            </Stack>
          </Box>

          {/* Bottom copyright */}
          <Typography sx={{ mt:3, fontSize:'0.72rem', color:'#94A3B8', textAlign:'center', position:'relative', zIndex:1 }}>
            © {new Date().getFullYear()} Dr. Zaid Dental Clinic · All rights reserved
          </Typography>
        </Box>

      </Box>
    </>
  );
}
