import { Box, Card, CardContent, Typography, Stack, TextField, Button, Switch, FormControlLabel, Grid, Divider, Alert } from '@mui/material';
import { useState } from 'react';
import { colors } from '../theme/theme';
import { Save as SaveIcon, Build as BuildIcon, Security as SecurityIcon, Notifications as NotificationsIcon, People as PeopleIcon } from '@mui/icons-material';

export default function Settings() {
  const [clinicSettings, setClinicSettings] = useState({
    clinicName: 'Dr. Zaid Dental Clinic',
    email: 'info@draiddental.com',
    phone: '+92-300-1234567',
    address: '123 Main Street, Karachi',
    city: 'Karachi',
    country: 'Pakistan',
    licenseNumber: 'DEN-2024-001',
  });

  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    paymentNotifications: true,
    inventoryAlerts: true,
    systemNotifications: true,
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    autoBackup: true,
  });

  const handleClinicChange = (field, value) => {
    setClinicSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSecurityChange = (field, value) => {
    setSecurity(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary }}>
            Settings & Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.5 }}>
            Manage clinic settings, security, and preferences
          </Typography>
        </Box>
      </Stack>

      {/* Clinic Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <BuildIcon sx={{ color: colors.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Clinic Information
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Clinic Name"
                fullWidth
                value={clinicSettings.clinicName}
                onChange={(e) => handleClinicChange('clinicName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={clinicSettings.email}
                onChange={(e) => handleClinicChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={clinicSettings.phone}
                onChange={(e) => handleClinicChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="License Number"
                fullWidth
                value={clinicSettings.licenseNumber}
                onChange={(e) => handleClinicChange('licenseNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                value={clinicSettings.address}
                onChange={(e) => handleClinicChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                fullWidth
                value={clinicSettings.city}
                onChange={(e) => handleClinicChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country"
                fullWidth
                value={clinicSettings.country}
                onChange={(e) => handleClinicChange('country', e.target.value)}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mt: 2, bgcolor: colors.primary }}
          >
            Save Clinic Information
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <NotificationsIcon sx={{ color: colors.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={notifications.appointmentReminders}
                  onChange={() => handleNotificationChange('appointmentReminders')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Appointment Reminders
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    Send reminders before scheduled appointments
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notifications.paymentNotifications}
                  onChange={() => handleNotificationChange('paymentNotifications')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Payment Notifications
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    Notify about new payments and invoices
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notifications.inventoryAlerts}
                  onChange={() => handleNotificationChange('inventoryAlerts')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Inventory Alerts
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    Notify when items are low in stock
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notifications.systemNotifications}
                  onChange={() => handleNotificationChange('systemNotifications')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    System Notifications
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    System alerts and updates
                  </Typography>
                </Box>
              }
            />
          </Stack>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mt: 2, bgcolor: colors.primary }}
          >
            Save Notification Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <SecurityIcon sx={{ color: colors.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Security & Privacy
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={security.twoFactorAuth}
                  onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Two-Factor Authentication
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    Require 2FA for all user logins
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={security.autoBackup}
                  onChange={(e) => handleSecurityChange('autoBackup', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Automatic Backups
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    Daily automated data backups
                  </Typography>
                </Box>
              }
            />
            <TextField
              type="number"
              label="Session Timeout (minutes)"
              value={security.sessionTimeout}
              onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
              sx={{ maxWidth: 300 }}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              Your data is encrypted and secured with industry-standard protocols.
            </Alert>
          </Stack>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mt: 2, bgcolor: colors.primary }}
          >
            Save Security Settings
          </Button>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <PeopleIcon sx={{ color: colors.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Team Management
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2 }}>
            Manage team members and their access levels
          </Typography>
          <Button
            variant="outlined"
            sx={{ color: colors.primary, borderColor: colors.primary }}
          >
            Manage Team Members
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
