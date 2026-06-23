import { useCallback, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { NotificationContext } from './NotificationContextCore';

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const notify = useCallback((message, severity = 'success') => {
    setNotification({ message, severity, key: Date.now() });
  }, []);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <Snackbar
        key={notification?.key}
        open={Boolean(notification)}
        autoHideDuration={3500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert
            onClose={handleClose}
            severity={notification.severity}
            variant="filled"
            sx={{ minWidth: 280, fontWeight: 600, fontSize: '0.875rem', borderRadius: '8px' }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </NotificationContext.Provider>
  );
};
