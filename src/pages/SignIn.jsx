import { useMemo, useState } from 'react';
import { Box, ButtonBase, IconButton, Stack, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const ACCENT = '#0F4C81';        // Dr. Zaid Dental healthcare blue (matches app theme)
const ACCENT_HOVER = '#0A3254';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Restrained set of animations — no floating "template" blobs.
const KEYFRAMES = `
  @keyframes si-fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
  @keyframes si-spin   { to { transform:rotate(360deg) } }
  @keyframes si-check  { to { stroke-dashoffset:0 } }
  @keyframes si-shake  {
    10%,90% { transform:translateX(-1px) } 20%,80% { transform:translateX(2px) }
    30%,50%,70% { transform:translateX(-6px) } 40%,60% { transform:translateX(6px) }
  }
  /* Floating label driven by CSS so it also floats for BROWSER-AUTOFILLED values
     (autofill doesn't update React state, which used to leave the label overlapping). */
  .si-field-label { position:absolute; left:16px; pointer-events:none; transition:all .18s ease;
    top:50%; transform:translateY(-50%); font-size:14.5px; font-weight:500; letter-spacing:0; text-transform:none; }
  .si-field-input:focus ~ .si-field-label,
  .si-field-input:not(:placeholder-shown) ~ .si-field-label,
  .si-field-input:-webkit-autofill ~ .si-field-label {
    top:8px; transform:none; font-size:11px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; }
`;

// ── Brand mark (dental cross) ───────────────────────────────────────────────
function Logo({ size = 34, light }) {
  return (
    <Box sx={{
      width: size, height: size, borderRadius: '9px', flexShrink: 0,
      bgcolor: ACCENT,
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: light ? 'inset 0 0 0 1px rgba(255,255,255,0.12)' : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
    }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none">
        <rect x="9.5" y="3" width="5" height="18" rx="2" fill="#fff" />
        <rect x="3" y="9.5" width="18" height="5" rx="2" fill="#fff" />
      </svg>
    </Box>
  );
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
  </svg>
);

// ── Capabilities grouped into meaningful sections (not a flat bullet list) ──
const ICON = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const FEATURE_GROUPS = [
  { label: 'Clinical', desc: 'Dental charting, treatment plans & e-prescriptions', icon: (<svg {...ICON}><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>) },
  { label: 'Front desk', desc: 'Scheduling, reminders & unified patient records', icon: (<svg {...ICON}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>) },
  { label: 'Business', desc: 'Billing, inventory & real-time analytics', icon: (<svg {...ICON}><path d="M3 3v18h18" /><path d="m7 14 3-3 3 2 5-6" /></svg>) },
];

// ── Floating-label input ────────────────────────────────────────────────────
function Field({ id, label, type, value, onChange, onBlur, valid, error, autoComplete, endAdornment, theme }) {
  const [focused, setFocused] = useState(false);
  const showError = Boolean(error);
  const showValid = valid && value.length > 0 && !endAdornment;
  const padRight = endAdornment || showValid ? 46 : 16;

  const borderColor = showError ? '#DC2626' : focused ? ACCENT : theme.inputBorder;
  const ring = focused
    ? showError ? '0 0 0 3px rgba(220,38,38,0.13)' : `0 0 0 3px ${ACCENT}1F`
    : 'none';

  return (
    <Box>
      <Box sx={{ position: 'relative' }}>
        <input
          id={id}
          className="si-field-input"
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          autoComplete={autoComplete}
          placeholder=" "
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: `22px ${padRight}px 8px 16px`,
            fontSize: '14.5px', fontFamily: 'inherit', fontWeight: 500,
            color: theme.text, background: theme.inputBg,
            border: `1.5px solid ${borderColor}`, borderRadius: '10px',
            outline: 'none', boxShadow: ring,
            transition: 'border-color .18s ease, box-shadow .2s ease, background .18s ease',
          }}
        />
        <Box component="label" htmlFor={id} className="si-field-label" sx={{
          color: showError ? '#DC2626' : focused ? ACCENT : theme.textMuted,
        }}>
          {label}
        </Box>

        {endAdornment && (
          <Box sx={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}>{endAdornment}</Box>
        )}
        {showValid && (
          <Box sx={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Box>
        )}
      </Box>
      <Box sx={{ height: 15, mt: '5px', ml: '4px' }}>
        {showError && <Typography sx={{ fontSize: '11.5px', fontWeight: 500, color: '#DC2626' }}>{error}</Typography>}
      </Box>
    </Box>
  );
}

export default function SignIn() {
  const { signIn, verifyCredentials } = useAuth();

  const [dark, setDark] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shaking, setShaking] = useState(false);

  const theme = useMemo(() => (dark ? {
    rightBg: '#0C111B', panelEdge: 'rgba(255,255,255,0.06)',
    card: '#121826', cardBorder: 'rgba(255,255,255,0.08)',
    text: '#ECEFF5', textMuted: '#8A93A6', textFaint: '#5C6678',
    inputBg: '#0E1422', inputBorder: 'rgba(255,255,255,0.12)',
    divider: 'rgba(255,255,255,0.08)',
    socialBg: 'transparent', socialHover: 'rgba(255,255,255,0.05)', socialHoverBorder: 'rgba(255,255,255,0.22)',
    toggleBg: 'rgba(255,255,255,0.06)', pillBg: 'rgba(255,255,255,0.04)',
  } : {
    rightBg: '#F4F6FA', panelEdge: 'rgba(15,23,42,0.06)',
    card: '#FFFFFF', cardBorder: '#E7EBF1',
    text: '#0F172A', textMuted: '#5A6577', textFaint: '#94A0B0',
    inputBg: '#FBFCFE', inputBorder: '#DFE4EC',
    divider: '#E7EBF1',
    socialBg: '#FFFFFF', socialHover: '#F4F7FB', socialHoverBorder: '#CBD4E0',
    toggleBg: 'rgba(15,23,42,0.04)', pillBg: '#F3F5F9',
  }), [dark]);

  const emailValid = EMAIL_RE.test(email.trim());
  const pwValid = password.length >= 6;
  const emailError = emailTouched && email.length > 0 && !emailValid ? 'Enter a valid email address.' : null;
  const pwError = pwTouched && password.length > 0 && !pwValid ? 'Must be at least 6 characters.' : null;

  const clearBanners = () => { setError(''); setInfo(''); };
  const triggerShake = () => { setShaking(false); requestAnimationFrame(() => setShaking(true)); };

  const validate = () => {
    if (!email.trim()) return 'Email address is required.';
    if (!emailValid) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (!pwValid) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEmailTouched(true);
    setPwTouched(true);
    const err = validate();
    if (err) { setError(err); setInfo(''); triggerShake(); return; }

    clearBanners();
    setLoading(true);
    setTimeout(() => {
      if (!verifyCredentials(email.trim(), password)) {
        setLoading(false);
        setError('Incorrect email or password. Please try again.');
        triggerShake();
        return;
      }
      setSuccess(true);
      setTimeout(() => signIn({ email: email.trim(), password, keepSignedIn: remember }), 900);
    }, 1100);
  };

  const busy = loading || success;

  return (
    <>
      <style>{KEYFRAMES}</style>

      <Box sx={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', position: 'relative' }}>

        {/* Dark-mode toggle */}
        <IconButton
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
          sx={{
            position: 'absolute', top: 20, right: 24, zIndex: 20, width: 38, height: 38, borderRadius: '10px',
            bgcolor: theme.toggleBg, color: dark ? '#FBBF24' : '#475569', border: `1px solid ${theme.panelEdge}`,
            transition: 'transform .2s ease', '&:hover': { transform: 'translateY(-1px) rotate(12deg)' },
          }}
        >
          {dark
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4.5" /><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></g></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>}
        </IconButton>

        {/* ══ LEFT — brand / marketing ══ */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' }, width: '45%', position: 'relative', overflow: 'hidden',
          flexDirection: 'column', justifyContent: 'space-between', p: '56px 56px',
          color: '#fff',
          backgroundColor: '#0A0F1A',
          backgroundImage: 'radial-gradient(110% 70% at 0% 0%, rgba(21,101,168,0.22), transparent 55%), linear-gradient(180deg, #0D1626 0%, #090E18 100%)',
        }}>
          {/* grain texture for depth (kills the flat AI-gradient look) */}
          <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
            <svg width="100%" height="100%"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter="url(#grain)" /></svg>
          </Box>
          {/* faint hairline grid */}
          <Box sx={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }}>
            <svg width="100%" height="100%"><defs><pattern id="ln" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="#fff" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#ln)" /></svg>
          </Box>

          {/* logo */}
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Logo size={38} light />
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Dr. Zaid Dental</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Clinic Management</Typography>
            </Box>
          </Box>

          {/* storytelling + grouped capabilities */}
          <Box sx={{ position: 'relative', maxWidth: 440 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.5, mb: 2.5, borderRadius: '999px', bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#34D399' }} />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Trusted by dental teams across Pakistan</Typography>
            </Box>

            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '2rem', lineHeight: 1.2, letterSpacing: '-0.035em', mb: 1.5 }}>
              Run your whole practice<br />from one calm workspace
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.92rem', lineHeight: 1.7, mb: 4 }}>
              Stop juggling registers, spreadsheets and reminders. Dr. Zaid Dental brings every chair, patient and rupee into one place — so your team spends less time on admin and more on care.
            </Typography>

            <Stack spacing={2.25}>
              {FEATURE_GROUPS.map(({ label, desc, icon }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: '10px', flexShrink: 0, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9DC4E8' }}>
                    {icon}
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.84rem', lineHeight: 1.5, mt: 0.25 }}>{desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* stats + testimonial */}
          <Box sx={{ position: 'relative' }}>
            <Stack direction="row" spacing={4} sx={{ mb: 3.5 }}>
              {[['12k+', 'Patients managed'], ['40%', 'Less time on admin'], ['4.9/5', 'Clinic satisfaction']].map(([v, l]) => (
                <Box key={l}>
                  <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>{v}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', fontWeight: 500, mt: 0.25 }}>{l}</Typography>
                </Box>
              ))}
            </Stack>

            <Box sx={{ p: 2.25, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Stack direction="row" spacing={0.25} sx={{ mb: 1 }}>
                {[1, 2, 3, 4, 5].map((s) => <Typography key={s} sx={{ fontSize: '0.78rem', color: '#FBBF24' }}>★</Typography>)}
              </Stack>
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.86rem', lineHeight: 1.6, mb: 1.75 }}>
                “We replaced three tools with this. Front-desk chaos is gone and our billing finally reconciles itself.”
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>SA</Box>
                <Box>
                  <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>Dr. Sara Ahmed</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>Lead Dentist · BrightSmile Dental, Lahore</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ══ RIGHT — auth ══ */}
        <Box sx={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          bgcolor: theme.rightBg, position: 'relative', minHeight: '100vh', p: { xs: '40px 20px', sm: '48px 40px' },
          transition: 'background-color .25s ease',
        }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            onAnimationEnd={() => setShaking(false)}
            sx={{
              position: 'relative', zIndex: 1, width: '100%', maxWidth: 404,
              bgcolor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: '16px',
              p: { xs: '28px 24px', sm: '40px' },
              boxShadow: dark ? '0 20px 48px -24px rgba(0,0,0,0.7)' : '0 18px 44px -28px rgba(15,23,42,0.22), 0 2px 6px -2px rgba(15,23,42,0.06)',
              animation: shaking ? 'si-shake .42s ease' : 'si-fadeUp .5s ease both',
            }}
          >
            {/* mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.25, mb: 3 }}>
              <Logo size={32} />
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: theme.text }}>Dr. Zaid Dental</Typography>
            </Box>

            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.03em', color: theme.text, mb: 0.5 }}>Welcome back</Typography>
            <Typography sx={{ color: theme.textMuted, fontSize: '0.875rem', mb: 3 }}>Sign in to your clinic dashboard</Typography>

            {/* banner */}
            {(error || info) && (
              <Box sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2.5, px: 1.5, py: 1.25, borderRadius: '10px',
                bgcolor: error ? (dark ? 'rgba(220,38,38,0.12)' : '#FEF2F2') : (dark ? 'rgba(15,76,129,0.2)' : '#EAF2FB'),
                border: `1px solid ${error ? (dark ? 'rgba(220,38,38,0.3)' : '#FBD5D5') : (dark ? 'rgba(21,101,168,0.4)' : '#C3DCF3')}`,
              }}>
                <Box sx={{ mt: '1px', flexShrink: 0, color: error ? '#DC2626' : ACCENT, display: 'flex' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
                </Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: error ? (dark ? '#FCA5A5' : '#B42318') : (dark ? '#9DC4E8' : '#0A3254') }}>{error || info}</Typography>
              </Box>
            )}

            {/* PRIMARY — email login */}
            <Stack spacing={0.5}>
              <Field id="email" label="Email address" type="email" autoComplete="email"
                value={email} valid={emailValid} error={emailError} theme={theme}
                onChange={(e) => { setEmail(e.target.value); clearBanners(); }} onBlur={() => setEmailTouched(true)} />
              <Field id="password" label="Password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                value={password} valid={pwValid} error={pwError} theme={theme}
                onChange={(e) => { setPassword(e.target.value); clearBanners(); }} onBlur={() => setPwTouched(true)}
                endAdornment={
                  <ButtonBase onClick={() => setShowPw((p) => !p)} tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}
                    sx={{ px: 1, py: 0.75, borderRadius: '8px', gap: 0.5, color: theme.textMuted, transition: 'all .15s ease', '&:hover': { color: theme.text, bgcolor: theme.socialHover } }}>
                    {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>{showPw ? 'Hide' : 'Show'}</Typography>
                  </ButtonBase>
                } />
            </Stack>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 2.5 }}>
              <Box onClick={() => setRemember((r) => !r)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, cursor: 'pointer', userSelect: 'none' }}>
                <Box sx={{
                  width: 18, height: 18, borderRadius: '5px', flexShrink: 0,
                  border: `1.5px solid ${remember ? ACCENT : theme.inputBorder}`, bgcolor: remember ? ACCENT : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s ease',
                }}>
                  {remember && <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: theme.textMuted }}>Remember me</Typography>
              </Box>
              <Box component="a" href="#" onClick={(e) => e.preventDefault()} sx={{ fontSize: '0.82rem', fontWeight: 600, color: ACCENT, textDecoration: 'none', '&:hover': { color: ACCENT_HOVER, textDecoration: 'underline' } }}>Forgot password?</Box>
            </Box>

            {/* primary CTA — monochrome depth, not rainbow */}
            <ButtonBase type="submit" disabled={busy} sx={{
              width: '100%', py: 1.75, borderRadius: '11px', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700, color: '#fff',
              background: success ? 'linear-gradient(180deg, #1BA260, #15833F)' : 'linear-gradient(180deg, #1361A0, #0F4C81)',
              boxShadow: success ? '0 6px 16px -4px rgba(22,163,74,0.5)' : '0 6px 16px -4px rgba(15,76,129,0.5)',
              transition: 'transform .15s ease, box-shadow .2s ease, filter .15s ease',
              '&:hover': busy ? {} : { filter: 'brightness(1.06)', boxShadow: '0 10px 22px -6px rgba(15,76,129,0.55)', transform: 'translateY(-1px)' },
              '&:active': { transform: 'translateY(0) scale(0.99)' },
              '&.Mui-disabled': { color: '#fff', opacity: success ? 1 : 0.95 },
            }}>
              {success ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'si-check .4s ease forwards' }} /></svg>
                  <span>Signed in</span>
                </Stack>
              ) : loading ? (
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'si-spin .7s linear infinite' }} />
                  <span>Signing in…</span>
                </Stack>
              ) : 'Sign in'}
            </ButtonBase>

            {/* lock indicator near CTA */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6, mt: 1.5 }}>
              <Box sx={{ color: theme.textFaint, display: 'flex' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </Box>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: theme.textFaint }}>Protected with bank-grade encryption</Typography>
            </Box>

            {/* divider */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2.5 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: theme.divider }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or continue with</Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: theme.divider }} />
            </Box>

            {/* SECONDARY — social */}
            <ButtonBase onClick={() => { setError(''); setInfo("Google sign-in isn't enabled in this demo — please continue with email."); }} sx={{
              width: '100%', gap: 1, py: 1.25, borderRadius: '11px', border: `1.5px solid ${theme.inputBorder}`,
              bgcolor: theme.socialBg, color: theme.text, fontSize: '13.5px', fontWeight: 600, fontFamily: 'inherit',
              transition: 'all .18s ease',
              '&:hover': { bgcolor: theme.socialHover, borderColor: theme.socialHoverBorder, transform: 'translateY(-1px)' },
              '&:active': { transform: 'scale(0.99)' },
            }}>
              <GoogleIcon /> Continue with Google
            </ButtonBase>

            {/* trust badges */}
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
              {[
                { t: 'HIPAA Compliant', d: 'M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z M9 12l2 2 4-4' },
                { t: '256-bit SSL', d: 'M3 11h18v10H3zM7 11V7a5 5 0 0 1 10 0v4' },
              ].map((b) => (
                <Box key={b.t} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.1, py: 0.6, borderRadius: '8px', bgcolor: theme.pillBg }}>
                  <Box sx={{ color: theme.textMuted, display: 'flex' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={b.d} /></svg>
                  </Box>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: theme.textMuted }}>{b.t}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Typography sx={{ mt: 3, fontSize: '0.72rem', color: theme.textFaint, textAlign: 'center', position: 'relative', zIndex: 1 }}>
            By continuing, you agree to our{' '}
            <Box component="a" href="#" onClick={(e) => e.preventDefault()} sx={{ color: theme.textMuted, fontWeight: 600, textDecoration: 'none', '&:hover': { color: ACCENT } }}>Terms</Box>
            {' '}&{' '}
            <Box component="a" href="#" onClick={(e) => e.preventDefault()} sx={{ color: theme.textMuted, fontWeight: 600, textDecoration: 'none', '&:hover': { color: ACCENT } }}>Privacy Policy</Box>
          </Typography>
        </Box>
      </Box>
    </>
  );
}
