import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
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
  Groups as GroupsIcon,
  MedicalServices as DentistIcon,
  CheckCircle as ActiveIcon,
  EventBusy as LeaveIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';

const ROLES = ['Dentist', 'Dental Hygienist', 'Dental Assistant', 'Receptionist', 'Lab Technician', 'Administrator'];
const STATUSES = ['Active', 'On Leave', 'Inactive'];

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const ROLE_CFG = {
  Dentist:            { bg: '#EEF2FF', color: '#1D4ED8' },
  'Dental Hygienist': { bg: '#ECFEFF', color: '#0E7490' },
  'Dental Assistant': { bg: '#F0FDF4', color: '#15803D' },
  Receptionist:       { bg: '#FFF7ED', color: '#C2410C' },
  'Lab Technician':   { bg: '#FAF5FF', color: '#7E22CE' },
  Administrator:      { bg: '#F1F5F9', color: '#475569' },
};

const STATUS_CFG = {
  Active:     { bg: '#F0FDF4', color: '#065F46', dot: '#10B981' },
  'On Leave': { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Inactive:   { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
};

function RoleChip({ role }) {
  const c = ROLE_CFG[role] || ROLE_CFG.Administrator;
  return (
    <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: c.color }}>{role}</Typography>
    </Box>
  );
}

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Active;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

const EMPTY_FORM = { name: '', role: 'Receptionist', specialty: '', email: '', phone: '', status: 'Active' };

export default function Staff() {
  const { staff, addStaff, updateStaffStatus } = useClinicData();
  const { notify } = useNotification();

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuMember, setMenuMember] = useState(null);

  const stats = useMemo(() => ({
    total: staff.length,
    dentists: staff.filter((s) => s.role === 'Dentist').length,
    active: staff.filter((s) => s.status === 'Active').length,
    leave: staff.filter((s) => s.status === 'On Leave').length,
  }), [staff]);

  const filtered = useMemo(() => staff.filter((s) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || s.name.toLowerCase().includes(qLow) || s.email?.toLowerCase().includes(qLow) || s.specialty?.toLowerCase().includes(qLow);
    const matchRole = roleFilter === 'All' || s.role === roleFilter;
    return matchQ && matchRole;
  }), [staff, q, roleFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Staff name is required.'); return; }
    addStaff(form);
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`${form.name} added to the team.`, 'success');
  };

  const openMenu = (e, member) => { setMenuAnchor(e.currentTarget); setMenuMember(member); };
  const closeMenu = () => { setMenuAnchor(null); setMenuMember(null); };
  const setStatus = (status) => {
    updateStaffStatus(menuMember.id, status);
    notify(`${menuMember.name} marked ${status}.`, 'success');
    closeMenu();
  };

  const statCards = [
    { label: 'Total Staff', value: stats.total,    icon: <GroupsIcon />,  bg: '#EEF2FF', color: colors.primary },
    { label: 'Dentists',    value: stats.dentists, icon: <DentistIcon />, bg: '#E0F2FE', color: '#0369A1' },
    { label: 'Active',      value: stats.active,   icon: <ActiveIcon />,  bg: '#ECFDF5', color: colors.success },
    { label: 'On Leave',    value: stats.leave,    icon: <LeaveIcon />,   bg: '#FFFBEB', color: '#D97706' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Staff &amp; Team</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Manage clinic staff, roles, and availability. Dentists here power every dentist dropdown.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          Add Staff
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

      {/* Filters */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2, py: 1.75, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField placeholder="Search name, email, specialty…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 170 }}>
            <MenuItem value="All">All Roles</MenuItem>
            {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} member{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Team Directory</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{staff.length} members total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Specialty</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <GroupsIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || roleFilter !== 'All' ? 'No staff match your search' : 'No staff members yet'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || roleFilter !== 'All' ? 'Try adjusting your filters.' : 'Click "Add Staff" to add the first member.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.74rem', fontWeight: 700, bgcolor: avatarColor(member.name) }}>
                          {member.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{member.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><RoleChip role={member.role} /></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{member.specialty || '—'}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{member.email || '—'}</Typography>
                      <Typography variant="caption" sx={{ color: colors.textSecondary }}>{member.phone || ''}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{member.joinedDate ? formatDate(member.joinedDate) : '—'}</Typography></TableCell>
                    <TableCell><StatusPill status={member.status} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => openMenu(e, member)}><MoreIcon sx={{ fontSize: 18 }} /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Status menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        {STATUSES.map((s) => (
          <MenuItem key={s} onClick={() => setStatus(s)} disabled={menuMember?.status === s} sx={{ fontSize: '0.85rem', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_CFG[s].dot }} />
            Set {s}
          </MenuItem>
        ))}
      </Menu>

      {/* Add staff dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Add Staff Member
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Fields marked * are required.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}><TextField label="Full Name" name="name" value={form.name} onChange={handleChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={5}>
                <TextField select label="Role" name="role" value={form.role} onChange={handleChange} fullWidth>
                  {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              {form.role === 'Dentist' && (
                <Grid item xs={12}><TextField label="Specialty" name="specialty" value={form.specialty} onChange={handleChange} placeholder="e.g. Orthodontist" fullWidth /></Grid>
              )}
              <Grid item xs={12} sm={6}><TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Status" name="status" value={form.status} onChange={handleChange} fullWidth>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Add Member</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
