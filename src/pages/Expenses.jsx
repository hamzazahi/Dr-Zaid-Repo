import { useMemo, useRef, useState } from 'react';
import {
  Alert,
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
  Stack,
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
  ReceiptLong as TotalIcon,
  CalendarMonth as MonthIcon,
  HourglassEmpty as PendingIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';

const CATEGORIES = ['Rent', 'Salaries', 'Supplies', 'Lab Fees', 'Utilities', 'Equipment', 'Marketing', 'Maintenance', 'Other'];
const METHODS = ['Cash', 'Bank Transfer', 'Credit Card', 'Cheque'];

const CAT_COLOR = {
  Rent: '#7C3AED', Salaries: '#2563EB', Supplies: '#0D9488', 'Lab Fees': '#0369A1',
  Utilities: '#D97706', Equipment: '#DB2777', Marketing: '#DC2626', Maintenance: '#15803D', Other: '#475569',
};

const STATUS_CFG = {
  Paid:    { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  Pending: { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
};

const DATE_INPUT_SX = {
  border: '1px solid #DFE4EC', borderRadius: '7px', bgcolor: '#FBFCFE', px: '12px', py: '14px',
  fontSize: '0.9rem', fontFamily: 'inherit', color: '#1F2937', width: '100%', boxSizing: 'border-box',
  colorScheme: 'light', cursor: 'pointer',
  '&:hover': { borderColor: '#0F4C81' }, '&:focus': { outline: 'none', borderColor: '#0F4C81' },
};

const todayStr = () => new Date().toISOString().split('T')[0];
const monthKey = (d) => (d || '').slice(0, 7);

function CategoryChip({ category }) {
  const color = CAT_COLOR[category] || CAT_COLOR.Other;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: `${color}14` }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color }}>{category}</Typography>
    </Box>
  );
}

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Paid;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{status}</Typography>
    </Box>
  );
}

const emptyForm = () => ({ date: todayStr(), category: 'Supplies', vendor: '', description: '', amount: '', method: 'Bank Transfer', status: 'Paid' });

export default function Expenses() {
  const { expenses, addExpense, updateExpenseStatus, deleteExpense } = useClinicData();
  const { notify } = useNotification();
  const dateRef = useRef(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuExpense, setMenuExpense] = useState(null);

  const stats = useMemo(() => {
    const thisMonth = monthKey(todayStr());
    return {
      total: expenses.reduce((s, e) => s + (e.amount || 0), 0),
      month: expenses.filter((e) => monthKey(e.date) === thisMonth).reduce((s, e) => s + (e.amount || 0), 0),
      pending: expenses.filter((e) => e.status === 'Pending').reduce((s, e) => s + (e.amount || 0), 0),
      count: expenses.length,
    };
  }, [expenses]);

  const breakdown = useMemo(() => {
    const map = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + (e.amount || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const filtered = useMemo(() => expenses.filter((e) => {
    const qLow = q.trim().toLowerCase();
    const matchQ = !qLow || e.vendor?.toLowerCase().includes(qLow) || e.description?.toLowerCase().includes(qLow) || e.category?.toLowerCase().includes(qLow);
    const matchCat = catFilter === 'All' || e.category === catFilter;
    return matchQ && matchCat;
  }), [expenses, q, catFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.vendor.trim()) { setFormError('Vendor / payee is required.'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setFormError('Please enter a valid amount.'); return; }
    addExpense(form);
    setOpenDialog(false);
    setForm(emptyForm());
    setFormError('');
    notify(`Expense of ${formatCurrency(Number(form.amount))} recorded.`, 'success');
  };

  const openMenu = (ev, expense) => { setMenuAnchor(ev.currentTarget); setMenuExpense(expense); };
  const closeMenu = () => { setMenuAnchor(null); setMenuExpense(null); };
  const toggleStatus = () => {
    const next = menuExpense.status === 'Paid' ? 'Pending' : 'Paid';
    updateExpenseStatus(menuExpense.id, next);
    notify(`Expense marked ${next}.`, 'success');
    closeMenu();
  };
  const removeExpense = () => {
    deleteExpense(menuExpense.id);
    notify('Expense deleted.', 'success');
    closeMenu();
  };

  const statCards = [
    { label: 'Total Spent',  value: formatCurrency(stats.total),   icon: <TotalIcon />,   bg: '#EEF2FF', color: colors.primary },
    { label: 'This Month',   value: formatCurrency(stats.month),   icon: <MonthIcon />,   bg: '#E0F2FE', color: '#0369A1' },
    { label: 'Pending',      value: formatCurrency(stats.pending), icon: <PendingIcon />, bg: '#FFFBEB', color: '#D97706' },
    { label: 'Entries',      value: stats.count,                   icon: <CategoryIcon />,bg: '#ECFDF5', color: colors.success },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Expenses</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Track clinic spending — rent, salaries, supplies, lab fees and more.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
          Add Expense
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
                  <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: colors.textPrimary, letterSpacing: '-0.02em', mt: 0.25 }}>{card.value}</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: card.bg, color: card.color, display: 'flex', fontSize: 22 }}>{card.icon}</Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Category breakdown */}
      {breakdown.length > 0 && (
        <Card sx={{ borderRadius: '12px' }}>
          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1.5 }}>Spend by category</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {breakdown.map(([cat, amount]) => (
                <Box key={cat} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.6, borderRadius: '999px', border: `1px solid ${CAT_COLOR[cat] || CAT_COLOR.Other}33`, bgcolor: `${CAT_COLOR[cat] || CAT_COLOR.Other}10` }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: CAT_COLOR[cat] || CAT_COLOR.Other }} />
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: colors.textPrimary }}>{cat}</Typography>
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: colors.textSecondary }}>{formatCurrency(amount)}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2, py: 1.75, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField placeholder="Search vendor, description, category…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} sx={{ minWidth: 170 }}>
            <MenuItem value="All">All Categories</MenuItem>
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}</Typography>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Expense Ledger</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{expenses.length} entries total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 880 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Vendor / Payee</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <TotalIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || catFilter !== 'All' ? 'No expenses match your search' : 'No expenses recorded'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || catFilter !== 'All' ? 'Try adjusting your filters.' : 'Click "Add Expense" to record the first one.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(e.date)}</Typography></TableCell>
                    <TableCell><CategoryChip category={e.category} /></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.84rem' }}>{e.vendor}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 280 }}><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }} noWrap>{e.description || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{e.method}</Typography></TableCell>
                    <TableCell align="right"><Typography sx={{ fontWeight: 700, color: colors.textPrimary }}>{formatCurrency(e.amount)}</Typography></TableCell>
                    <TableCell><StatusPill status={e.status} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(ev) => openMenu(ev, e)}><MoreIcon sx={{ fontSize: 18 }} /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Row action menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={toggleStatus} sx={{ fontSize: '0.85rem' }}>
          Mark {menuExpense?.status === 'Paid' ? 'Pending' : 'Paid'}
        </MenuItem>
        <MenuItem onClick={removeExpense} sx={{ fontSize: '0.85rem', color: colors.error }}>Delete</MenuItem>
      </Menu>

      {/* Add expense dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Add Expense
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Fields marked * are required.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>Date</Typography>
                <Box ref={dateRef} component="input" type="date" name="date" value={form.date} max={todayStr()} onChange={handleChange} sx={DATE_INPUT_SX} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Category" name="category" value={form.category} onChange={handleChange} fullWidth>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Vendor / Payee *" name="vendor" value={form.vendor} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Amount (PKR) *" name="amount" type="number" value={form.amount} onChange={handleChange} fullWidth required inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Payment Method" name="method" value={form.method} onChange={handleChange} fullWidth>
                  {METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Status" name="status" value={form.status} onChange={handleChange} fullWidth>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline rows={2} placeholder="What was this for?" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Record Expense</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
