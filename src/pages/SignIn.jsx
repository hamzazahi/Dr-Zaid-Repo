import { useState } from 'react';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CalendarMonth as ScheduleIcon,
  MedicalServices as ClinicalIcon,
  ReceiptLong as BillingIcon,
  Insights as ReportsIcon,
  KeyboardCapslock as CapsIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

// ── Design tokens (per spec — Stripe/Clerk/Linear-grade palette) ─────────────
const C = {
  bg: '#F8FAFC',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  navy: '#0F172A',
  text: '#0F172A',
  textSecondary: '#64748B',
  textFaint: '#94A3B8',
  border: '#E2E8F0',
  card: '#FFFFFF',
  inputBg: '#F8FAFC',
  error: '#B42318',
  errorBorder: '#DC2626',
  errorBg: '#FEF2F2',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REMEMBER_EMAIL_KEY = 'dentsuite-remembered-email';

const KEYFRAMES = `
  @keyframes si-fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes si-fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes si-spin   { to { transform:rotate(360deg) } }
  @keyframes si-shake  {
    10%,90% { transform:translateX(-1px) } 20%,80% { transform:translateX(2px) }
    30%,50%,70% { transform:translateX(-5px) } 40%,60% { transform:translateX(5px) }
  }
`;

const FEATURES = [
  { icon: <ScheduleIcon sx={{ fontSize: 19 }} />, title: 'Front Desk', desc: 'Scheduling, recalls, online booking' },
  { icon: <ClinicalIcon sx={{ fontSize: 19 }} />, title: 'Clinical', desc: 'Patient records, imaging, prescriptions' },
  { icon: <BillingIcon sx={{ fontSize: 19 }} />, title: 'Billing', desc: 'Invoices, insurance, payments' },
  { icon: <ReportsIcon sx={{ fontSize: 19 }} />, title: 'Insights', desc: 'Reports and analytics' },
];

function Logo({ size = 40, glow = false }) {
  return (
    <Box sx={{
      width: size, height: size, borderRadius: '10px', flexShrink: 0,
      background: 'linear-gradient(180deg, #3B82F6, #2563EB)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: glow ? '0 0 44px 6px rgba(59,130,246,0.35), 0 0 0 1px rgba(255,255,255,0.08)' : 'none',
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="9.5" y="3" width="5" height="18" rx="2" fill="#fff" />
        <rect x="3" y="9.5" width="18" height="5" rx="2" fill="#fff" />
      </svg>
    </Box>
  );
}

// Static visible label above input (spec: visible labels, 14px), 48-52px input,
// generous focus ring, native input = full autofill/password-manager support.
function Field({ id, label, type, value, onChange, onBlur, onKeyEvent, error, autoComplete, placeholder, endAdornment, hint }) {
  const [focused, setFocused] = useState(false);
  const showError = Boolean(error);
  const borderColor = showError ? C.errorBorder : focused ? C.primary : C.border;

  return (
    <Box>
      <Box component="label" htmlFor={id} sx={{ display: 'block', fontSize: '14px', fontWeight: 600, color: C.text, mb: '7px' }}>
        {label}
      </Box>
      <Box sx={{ position: 'relative' }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onKeyDown={onKeyEvent}
          onKeyUp={onKeyEvent}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? `${id}-error` : undefined}
          style={{
            width: '100%', boxSizing: 'border-box', height: 50,
            padding: `0 ${endAdornment ? 48 : 16}px 0 16px`,
            fontSize: '15px', fontFamily: 'inherit', fontWeight: 500,
            color: C.text, background: focused ? '#fff' : C.inputBg,
            border: `1.5px solid ${borderColor}`, borderRadius: '10px',
            outline: 'none',
            boxShadow: focused ? (showError ? '0 0 0 4px rgba(220,38,38,0.10)' : '0 0 0 4px rgba(37,99,235,0.12)') : 'none',
            transition: 'border-color .2s ease-out, box-shadow .2s ease-out, background .2s ease-out',
          }}
        />
        {endAdornment && (
          <Box sx={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}>{endAdornment}</Box>
        )}
      </Box>
      <Box sx={{ minHeight: 18, mt: '5px' }}>
        {showError ? (
          <Typography id={`${id}-error`} role="alert" sx={{ fontSize: '12.5px', fontWeight: 500, color: C.errorBorder }}>{error}</Typography>
        ) : hint ? (
          <Typography sx={{ fontSize: '12.5px', fontWeight: 500, color: '#B45309', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CapsIcon sx={{ fontSize: 14 }} /> {hint}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export default function SignIn() {
  const { signIn } = useAuth();

  // Remember-email: initialise from the last "remembered" sign-in (lazy
  // initialisers — no effect needed, no cascading render).
  const [email, setEmail] = useState(() => {
    try { return window.localStorage.getItem(REMEMBER_EMAIL_KEY) || ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(() => {
    try { return Boolean(window.localStorage.getItem(REMEMBER_EMAIL_KEY)); } catch { return false; }
  });
  const [emailTouched, setEmailTouched] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const pwValid = password.length >= 6;
  const emailError = emailTouched && email.length > 0 && !emailValid ? 'Enter a valid email address.' : null;
  const pwError = pwTouched && password.length > 0 && !pwValid ? 'Must be at least 6 characters.' : null;

  const clearBanners = () => { setError(''); setInfo(''); };
  const triggerShake = () => { setShaking(false); requestAnimationFrame(() => setShaking(true)); };

  const handlePwKey = (e) => {
    if (typeof e.getModifierState === 'function') setCapsOn(e.getModifierState('CapsLock'));
  };

  const validate = () => {
    if (!email.trim()) return 'Email address is required.';
    if (!emailValid) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (!pwValid) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailTouched(true);
    setPwTouched(true);
    const err = validate();
    if (err) { setError(err); setInfo(''); triggerShake(); return; }

    clearBanners();
    setLoading(true);
    // Real authentication (Supabase when configured, demo accounts otherwise).
    const result = await signIn({ email: email.trim(), password, keepSignedIn: remember });
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      triggerShake();
      return;
    }
    try {
      if (remember) window.localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      else window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
    } catch { /* storage unavailable */ }
    setSuccess(true); // the auth state change swaps in the app shell
  };

  const busy = loading || success;
  const year = new Date().getFullYear();

  return (
    <>
      <style>{KEYFRAMES}</style>

      <Box sx={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>

        {/* ══ LEFT — brand panel (desktop 45%, tablet 40%, hidden on mobile) ══ */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' },
          width: { md: '40%', lg: '45%' },
          flexDirection: 'column',
          p: { md: '48px 48px', lg: '64px 72px' },
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(165deg, #0F172A 0%, #16233D 48%, #0C1425 100%)',
        }}>
          {/* subtle dot pattern */}
          <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="si-dots" width="26" height="26" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="1" fill="rgba(148,163,184,0.10)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#si-dots)" />
            </svg>
          </Box>
          {/* ambient radial glows */}
          <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(46% 38% at 12% 8%, rgba(37,99,235,0.22), transparent 70%), radial-gradient(50% 40% at 90% 95%, rgba(37,99,235,0.10), transparent 70%)' }} />

          {/* logo — top */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: 'relative', animation: 'si-fadeIn .4s ease-out both' }}>
            <Logo size={42} glow />
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>DentSuite</Typography>
          </Stack>

          {/* hero — vertically centered */}
          <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 6 }}>
            <Typography component="h1" sx={{
              color: '#fff', fontWeight: 700, maxWidth: 480,
              fontSize: { md: '2.1rem', lg: '2.6rem' }, lineHeight: 1.22, letterSpacing: '-0.03em', mb: 2.5,
              animation: 'si-fadeUp .45s ease-out .05s both',
            }}>
              Everything your dental practice needs in one platform.
            </Typography>
            <Typography sx={{
              color: 'rgba(203,213,225,0.75)', maxWidth: 480,
              fontSize: { md: '0.98rem', lg: '1.05rem' }, lineHeight: 1.75, mb: 5,
              animation: 'si-fadeUp .45s ease-out .12s both',
            }}>
              Appointments, clinical records, billing and reporting — connected in a single workspace built for modern clinics.
            </Typography>

            {/* feature cards — glass, 2×2 */}
            <Box sx={{
              display: 'grid', gridTemplateColumns: { md: '1fr', lg: '1fr 1fr' }, gap: '14px', maxWidth: 520,
              animation: 'si-fadeUp .45s ease-out .2s both',
            }}>
              {FEATURES.map(({ icon, title, desc }) => (
                <Box key={title} sx={{
                  display: 'flex', alignItems: 'flex-start', gap: 1.5,
                  p: '14px 16px', borderRadius: '14px',
                  bgcolor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                  transition: 'transform .25s ease-out, background .25s ease-out, border-color .25s ease-out',
                  '&:hover': { transform: 'translateY(-3px)', bgcolor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.16)' },
                }}>
                  <Box sx={{
                    width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                    bgcolor: 'rgba(37,99,235,0.18)', border: '1px solid rgba(59,130,246,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93C5FD',
                  }}>
                    {icon}
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#F1F5F9', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.3 }}>{title}</Typography>
                    <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontSize: '0.78rem', lineHeight: 1.5, mt: '3px' }}>{desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* footer */}
          <Typography sx={{ position: 'relative', color: 'rgba(148,163,184,0.5)', fontSize: '0.72rem' }}>
            © {year} DentSuite. All rights reserved.
          </Typography>
        </Box>

        {/* ══ RIGHT — authentication card ══ */}
        <Box sx={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          bgcolor: C.bg, p: { xs: '32px 16px', sm: '48px 40px' },
        }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            onAnimationEnd={() => setShaking(false)}
            sx={{
              width: '100%', maxWidth: 430,
              bgcolor: C.card, borderRadius: '18px', border: `1px solid ${C.border}`,
              p: { xs: '28px 22px', sm: '40px 38px' },
              boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.14)',
              animation: shaking ? 'si-shake .4s ease-out' : 'si-fadeUp .45s ease-out both',
            }}
          >
            {/* mobile brand (panel hidden below md) */}
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 4, display: { xs: 'flex', md: 'none' } }}>
              <Logo size={36} />
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: C.text }}>DentSuite</Typography>
            </Stack>

            <Typography component="h2" sx={{ fontWeight: 700, fontSize: { xs: '1.6rem', sm: '1.9rem' }, letterSpacing: '-0.03em', color: C.text, lineHeight: 1.2, mb: 1 }}>
              Welcome Back
            </Typography>
            <Typography sx={{ color: C.textSecondary, fontSize: '0.92rem', mb: 4 }}>
              Sign in to your clinic workspace.
            </Typography>

            {(error || info) && (
              <Box role="alert" sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1, mb: 3, px: 1.75, py: 1.4, borderRadius: '10px',
                bgcolor: error ? C.errorBg : '#EFF6FF',
                border: `1px solid ${error ? '#F5C6C6' : '#BFDBFE'}`,
                animation: 'si-fadeIn .25s ease-out both',
              }}>
                <Box sx={{ mt: '1px', flexShrink: 0, color: error ? C.errorBorder : C.primary, display: 'flex' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
                </Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: error ? C.error : '#1E3A8A' }}>
                  {error || info}
                </Typography>
              </Box>
            )}

            <Stack spacing={1}>
              <Field id="email" label="Email" type="email" autoComplete="email" placeholder="you@clinic.com"
                value={email} error={emailError}
                onChange={(e) => { setEmail(e.target.value); clearBanners(); }} onBlur={() => setEmailTouched(true)} />
              <Field id="password" label="Password" type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password"
                value={password} error={pwError}
                hint={capsOn ? 'Caps Lock is on' : ''}
                onKeyEvent={handlePwKey}
                onChange={(e) => { setPassword(e.target.value); clearBanners(); }} onBlur={() => setPwTouched(true)}
                endAdornment={
                  <ButtonBase onClick={() => setShowPw((p) => !p)} tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}
                    sx={{ p: 1.1, borderRadius: '8px', color: C.textFaint, transition: 'color .2s ease-out', '&:hover': { color: C.text } }}>
                    {showPw ? <VisibilityOff sx={{ fontSize: 19 }} /> : <Visibility sx={{ fontSize: 19 }} />}
                  </ButtonBase>
                } />
            </Stack>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5, mb: 3.5 }}>
              <Box component="label" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, cursor: 'pointer', userSelect: 'none' }}>
                <Box
                  role="checkbox"
                  aria-checked={remember}
                  tabIndex={0}
                  onClick={() => setRemember((r) => !r)}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setRemember((r) => !r); } }}
                  sx={{
                    width: 18, height: 18, borderRadius: '5px', flexShrink: 0,
                    border: `1.5px solid ${remember ? C.primary : '#CBD5E1'}`, bgcolor: remember ? C.primary : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .2s ease-out',
                    '&:focus-visible': { outline: 'none', boxShadow: '0 0 0 4px rgba(37,99,235,0.15)' },
                  }}>
                  {remember && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </Box>
                <Typography onClick={() => setRemember((r) => !r)} sx={{ fontSize: '0.84rem', fontWeight: 500, color: C.textSecondary }}>Remember me</Typography>
              </Box>
              <ButtonBase
                onClick={() => { setError(''); setInfo('Password resets are handled by your clinic administrator.'); }}
                sx={{ fontSize: '0.84rem', fontWeight: 600, color: C.primary, fontFamily: 'inherit', borderRadius: '4px', px: 0.5, transition: 'color .2s ease-out', '&:hover': { color: C.primaryHover, textDecoration: 'underline' } }}
              >
                Forgot password?
              </ButtonBase>
            </Box>

            <ButtonBase type="submit" disabled={busy} sx={{
              width: '100%', height: 48, borderRadius: '10px', fontFamily: 'inherit', fontSize: '16px', fontWeight: 700, color: '#fff',
              background: success ? 'linear-gradient(180deg, #22A85D, #15833F)' : 'linear-gradient(180deg, #3B82F6, #2563EB)',
              boxShadow: '0 1px 2px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.16)',
              transition: 'transform .2s ease-out, box-shadow .2s ease-out, filter .2s ease-out',
              '&:hover': busy ? {} : { filter: 'brightness(1.05)', transform: 'translateY(-1px)', boxShadow: '0 6px 16px -6px rgba(37,99,235,0.55)' },
              '&:active': busy ? {} : { transform: 'translateY(0) scale(0.985)' },
              '&:focus-visible': { outline: 'none', boxShadow: '0 0 0 4px rgba(37,99,235,0.25)' },
              '&.Mui-disabled': { color: '#fff', opacity: success ? 1 : 0.85 },
            }}>
              {success ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span>Signed in</span>
                </Stack>
              ) : loading ? (
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'si-spin .7s linear infinite' }} />
                  <span>Signing in…</span>
                </Stack>
              ) : 'Sign in'}
            </ButtonBase>
          </Box>

          <Typography sx={{ mt: 3.5, fontSize: '0.74rem', color: C.textFaint, textAlign: 'center' }}>
            © {year} DentSuite. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </>
  );
}
