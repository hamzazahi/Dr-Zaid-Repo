import { Box, Card, CardContent, Typography, Grid, Stack, Button, Dialog, TextField, MenuItem, Chip, LinearProgress } from '@mui/material';
import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { colors } from '../theme/theme';
import { DataTable } from '../components/table/DataTable';
import { StatsCard, ProgressCard } from '../components/cards/CardComponents';
import { StatusBadge } from '../components/common/StateComponents';
import { mockInventory } from '../utils/mockData';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Inventory() {
  const [inventory, setInventory] = useState(mockInventory);
  const [openDialog, setOpenDialog] = useState(false);

  const inventoryColumns = [
    { id: 'name', label: 'Item Name', sortable: true, minWidth: 160 },
    { id: 'sku', label: 'SKU', minWidth: 120 },
    { id: 'category', label: 'Category', sortable: true, minWidth: 130 },
    { id: 'quantity', label: 'Quantity', minWidth: 100, align: 'center' },
    { id: 'minLevel', label: 'Min Level', minWidth: 100, align: 'center' },
    { id: 'unit', label: 'Unit', minWidth: 80 },
    { id: 'supplier', label: 'Supplier', minWidth: 130 },
    { 
      id: 'status', 
      label: 'Status',
      render: (value) => {
        const statusConfig = {
          'in-stock': 'completed',
          'low': 'warning',
          'out-of-stock': 'error',
        };
        return <StatusBadge status={statusConfig[value] || 'pending'} size="small" />;
      }
    },
  ];

  const inStockCount = inventory.filter(i => i.status === 'in-stock').length;
  const lowStockCount = inventory.filter(i => i.status === 'low').length;
  const outOfStockCount = inventory.filter(i => i.status === 'out-of-stock').length;

  const totalValue = inventory.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice.replace(/[$,]/g, ''));
    return sum + (price * item.quantity);
  }, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary }}>
            Inventory Management
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.5 }}>
            Track dental supplies and materials inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: colors.primary }}
        >
          Add Item
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Items"
            value={inventory.length.toString()}
            icon={<InventoryIcon sx={{ fontSize: '1.5rem' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Stock Value"
            value={`Rs. ${(totalValue / 1000).toFixed(1)}k`}
            icon={<Box sx={{ fontSize: '1.5rem' }}>₹</Box>}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Low Stock"
            value={lowStockCount.toString()}
            icon={<WarningIcon sx={{ fontSize: '1.5rem' }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Out of Stock"
            value={outOfStockCount.toString()}
            icon={<CheckCircleIcon sx={{ fontSize: '1.5rem' }} />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Inventory Status Overview */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {inventory.slice(0, 3).map((item) => (
          <Grid item xs={12} md={4} key={item.id}>
            <ProgressCard
              title={item.name}
              value={item.quantity}
              max={item.minLevel * 3}
              status={item.status === 'in-stock' ? 'success' : item.status === 'low' ? 'warning' : 'error'}
              subtitle={`${item.unit} • Min: ${item.minLevel}`}
            />
          </Grid>
        ))}
      </Grid>

      {/* Inventory Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataTable
            columns={inventoryColumns}
            data={inventory}
            selectable={true}
          />
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Add New Inventory Item
          </Typography>
          <Stack spacing={2}>
            <TextField label="Item Name" fullWidth />
            <TextField label="SKU" placeholder="e.g., AMAL-001" fullWidth />
            <TextField select label="Category" fullWidth>
              <MenuItem value="Restorative">Restorative</MenuItem>
              <MenuItem value="Endodontic">Endodontic</MenuItem>
              <MenuItem value="Supplies">Supplies</MenuItem>
              <MenuItem value="Medications">Medications</MenuItem>
            </TextField>
            <TextField type="number" label="Quantity" fullWidth />
            <TextField type="number" label="Minimum Level" fullWidth />
            <TextField label="Unit" placeholder="e.g., pcs, tubes" fullWidth />
            <TextField label="Supplier" fullWidth />
            <TextField label="Unit Price" placeholder="e.g., $5.50" fullWidth />
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setOpenDialog(false)} variant="outlined">
                Cancel
              </Button>
              <Button variant="contained" color="primary">
                Add Item
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
}
