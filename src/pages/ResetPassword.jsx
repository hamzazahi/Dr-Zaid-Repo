import { useState } from 'react';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

// Shown when a user follows a password-reset email link (AuthContext sets
// `recovery`). They set a new password, then get sent back to sign in.
const C = {
  bg: '#F8FAFC', primary: '#2563EB', primaryHover: '#1D4ED8',
  text: '#0F172A', textSecondary: '#64748B', textFaint: '#94A3B8',
  border: '#E2E8F0', card: '#FFFFFF', inputBg: '#F8FAFC',
  error: '#B42318', errorBorder: '#DC2626', errorBg: '#FEF2F2',
  success: '#15833F', successBg: '#ECFDF5', successBorder: '#A7F3D0',
};

function Field({ id, label, value, onChange, type, autoComplete, endAdornment, error }) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? C.errorBorder : focused ? C.primary : C.border;
  return (
    <Box>
      <Box component="label" htmlFor={id} sx={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: C.text, mb: '6px' }}>{label}</Box>
      <Box sx={{ position: 'relative' }}>
        <input
          id={id} type={type} value={value} onChange={onChange} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', boxSizing: 'border-box', height: 46,
            padding: `0 ${endAdornment ? 44 : 14}px 0 14px`,
            fontSize: '14.5px', fontFamily: 'inherit', fontWeight: 500, color: C.text,
            background: focused ? '#fff' : C.inputBg, border: `1.5px solid ${borderColor}`,
            borderRadius: '10px', outline: 'none',
            boxShadow: focused ? '0 0 0 4px rgba(37,99,235,0.12)' : 'none',
            transition: 'border-color .2s, box-shadow .2s, background .2s',
          }}
        />
        {endAdornment && <Box sx={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}>{endAdornment}</Box>}
      </Box>
      <Box sx={{ minHeight: 18, mt: '5px' }}>
        {error && <Typography role="alert" sx={{ fontSize: '12.5px', fontWeight: 500, color: C.errorBorder }}>{error}</Typography>}
      </Box>
    </Box>
  );
}

export default function ResetPassword() {
  const { completePasswordReset } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pwValid = password.length >= 8;
  const matches = password === confirm;
  const pwError = touched && password.length > 0 && !pwValid ? 'Use at least 8 characters.' : null;
  const confirmError = touched && confirm.length > 0 && !matches ? 'Passwords do not match.' : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    if (!pwValid) { setError('Password must be at least 8 characters.'); return; }
    if (!matches) { setError('The two passwords do not match.'); return; }
    setLoading(true);
    const result = await completePasswordReset(password);
    if (!result.ok) { setLoading(false); setError(result.error); return; }
    setDone(true);
    // AuthContext cleared the recovery session; return to sign in shortly.
    setTimeout(() => { window.location.href = window.location.origin; }, 2200);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: C.bg, p: 2, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{
        width: '100%', maxWidth: 416, bgcolor: C.card, borderRadius: '16px', border: `1px solid ${C.border}`,
        p: { xs: '26px 22px', sm: '36px 36px' }, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.14)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 3 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '9px', background: 'linear-gradient(180deg,#3B82F6,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9.5" y="3" width="5" height="18" rx="2" fill="#fff" /><rect x="3" y="9.5" width="18" height="5" rx="2" fill="#fff" /></svg>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: C.text }}>DentSuite</Typography>
        </Stack>

        {done ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: C.successBg, border: `1px solid ${C.successBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke={C.success} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: C.text, mb: 0.5 }}>Password updated</Typography>
            <Typography sx={{ fontSize: '0.88rem', color: C.textSecondary }}>Redirecting you to sign in with your new password…</Typography>
          </Box>
        ) : (
          <>
            <Typography component="h1" sx={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', color: C.text, mb: 0.75 }}>Set a new password</Typography>
            <Typography sx={{ color: C.textSecondary, fontSize: '0.9rem', mb: 3 }}>Choose a strong password for your DentSuite account.</Typography>

            {error && (
              <Box role="alert" sx={{ mb: 2.5, px: 1.75, py: 1.4, borderRadius: '10px', bgcolor: C.errorBg, border: '1px solid #F5C6C6' }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: C.error }}>{error}</Typography>
              </Box>
            )}

            <Field id="new-password" label="New password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              value={password} error={pwError} onChange={(e) => { setPassword(e.target.value); setError(''); }}
              endAdornment={
                <ButtonBase onClick={() => setShowPw((p) => !p)} tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}
                  sx={{ p: 1.1, borderRadius: '8px', color: C.textFaint, '&:hover': { color: C.text } }}>
                  {showPw ? <VisibilityOff sx={{ fontSize: 19 }} /> : <Visibility sx={{ fontSize: 19 }} />}
                </ButtonBase>
              } />
            <Field id="confirm-password" label="Confirm new password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              value={confirm} error={confirmError} onChange={(e) => { setConfirm(e.target.value); setError(''); }} />

            <ButtonBase type="submit" disabled={loading} sx={{
              mt: 1, width: '100%', height: 48, borderRadius: '10px', fontFamily: 'inherit', fontSize: '16px', fontWeight: 700, color: '#fff',
              background: 'linear-gradient(180deg, #3B82F6, #2563EB)', boxShadow: '0 1px 2px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.16)',
              transition: 'transform .2s, box-shadow .2s, filter .2s',
              '&:hover': loading ? {} : { filter: 'brightness(1.05)', transform: 'translateY(-1px)', boxShadow: '0 6px 16px -6px rgba(37,99,235,0.55)' },
              '&:focus-visible': { outline: 'none', boxShadow: '0 0 0 4px rgba(37,99,235,0.25)' },
              '&.Mui-disabled': { color: '#fff', opacity: 0.85 },
            }}>
              {loading ? (
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />
                  <span>Updating…</span>
                </Stack>
              ) : 'Update password'}
            </ButtonBase>
            <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
          </>
        )}
      </Box>
    </Box>
  );
}
