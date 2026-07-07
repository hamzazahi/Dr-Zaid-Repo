import { useMemo, useState } from 'react';
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
  InputAdornment,
  LinearProgress,
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
  Inventory as InventoryIcon,
  WarningAmber as WarningAmberIcon,
  CheckCircle as CheckCircleIcon,
  DoNotDisturb as DoNotDisturbIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency } from '../utils/helpers';
import { colors } from '../theme/theme';
import { mockInventory } from '../utils/mockData';

const CATEGORIES = ['Restorative', 'Endodontic', 'Supplies', 'Medications', 'Equipment', 'PPE'];
const EMPTY_FORM = { name: '', sku: '', category: 'Supplies', quantity: '', minLevel: '', unit: 'pcs', supplier: '', unitPrice: '' };

const getStockStatus = (quantity, minLevel) => {
  if (quantity <= 0) return 'out-of-stock';
  if (quantity <= minLevel) return 'low';
  return 'in-stock';
};

function StockBadge({ status }) {
  const cfg = {
    'in-stock':     { bg: '#F0FDF4', color: '#065F46', dot: '#10B981', label: 'In Stock' },
    'low':          { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B', label: 'Low Stock' },
    'out-of-stock': { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444', label: 'Out of Stock' },
  };
  const c = cfg[status] || cfg['in-stock'];
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: c.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{c.label}</Typography>
    </Box>
  );
}

export default function Inventory() {
  const { notify } = useNotification();
  const [inventory, setInventory] = useState(mockInventory);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Item name is required.'); return; }
    if (!form.quantity || Number(form.quantity) < 0) { setFormError('Please enter a valid quantity.'); return; }
    const qty = Number(form.quantity);
    const minLvl = Number(form.minLevel) || 0;
    const newItem = { ...form, id: `inv-${Date.now()}`, quantity: qty, minLevel: minLvl, status: getStockStatus(qty, minLvl), unitPrice: form.unitPrice ? `Rs. ${form.unitPrice}` : 'Rs. 0' };
    setInventory((prev) => [newItem, ...prev]);
    setOpenDialog(false);
    setForm(EMPTY_FORM);
    setFormError('');
    notify(`${form.name} added to inventory.`, 'success');
  };

  const stats = useMemo(() => ({
    total: inventory.length,
    inStock: inventory.filter((i) => i.status === 'in-stock').length,
    low: inventory.filter((i) => i.status === 'low').length,
    outOfStock: inventory.filter((i) => i.status === 'out-of-stock').length,
    totalValue: inventory.reduce((sum, item) => { const price = parseFloat(String(item.unitPrice).replace(/[^0-9.]/g, '')) || 0; return sum + price * item.quantity; }, 0),
  }), [inventory]);

  const alerts = useMemo(() => inventory.filter((i) => i.status !== 'in-stock').slice(0, 3), [inventory]);

  const filtered = useMemo(() =>
    inventory.filter((item) => {
      const qLow = q.toLowerCase();
      const matchQ = !qLow || item.name.toLowerCase().includes(qLow) || item.sku?.toLowerCase().includes(qLow) || item.supplier?.toLowerCase().includes(qLow);
      const matchCat = catFilter === 'All' || item.category === catFilter;
      return matchQ && matchCat;
    }), [inventory, q, catFilter]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>Inventory Management</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>Track dental supplies, materials, and equipment stock levels.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>Add Item</Button>
      </Box>

      <Grid container spacing={2}>
        {[
          { label: 'Total Items', value: stats.total, icon: <InventoryIcon />, bg: '#EEF2FF', color: colors.primary },
          { label: 'Stock Value', value: formatCurrency(stats.totalValue), icon: <CheckCircleIcon />, bg: '#ECFDF5', color: colors.success },
          { label: 'Low Stock Alerts', value: stats.low, icon: <WarningAmberIcon />, bg: '#FFFBEB', color: '#D97706' },
          { label: 'Out of Stock', value: stats.outOfStock, icon: <DoNotDisturbIcon />, bg: '#FEF2F2', color: colors.error },
        ].map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
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

      {alerts.length > 0 && (
        <Grid container spacing={2}>
          {alerts.map((item) => {
            const maxLevel = Math.max(item.minLevel * 3, 1);
            const percent = Math.min(100, (item.quantity / maxLevel) * 100);
            return (
              <Grid item xs={12} md={4} key={item.id}>
                <Card sx={{ borderRadius: '12px', border: `1px solid ${item.status === 'out-of-stock' ? colors.errorBorder : colors.warningBorder}` }}>
                  <Box sx={{ p: '14px 16px' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{item.name}</Typography>
                        <Typography variant="caption" sx={{ color: colors.textSecondary }}>{item.unit} · Min: {item.minLevel}</Typography>
                      </Box>
                      <StockBadge status={item.status} />
                    </Stack>
                    <LinearProgress variant="determinate" value={percent} color={item.status === 'out-of-stock' ? 'error' : 'warning'} sx={{ height: 5, borderRadius: 999 }} />
                    <Typography variant="caption" sx={{ color: colors.textSecondary, mt: 0.5, display: 'block' }}>{item.quantity} / {maxLevel} units remaining</Typography>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2, py: 1.75, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField placeholder="Search items, SKU, or supplier…" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: colors.textLight }} /></InputAdornment> }} />
          <TextField select size="small" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="All">All Categories</MenuItem>
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 'auto', fontWeight: 600 }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Card>

      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Stock Registry</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{inventory.length} items total</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="center">Min</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <InventoryIcon sx={{ fontSize: 24, color: colors.textLight }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{q || catFilter !== 'All' ? 'No items match your search' : 'No items in inventory'}</Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>{q || catFilter !== 'All' ? 'Try adjusting your filters.' : 'Click "Add Item" to add the first record.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} sx={{ bgcolor: item.status === 'out-of-stock' ? '#FFF5F5' : 'inherit' }}>
                    <TableCell><Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{item.name}</Typography></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: colors.textSecondary }}>{item.sku}</TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{item.category}</Typography></TableCell>
                    <TableCell align="center"><Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: item.quantity <= item.minLevel ? colors.error : colors.textPrimary }}>{item.quantity}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" sx={{ color: colors.textSecondary }}>{item.minLevel}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: colors.textSecondary }}>{item.unit}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{item.supplier}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>{item.unitPrice}</Typography></TableCell>
                    <TableCell><StockBadge status={item.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Add Inventory Item
          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400, mt: 0.25 }}>Fields marked * are required.</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}><TextField label="Item Name" name="name" value={form.name} onChange={handleChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={4}><TextField label="SKU" name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. AMAL-001" fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField select label="Category" name="category" value={form.category} onChange={handleChange} fullWidth>{CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}><TextField label="Supplier" name="supplier" value={form.supplier} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={4}><TextField label="Quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} fullWidth required inputProps={{ min: 0 }} /></Grid>
              <Grid item xs={12} sm={4}><TextField label="Min Level" name="minLevel" type="number" value={form.minLevel} onChange={handleChange} fullWidth inputProps={{ min: 0 }} /></Grid>
              <Grid item xs={12} sm={4}><TextField label="Unit" name="unit" value={form.unit} onChange={handleChange} placeholder="pcs, boxes…" fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Unit Price (PKR)" name="unitPrice" value={form.unitPrice} onChange={handleChange} type="number" fullWidth inputProps={{ min: 0 }} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => { setOpenDialog(false); setFormError(''); }} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Add Item</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
