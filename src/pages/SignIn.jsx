import { useState } from 'react';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const ACCENT = '#0F4C81';
const ACCENT_HOVER = '#0A3254';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLORS = {
  bg: '#F4F6FA',
  card: '#FFFFFF',
  cardBorder: '#E5E9F0',
  text: '#0F172A',
  textMuted: '#5A6577',
  textFaint: '#94A0B0',
  inputBg: '#FBFCFE',
  inputBorder: '#DFE4EC',
  error: '#B42318',
  errorBg: '#FEF2F2',
  errorBorder: '#F5C6C6',
};

const KEYFRAMES = `
  @keyframes si-fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
  @keyframes si-spin   { to { transform:rotate(360deg) } }
  @keyframes si-shake  {
    10%,90% { transform:translateX(-1px) } 20%,80% { transform:translateX(2px) }
    30%,50%,70% { transform:translateX(-5px) } 40%,60% { transform:translateX(5px) }
  }
  /* Floating label driven by CSS so it also floats for BROWSER-AUTOFILLED values
     (autofill doesn't update React state, which would leave the label overlapping). */
  .si-field-label { position:absolute; left:14px; pointer-events:none; transition:all .16s ease;
    top:50%; transform:translateY(-50%); font-size:14px; font-weight:500; }
  .si-field-input:focus ~ .si-field-label,
  .si-field-input:not(:placeholder-shown) ~ .si-field-label,
  .si-field-input:-webkit-autofill ~ .si-field-label {
    top:7px; transform:none; font-size:11px; font-weight:600; letter-spacing:.02em; }
`;

function Logo({ size = 36 }) {
  return (
    <Box sx={{
      width: size, height: size, borderRadius: '9px', flexShrink: 0, bgcolor: ACCENT,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <rect x="9.5" y="3" width="5" height="18" rx="2" fill="#fff" />
        <rect x="3" y="9.5" width="18" height="5" rx="2" fill="#fff" />
      </svg>
    </Box>
  );
}

function Field({ id, label, type, value, onChange, onBlur, error, autoComplete, endAdornment }) {
  const [focused, setFocused] = useState(false);
  const showError = Boolean(error);
  const borderColor = showError ? '#DC2626' : focused ? ACCENT : COLORS.inputBorder;

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
            padding: `21px ${endAdornment ? 44 : 14}px 7px 14px`,
            fontSize: '14px', fontFamily: 'inherit', fontWeight: 500,
            color: COLORS.text, background: COLORS.inputBg,
            border: `1.5px solid ${borderColor}`, borderRadius: '8px',
            outline: 'none',
            boxShadow: focused ? (showError ? '0 0 0 3px rgba(220,38,38,0.12)' : `0 0 0 3px ${ACCENT}1A`) : 'none',
            transition: 'border-color .16s ease, box-shadow .16s ease',
          }}
        />
        <Box component="label" htmlFor={id} className="si-field-label"
          sx={{ color: showError ? '#DC2626' : focused ? ACCENT : COLORS.textMuted }}>
          {label}
        </Box>
        {endAdornment && (
          <Box sx={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}>{endAdornment}</Box>
        )}
      </Box>
      <Box sx={{ height: 14, mt: '4px', ml: '2px' }}>
        {showError && <Typography sx={{ fontSize: '11.5px', fontWeight: 500, color: '#DC2626' }}>{error}</Typography>}
      </Box>
    </Box>
  );
}

export default function SignIn() {
  const { signIn, verifyCredentials } = useAuth();

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
      setTimeout(() => signIn({ email: email.trim(), password, keepSignedIn: remember }), 600);
    }, 800);
  };

  const busy = loading || success;

  return (
    <>
      <style>{KEYFRAMES}</style>

      <Box sx={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        bgcolor: COLORS.bg, p: '24px 16px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        {/* Brand */}
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 3, animation: 'si-fadeUp .4s ease both' }}>
          <Logo size={34} />
          <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.02em', color: COLORS.text }}>
            DentSuite
          </Typography>
        </Stack>

        {/* Card */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          onAnimationEnd={() => setShaking(false)}
          sx={{
            width: '100%', maxWidth: 392,
            bgcolor: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: '12px',
            p: { xs: '24px 20px', sm: '32px' },
            boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 8px 24px -12px rgba(15,23,42,0.10)',
            animation: shaking ? 'si-shake .4s ease' : 'si-fadeUp .4s ease both',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', color: COLORS.text, mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography sx={{ color: COLORS.textMuted, fontSize: '0.85rem', mb: 3 }}>
            Use your clinic account to continue.
          </Typography>

          {(error || info) && (
            <Box sx={{
              display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2.5, px: 1.5, py: 1.25, borderRadius: '8px',
              bgcolor: error ? COLORS.errorBg : '#EAF2FB',
              border: `1px solid ${error ? COLORS.errorBorder : '#C3DCF3'}`,
            }}>
              <Box sx={{ mt: '1px', flexShrink: 0, color: error ? '#DC2626' : ACCENT, display: 'flex' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
              </Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: error ? COLORS.error : '#0A3254' }}>
                {error || info}
              </Typography>
            </Box>
          )}

          <Stack spacing={0.5}>
            <Field id="email" label="Email address" type="email" autoComplete="email"
              value={email} error={emailError}
              onChange={(e) => { setEmail(e.target.value); clearBanners(); }} onBlur={() => setEmailTouched(true)} />
            <Field id="password" label="Password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
              value={password} error={pwError}
              onChange={(e) => { setPassword(e.target.value); clearBanners(); }} onBlur={() => setPwTouched(true)}
              endAdornment={
                <ButtonBase onClick={() => setShowPw((p) => !p)} tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}
                  sx={{ p: 1, borderRadius: '6px', color: COLORS.textMuted, '&:hover': { color: COLORS.text } }}>
                  {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                </ButtonBase>
              } />
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5, mb: 2.5 }}>
            <Box onClick={() => setRemember((r) => !r)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, cursor: 'pointer', userSelect: 'none' }}>
              <Box sx={{
                width: 17, height: 17, borderRadius: '4px', flexShrink: 0,
                border: `1.5px solid ${remember ? ACCENT : COLORS.inputBorder}`, bgcolor: remember ? ACCENT : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s ease',
              }}>
                {remember && <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: COLORS.textMuted }}>Remember me</Typography>
            </Box>
            <ButtonBase
              onClick={() => { setError(''); setInfo('Password resets are handled by your clinic administrator.'); }}
              sx={{ fontSize: '0.8rem', fontWeight: 600, color: ACCENT, fontFamily: 'inherit', borderRadius: '4px', '&:hover': { color: ACCENT_HOVER, textDecoration: 'underline' } }}
            >
              Forgot password?
            </ButtonBase>
          </Box>

          <ButtonBase type="submit" disabled={busy} sx={{
            width: '100%', py: 1.5, borderRadius: '8px', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700, color: '#fff',
            bgcolor: success ? '#15833F' : ACCENT,
            transition: 'background-color .15s ease',
            '&:hover': busy ? {} : { bgcolor: ACCENT_HOVER },
            '&.Mui-disabled': { color: '#fff', opacity: 0.9 },
          }}>
            {success ? 'Signed in' : loading ? (
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box sx={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'si-spin .7s linear infinite' }} />
                <span>Signing in…</span>
              </Stack>
            ) : 'Sign in'}
          </ButtonBase>
        </Box>

        {/* Footer */}
        <Typography sx={{ mt: 3, fontSize: '0.75rem', color: COLORS.textFaint, textAlign: 'center' }}>
          © {new Date().getFullYear()} DentSuite · Clinic Management System
        </Typography>
      </Box>
    </>
  );
}
