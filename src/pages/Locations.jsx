import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as LocationIcon,
  CheckCircle as ActiveIcon,
  Chair as ChairIcon,
  Groups as StaffIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Place as PlaceIcon,
  Schedule as HoursIcon,
  Person as ManagerIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { colors } from '../theme/theme';

const LOCATION_COLORS = ['#0F4C81', '#0D9488', '#7C3AED', '#D97706', '#DB2777', '#059669'];

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

function StatusPill({ status }) {
  const active = status === 'Active';
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: active ? '#ECFDF5' : '#F1F5F9' }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: active ? '#10B981' : '#94A3B8' }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: active ? '#065F46' : '#475569' }}>{status}</Typography>
    </Box>
  );
}

function DetailRow({ icon, text }) {
  if (!text) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
      <Box sx={{ color: colors.textLight, display: 'flex', mt: '1px', flexShrink: 0 }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>{text}</Typography>
    </Box>
  );
}

const EMPTY_FORM = { name: '', address: '', phone: '', email: '', manager: '', chairs: '2', openHours: '', color: LOCATION_COLORS[0] };

export default function Locations() {
  const { locations, primaryLocationId, addLocation, updateLocationStatus, staff, assignStaffLocation } = useClinicData();
  const { notify } = useNotification();

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // Staff without an explicit locationId belong to the primary location.
  const effectiveLocationId = (member) => member.locationId || primaryLocationId;

  const staffCountByLocation = useMemo(() => {
    const map = {};
    staff.forEach((s) => {
      const loc = s.locationId || primaryLocationId;
      map[loc] = (map[loc] || 0) + 1;
    });
    return map;
  }, [staff, primaryLocationId]);

  const stats = useMemo(() => ({
    total: locations.length,
    active: locations.filter((l) => l.status === 'Active').length,
    chairs: locations.reduce((sum, l) => sum + (Number(l.chairs) || 0), 0),
    staff: staff.length,
  }), [locations, staff]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Please enter a location name.'); return; }
    if (!form.address.trim()) { setFormError('Please enter an address.'); return; }
    const loc = addLocation(form);
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`Location "${loc.name}" added.`, 'success');
  };

  const toggleStatus = (loc) => {
    const next = loc.status === 'Active' ? 'Inactive' : 'Active';
    updateLocationStatus(loc.id, next);
    notify(`${loc.name} marked ${next}.`, 'success');
  };

  const handleAssign = (member, locationId) => {
    assignStaffLocation(member.id, locationId);
    const loc = locations.find((l) => l.id === locationId);
    notify(`${member.name} assigned to ${loc?.name || 'location'}.`, 'success');
  };

  const statCards = [
    { label: 'Locations',    value: stats.total,  icon: <LocationIcon />, bg: '#EEF2FF', color: colors.primary },
    { label: 'Active Sites', value: stats.active, icon: <ActiveIcon />,   bg: '#ECFDF5', color: colors.success },
    { label: 'Total Chairs', value: stats.chairs, icon: <ChairIcon />,    bg: '#E0F2FE', color: '#0369A1' },
    { label: 'Team Members', value: stats.staff,  icon: <StaffIcon />,    bg: '#FDF4FF', color: '#A21CAF' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Locations</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Manage clinic branches and assign your team across sites.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          New Location
        </Button>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2}>
        {statCards.map((card) => (
          <Grid item xs={6} md={3} key={card.label}>
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>{card.label}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: colors.textPrimary, letterSpacing: '-0.02em', mt: 0.25 }}>{card.value}</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: card.bg, color: card.color, display: 'flex', fontSize: 22 }}>{card.icon}</Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Location cards */}
      <Grid container spacing={2.5}>
        {locations.map((loc) => (
          <Grid item xs={12} md={6} key={loc.id}>
            <Card sx={{ borderRadius: '12px', overflow: 'hidden', height: '100%', opacity: loc.status === 'Active' ? 1 : 0.7 }}>
              <Box sx={{ height: 5, bgcolor: loc.color }} />
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: `${loc.color}18`, color: loc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LocationIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography fontWeight={800} sx={{ fontSize: '0.95rem' }}>{loc.name}</Typography>
                        {loc.isPrimary && <Chip label="Primary" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#EEF2FF', color: colors.primary }} />}
                      </Box>
                      <StatusPill status={loc.status} />
                    </Box>
                  </Box>
                  <Button size="small" onClick={() => toggleStatus(loc)} sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'none', color: loc.status === 'Active' ? colors.textSecondary : colors.success, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {loc.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </Box>

                <DetailRow icon={<PlaceIcon sx={{ fontSize: 15 }} />} text={loc.address} />
                <DetailRow icon={<PhoneIcon sx={{ fontSize: 15 }} />} text={loc.phone} />
                <DetailRow icon={<EmailIcon sx={{ fontSize: 15 }} />} text={loc.email} />
                <DetailRow icon={<ManagerIcon sx={{ fontSize: 15 }} />} text={loc.manager ? `Managed by ${loc.manager}` : ''} />
                <DetailRow icon={<HoursIcon sx={{ fontSize: 15 }} />} text={loc.openHours} />

                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, pt: 1.5, borderTop: `1px solid ${colors.borderLight}` }}>
                  <Chip icon={<ChairIcon sx={{ fontSize: 14 }} />} label={`${loc.chairs} chair${loc.chairs !== 1 ? 's' : ''}`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                  <Chip icon={<StaffIcon sx={{ fontSize: 14 }} />} label={`${staffCountByLocation[loc.id] || 0} staff`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Staff assignment */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Staff Assignment</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>Assign each team member to a branch. Unassigned staff default to the primary location.</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Team Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ width: 260 }}>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarColor(member.name) }}>
                        {member.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{member.name}</Typography>
                        {member.specialty && <Typography variant="caption" sx={{ color: colors.textSecondary }}>{member.specialty}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{member.role}</Typography></TableCell>
                  <TableCell><StatusPill status={member.status === 'Active' ? 'Active' : 'Inactive'} /></TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={effectiveLocationId(member)}
                      onChange={(e) => handleAssign(member, e.target.value)}
                      fullWidth
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.82rem', fontWeight: 600 } }}
                    >
                      {locations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id} sx={{ fontSize: '0.82rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: loc.color }} />
                            {loc.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* New location dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Add Location
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Fields marked * are required.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField label="Location Name" name="name" value={form.name} onChange={handleChange} fullWidth required placeholder="e.g. Clifton Branch" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Chairs" name="chairs" type="number" value={form.chairs} onChange={handleChange} fullWidth inputProps={{ min: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Address" name="address" value={form.address} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Branch Manager" name="manager" value={form.manager} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Opening Hours" name="openHours" value={form.openHours} onChange={handleChange} fullWidth placeholder="e.g. Mon–Sat · 9 AM – 8 PM" />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.75 }}>Accent Colour</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {LOCATION_COLORS.map((c) => (
                    <Box key={c} onClick={() => setForm((prev) => ({ ...prev, color: c }))} sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: c, cursor: 'pointer', border: form.color === c ? `3px solid ${colors.textPrimary}` : '3px solid transparent', transition: 'border 0.15s' }} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Add Location</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
