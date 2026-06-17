import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency } from '../utils/helpers';
import { colors } from '../theme/theme';
import { mockInventory } from '../utils/mockData';
import { Add as AddIcon, Inventory as InventoryIcon, WarningAmber as WarningAmberIcon, CheckCircle as CheckCircleIcon, DoNotDisturb as DoNotDisturbIcon } from '@mui/icons-material';

const CATEGORIES = ['Restorative', 'Endodontic', 'Supplies', 'Medications', 'Equipment', 'PPE'];

const EMPTY_FORM = {
  name: '',
  sku: '',
  category: 'Supplies',
  quantity: '',
  minLevel: '',
  unit: 'pcs',
  supplier: '',
  unitPrice: '',
};

const getStockStatus = (quantity, minLevel) => {
  if (quantity <= 0) return 'out-of-stock';
  if (quantity <= minLevel) return 'low';
  return 'in-stock';
};

const StockChip = ({ status }) => {
  const cfg = {
    'in-stock': { label: 'In Stock', color: 'success' },
    'low': { label: 'Low Stock', color: 'warning' },
    'out-of-stock': { label: 'Out of Stock', color: 'error' },
  };
  const { label, color } = cfg[status] || cfg['in-stock'];
  return <Chip label={label} size="small" color={color} variant="outlined" sx={{ fontWeight: 700 }} />;
};

export default function Inventory() {
  const { notify } = useNotification();
  const [inventory, setInventory] = useState(mockInventory);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

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
    const status = getStockStatus(qty, minLvl);
    const newItem = {
      ...form,
      id: `inv-${Date.now()}`,
      quantity: qty,
      minLevel: minLvl,
      status,
      unitPrice: form.unitPrice ? `Rs. ${form.unitPrice}` : 'Rs. 0',
    };
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
    totalValue: inventory.reduce((sum, item) => {
      const price = parseFloat(String(item.unitPrice).replace(/[^0-9.]/g, '')) || 0;
      return sum + price * item.quantity;
    }, 0),
  }), [inventory]);

  const statCards = [
    { label: 'Total Items', value: stats.total, icon: <InventoryIcon />, bg: '#EEF2FF', color: colors.primary },
    { label: 'Stock Value', value: formatCurrency(stats.totalValue), icon: <InventoryIcon />, bg: '#ECFDF5', color: colors.success },
    { label: 'Low Stock Alerts', value: stats.low, icon: <WarningAmberIcon />, bg: '#FFFBEB', color: '#D97706' },
    { label: 'Out of Stock', value: stats.outOfStock, icon: <DoNotDisturbIcon />, bg: '#FEF2F2', color: colors.error },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Inventory Management</Typography>
          <Typography variant="body2" color="text.secondary">Track dental supplies, materials, and equipment stock levels.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
          Add Item
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card>
              <CardContent sx={{ p: '20px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600, mb: 1 }}>{card.label}</Typography>
                    <Typography variant="h5" fontWeight={700}>{card.value}</Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: card.bg, color: card.color, display: 'flex' }}>
                    {card.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {inventory.filter((i) => i.status === 'low' || i.status === 'out-of-stock').length > 0 && (
        <Grid container spacing={2}>
          {inventory.filter((i) => i.status !== 'in-stock').slice(0, 3).map((item) => {
            const maxLevel = Math.max(item.minLevel * 3, 1);
            const percent = Math.min(100, (item.quantity / maxLevel) * 100);
            return (
              <Grid item xs={12} md={4} key={item.id}>
                <Card>
                  <CardContent sx={{ p: '16px !important' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.unit} • Min: {item.minLevel}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>{Math.round(percent)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      color={item.status === 'out-of-stock' ? 'error' : 'warning'}
                      sx={{ height: 6, borderRadius: 999 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <TableContainer component={Paper}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Stock Registry ({inventory.length} items)</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="center">Quantity</TableCell>
              <TableCell align="center">Min Level</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <InventoryIcon sx={{ fontSize: 36, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No items in inventory.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{ bgcolor: item.status === 'out-of-stock' ? '#FFF5F5' : 'inherit' }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: colors.textSecondary }}>{item.sku}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: item.quantity <= item.minLevel ? colors.error : 'inherit' }}>
                    {item.quantity}
                  </TableCell>
                  <TableCell align="center" sx={{ color: 'text.secondary' }}>{item.minLevel}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell align="right">{item.unitPrice}</TableCell>
                  <TableCell><StockChip status={item.status} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setFormError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Add Inventory Item
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ p: 3 }}>
            {formError && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>{formError}</Typography>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField label="Item Name *" name="name" value={form.name} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="SKU" name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. AMAL-001" fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Category" name="category" value={form.category} onChange={handleChange} fullWidth>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Supplier" name="supplier" value={form.supplier} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Quantity *" name="quantity" type="number" value={form.quantity} onChange={handleChange} fullWidth required inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Min Level" name="minLevel" type="number" value={form.minLevel} onChange={handleChange} fullWidth inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Unit" name="unit" value={form.unit} onChange={handleChange} placeholder="pcs, boxes, tubes…" fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Unit Price (PKR)" name="unitPrice" value={form.unitPrice} onChange={handleChange} type="number" fullWidth inputProps={{ min: 0 }} />
              </Grid>
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
