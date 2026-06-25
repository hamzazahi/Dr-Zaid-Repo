import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { colors } from '../theme/theme';

const TABS = [
  { id: 'clinic',   label: 'Clinic Info',    icon: <BusinessIcon fontSize="small" /> },
  { id: 'notif',    label: 'Notifications',  icon: <NotificationsIcon fontSize="small" /> },
  { id: 'security', label: 'Security',       icon: <SecurityIcon fontSize="small" /> },
  { id: 'team',     label: 'Team',           icon: <PeopleIcon fontSize="small" /> },
];

function SectionHeader({ icon, title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 0.5 }}>
        <Box sx={{ color: colors.primary, display: 'flex' }}>{icon}</Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: colors.textPrimary }}>{title}</Typography>
      </Stack>
      {subtitle && <Typography variant="caption" sx={{ color: colors.textSecondary }}>{subtitle}</Typography>}
      <Divider sx={{ mt: 1.5 }} />
    </Box>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: `1px solid ${colors.borderLight}` }}>
      <Box>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        {description && <Typography variant="caption" sx={{ color: colors.textSecondary }}>{description}</Typography>}
      </Box>
      <Switch checked={checked} onChange={onChange} size="small" />
    </Box>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('clinic');
  const [saved, setSaved] = useState('');

  const [clinicSettings, setClinicSettings] = useState({
    clinicName: 'DentSuite',
    email: 'info@drzaiddental.com',
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

  const handleSave = (section) => {
    setSaved(section);
    setTimeout(() => setSaved(''), 2500);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Settings & Configuration</Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Manage clinic preferences, security, and team access.</Typography>
      </Box>

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <Box key={tab.id} onClick={() => setActiveTab(tab.id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.5, cursor: 'pointer', bgcolor: active ? colors.primaryAlpha8 : 'transparent', borderLeft: active ? `3px solid ${colors.primary}` : '3px solid transparent', color: active ? colors.primary : colors.textSecondary, transition: 'all 0.15s', '&:hover': { bgcolor: active ? colors.primaryAlpha8 : colors.surfaceAlt } }}>
                  <Box sx={{ display: 'flex', fontSize: 18 }}>{tab.icon}</Box>
                  <Typography variant="body2" fontWeight={active ? 700 : 500}>{tab.label}</Typography>
                </Box>
              );
            })}
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          {activeTab === 'clinic' && (
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: 3 }}>
                <SectionHeader icon={<BusinessIcon />} title="Clinic Information" subtitle="Basic information about your practice." />
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Clinic Name" fullWidth value={clinicSettings.clinicName} onChange={(e) => setClinicSettings((p) => ({ ...p, clinicName: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="License Number" fullWidth value={clinicSettings.licenseNumber} onChange={(e) => setClinicSettings((p) => ({ ...p, licenseNumber: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Email Address" type="email" fullWidth value={clinicSettings.email} onChange={(e) => setClinicSettings((p) => ({ ...p, email: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Phone Number" fullWidth value={clinicSettings.phone} onChange={(e) => setClinicSettings((p) => ({ ...p, phone: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Clinic Address" fullWidth value={clinicSettings.address} onChange={(e) => setClinicSettings((p) => ({ ...p, address: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="City" fullWidth value={clinicSettings.city} onChange={(e) => setClinicSettings((p) => ({ ...p, city: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Country" fullWidth value={clinicSettings.country} onChange={(e) => setClinicSettings((p) => ({ ...p, country: e.target.value }))} />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSave('clinic')} sx={{ fontWeight: 700 }}>Save Changes</Button>
                  {saved === 'clinic' && (
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <CheckIcon sx={{ fontSize: 16, color: colors.success }} />
                      <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600 }}>Saved successfully</Typography>
                    </Stack>
                  )}
                </Box>
              </Box>
            </Card>
          )}

          {activeTab === 'notif' && (
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: 3 }}>
                <SectionHeader icon={<NotificationsIcon />} title="Notification Preferences" subtitle="Choose which alerts and reminders you want to receive." />
                <ToggleRow label="Appointment Reminders" description="Send reminders before scheduled appointments" checked={notifications.appointmentReminders} onChange={() => setNotifications((p) => ({ ...p, appointmentReminders: !p.appointmentReminders }))} />
                <ToggleRow label="Payment Notifications" description="Notify about new payments and overdue invoices" checked={notifications.paymentNotifications} onChange={() => setNotifications((p) => ({ ...p, paymentNotifications: !p.paymentNotifications }))} />
                <ToggleRow label="Inventory Alerts" description="Notify when items fall below minimum stock level" checked={notifications.inventoryAlerts} onChange={() => setNotifications((p) => ({ ...p, inventoryAlerts: !p.inventoryAlerts }))} />
                <ToggleRow label="System Notifications" description="System alerts, maintenance, and updates" checked={notifications.systemNotifications} onChange={() => setNotifications((p) => ({ ...p, systemNotifications: !p.systemNotifications }))} />
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSave('notif')} sx={{ fontWeight: 700 }}>Save Preferences</Button>
                  {saved === 'notif' && (
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <CheckIcon sx={{ fontSize: 16, color: colors.success }} />
                      <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600 }}>Saved</Typography>
                    </Stack>
                  )}
                </Box>
              </Box>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: 3 }}>
                <SectionHeader icon={<SecurityIcon />} title="Security & Privacy" subtitle="Control authentication, session behavior, and data backups." />
                <ToggleRow label="Two-Factor Authentication" description="Require 2FA for all user logins" checked={security.twoFactorAuth} onChange={() => setSecurity((p) => ({ ...p, twoFactorAuth: !p.twoFactorAuth }))} />
                <ToggleRow label="Automatic Backups" description="Daily automated data backups" checked={security.autoBackup} onChange={() => setSecurity((p) => ({ ...p, autoBackup: !p.autoBackup }))} />
                <Box sx={{ mt: 2.5, maxWidth: 280 }}>
                  <TextField type="number" label="Session Timeout (minutes)" value={security.sessionTimeout} onChange={(e) => setSecurity((p) => ({ ...p, sessionTimeout: parseInt(e.target.value) || 30 }))} fullWidth size="small" helperText="Users will be signed out after this period of inactivity." />
                </Box>
                <Alert severity="info" icon={<SecurityIcon fontSize="small" />} sx={{ mt: 2.5, borderRadius: '8px' }}>
                  All patient data is encrypted at rest using AES-256.
                </Alert>
                <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSave('security')} sx={{ fontWeight: 700 }}>Save Settings</Button>
                  {saved === 'security' && (
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <CheckIcon sx={{ fontSize: 16, color: colors.success }} />
                      <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600 }}>Saved</Typography>
                    </Stack>
                  )}
                </Box>
              </Box>
            </Card>
          )}

          {activeTab === 'team' && (
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: 3 }}>
                <SectionHeader icon={<PeopleIcon />} title="Team Management" subtitle="Manage staff accounts and access levels." />
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                    <PeopleIcon sx={{ fontSize: 26, color: colors.textLight }} />
                  </Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Team management coming soon</Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>User roles, permissions, and staff profiles will be available here.</Typography>
                </Box>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
