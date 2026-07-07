import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { WarningAmber as WarnIcon } from '@mui/icons-material';
import { colors } from '../../theme/theme';

// Shared confirmation for destructive actions. Render with `open` +
// `onConfirm`/`onClose`; the dialog closes itself after confirming.
export default function ConfirmDialog({
  open,
  title = 'Delete this record?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <WarnIcon color="error" sx={{ fontSize: 22 }} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: colors.textSecondary }}>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
        <Button onClick={() => { onConfirm?.(); onClose?.(); }} variant="contained" color="error" sx={{ fontWeight: 700 }}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
