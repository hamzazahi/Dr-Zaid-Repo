import { createContext, useCallback, useContext, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used inside NotificationProvider');
  return ctx;
};

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
