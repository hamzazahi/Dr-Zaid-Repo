import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningIcon from '@mui/icons-material/Warning';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PaymentIcon from '@mui/icons-material/Payment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate, calculateAge } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';

// Separate Tab Panels
const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
    {value === index && children}
  </Box>
);

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    patients,
    appointments,
    treatments,
    invoices,
    addPayment,
    addTreatment
  } = useClinicData();

  const [activeTab, setActiveTab] = useState(0);

  // Modals state
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [openTreatmentModal, setOpenTreatmentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const [newTreatment, setNewTreatment] = useState({
    type: 'Filling',
    toothNumber: '11',
    cost: '',
    notes: ''
  });

  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">Patient record not found.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/patients')} sx={{ mt: 2 }}>
          Back to Directory
        </Button>
      </Box>
    );
  }

  // Filter records related to this specific patient
  const patientAppts = appointments.filter((a) => a.patientId === patient.id);
  const patientTreatments = treatments.filter((t) => t.patientId === patient.id);
  const patientInvoices = invoices.filter((i) => i.patientId === patient.id);
  const patientOutstanding = patientInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceDue);
    setOpenPaymentModal(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (Number(paymentAmount) > selectedInvoice.balanceDue) {
      alert('Payment amount cannot exceed the balance due.');
      return;
    }

    addPayment({
      invoiceId: selectedInvoice.id,
      patientName: patient.name,
      amount: Number(paymentAmount),
      method: paymentMethod
    });

    setOpenPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentAmount('');
  };

  const handleTreatmentSubmit = (e) => {
    e.preventDefault();
    if (!newTreatment.cost || Number(newTreatment.cost) <= 0) {
      alert('Please enter a valid cost.');
      return;
    }

    addTreatment({
      patientId: patient.id,
      patientName: patient.name,
      ...newTreatment,
      cost: Number(newTreatment.cost)
    });

    setOpenTreatmentModal(false);
    setNewTreatment({
      type: 'Filling',
      toothNumber: '11',
      cost: '',
      notes: ''
    });
  };

  const treatmentCosts = {
    'Filling': 5000,
    'Scaling': 4000,
    'Root Canal': 15000,
    'Extraction': 3500,
    'Crown': 25000
  };

  const handleTreatmentTypeChange = (e) => {
    const type = e.target.value;
    setNewTreatment(prev => ({
      ...prev,
      type,
      cost: treatmentCosts[type] || ''
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Back Button */}
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/patients')}
          sx={{ textTransform: 'none', color: '#1E3A8A', fontWeight: 'bold' }}
        >
          Back to Patient Directory
        </Button>
      </Box>

      {/* Patient Header Card */}
      <Card sx={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: '#1E3A8A', py: 1.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>
            Clinical Record File
          </Typography>
          <StatusBadge status={patient.status} />
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={1.5} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#EFF6FF',
                  color: '#1E3A8A',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  border: '2px solid #E5E7EB'
                }}
              >
                {patient.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            </Grid>

            <Grid item xs={12} md={6.5}>
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                {patient.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1, color: 'text.secondary' }}>
                <Typography variant="body2">
                  <strong>ID:</strong> <span style={{ fontFamily: 'monospace' }}>{patient.id}</span>
                </Typography>
                <Typography variant="body2">
                  <strong>Age/Gender:</strong> {calculateAge(patient.dob)} yrs / {patient.gender}
                </Typography>
                <Typography variant="body2">
                  <strong>Blood Group:</strong> {patient.bloodGroup || 'O+'}
                </Typography>
                <Typography variant="body2">
                  <strong>Registered:</strong> {formatDate(patient.registrationDate)}
                </Typography>
              </Box>
            </Grid>

            {/* Financial Summary */}
            <Grid item xs={12} md={4} sx={{ borderLeft: { md: '1px solid #E5E7EB' }, pl: { md: 4 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                Outstanding Patient Ledger
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: patientOutstanding > 0 ? '#EF4444' : '#10B981', mt: 0.5 }}>
                {formatCurrency(patientOutstanding)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<LocalHospitalIcon />}
                  onClick={() => setOpenTreatmentModal(true)}
                  sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0B7A6F' }, textTransform: 'none', borderRadius: '6px' }}
                >
                  Log Treatment
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Allergy Warning Banner */}
      {patient.allergies && patient.allergies.toLowerCase() !== 'none' && (
        <Card sx={{ bgcolor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px' }}>
          <CardContent sx={{ p: '12px 20px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
            <WarningIcon color="error" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" color="error">
                CRITICAL ALLERGY ALERT
              </Typography>
              <Typography variant="body2" color="text.primary">
                Patient is allergic to: <strong>{patient.allergies}</strong>. Verify patient records and medication prescriptions.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabs Layout */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#FFFFFF', borderRadius: '8px 8px 0 0' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ px: 2 }}>
            <Tab label="Demographics Overview" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
            <Tab label={`Visit History (${patientAppts.length})`} sx={{ fontWeight: 'bold', textTransform: 'none' }} />
            <Tab label={`Clinical Treatments (${patientTreatments.length})`} sx={{ fontWeight: 'bold', textTransform: 'none' }} />
            <Tab label={`Invoices & Billing (${patientInvoices.length})`} sx={{ fontWeight: 'bold', textTransform: 'none' }} />
          </Tabs>
        </Box>

        <Paper sx={{ p: 1, borderRadius: '0 0 8px 8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          {/* TAB 1: OVERVIEW */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: '#1E3A8A' }}>
                  Contact Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" fontWeight="bold">{patient.phone}</Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{patient.email || 'No email registered'}</Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Residential Address</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{patient.address || 'No address registered'}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: '#1E3A8A' }}>
                  Emergency Contact File
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Contact Name</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" fontWeight="bold">Sohail Zahid (Brother)</Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Relation Phone</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">+92 321 4567891</Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Consent Approved</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Chip label="Yes" color="success" size="small" sx={{ fontWeight: 'bold' }} />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 2: VISIT HISTORY */}
          <TabPanel value={activeTab} index={1}>
            {patientAppts.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CalendarMonthIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No appointment history found.</Typography>
              </Box>
            ) : (
              <TableContainer component={Box}>
                <Table>
                  <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Dentist</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Appointment Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Clinical Notes</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patientAppts.map((appt) => (
                      <TableRow key={appt.id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>{formatDate(appt.date)}</TableCell>
                        <TableCell>{appt.time}</TableCell>
                        <TableCell>{appt.dentistName}</TableCell>
                        <TableCell>
                          <Chip label={appt.type} size="small" variant="outlined" sx={{ fontWeight: 'medium' }} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 280, color: 'text.secondary' }}>
                          {appt.notes || 'No pre-check notes.'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={appt.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* TAB 3: TREATMENTS */}
          <TabPanel value={activeTab} index={2}>
            {patientTreatments.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <LocalHospitalIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No clinical treatments logged yet.</Typography>
              </Box>
            ) : (
              <Box>
                {/* Tooth Map Visualization Area */}
                <Card sx={{ bgcolor: '#F8FAFC', mb: 3, border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                      Visual Chart: Treated Teeth Locations
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', py: 1.5 }}>
                      {Array.from({ length: 32 }, (_, i) => i + 1).map(num => {
                        const hasTreatment = patientTreatments.some(t => t.toothNumber === String(num));
                        return (
                          <Avatar
                            key={num}
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              bgcolor: hasTreatment ? '#0D9488' : '#FFFFFF',
                              color: hasTreatment ? '#FFFFFF' : '#475569',
                              border: hasTreatment ? 'none' : '1px solid #CBD5E1',
                              boxShadow: hasTreatment ? '0 2px 4px rgba(13, 148, 136, 0.3)' : 'none'
                            }}
                          >
                            {num}
                          </Avatar>
                        );
                      })}
                    </Box>
                  </CardContent>
                </Card>

                {/* Treatment List Table */}
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Date Completed</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Treatment Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Tooth Number</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Clinician notes</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Treatment Fee</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patientTreatments.map((t) => (
                        <TableRow key={t.id} hover>
                          <TableCell>{formatDate(t.date)}</TableCell>
                          <TableCell>
                            <Chip label={t.type} size="small" sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 'bold' }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            Tooth #{t.toothNumber}
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', maxWidth: 350 }}>
                            {t.notes}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#0D9488' }}>
                            {formatCurrency(t.cost)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </TabPanel>

          {/* TAB 4: BILLING & LEDGER */}
          <TabPanel value={activeTab} index={3}>
            {patientInvoices.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No invoices issued to this patient.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Invoice Number</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date Issued</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Paid Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Balance Due</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patientInvoices.map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell>{formatDate(inv.date)}</TableCell>
                        <TableCell>{formatDate(inv.dueDate)}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{formatCurrency(inv.totalAmount)}</TableCell>
                        <TableCell sx={{ color: '#0D9488' }}>{formatCurrency(inv.paidAmount)}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: inv.balanceDue > 0 ? '#EF4444' : '#10B981' }}>
                          {formatCurrency(inv.balanceDue)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={inv.status} />
                        </TableCell>
                        <TableCell align="right">
                          {inv.balanceDue > 0 && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PaymentIcon />}
                              onClick={() => handleOpenPayment(inv)}
                              sx={{ textTransform: 'none', color: '#1E3A8A', borderColor: '#1E3A8A', '&:hover': { bgcolor: 'rgba(30, 58, 138, 0.04)' } }}
                            >
                              Collect Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </Paper>
      </Box>

      {/* Collect Payment Modal */}
      <Dialog
        open={openPaymentModal}
        onClose={() => setOpenPaymentModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '10px' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #E5E7EB', py: 2 }}>
          Collect Outstanding Payment
        </DialogTitle>
        <form onSubmit={handlePaymentSubmit}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Invoice Code
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                {selectedInvoice?.invoiceNumber}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#F8FAFC', p: 1.5, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Typography variant="body2">Invoice Total: <strong>{formatCurrency(selectedInvoice?.totalAmount || 0)}</strong></Typography>
              <Typography variant="body2" color="error">Pending: <strong>{formatCurrency(selectedInvoice?.balanceDue || 0)}</strong></Typography>
            </Box>

            <TextField
              label="Collect Amount (PKR)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              required
              size="small"
              InputProps={{ inputProps: { min: 1, max: selectedInvoice?.balanceDue } }}
            />

            <TextField
              select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Credit Card">Credit Card</MenuItem>
              <MenuItem value="Insurance">Insurance</MenuItem>
              <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
            <Button onClick={() => setOpenPaymentModal(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#172E6E' }, textTransform: 'none' }}
            >
              Submit Receipt
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Log Treatment Modal */}
      <Dialog
        open={openTreatmentModal}
        onClose={() => setOpenTreatmentModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #E5E7EB', py: 2 }}>
          Record Dental Treatment Case
        </DialogTitle>
        <form onSubmit={handleTreatmentSubmit}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Procedure Type"
                  value={newTreatment.type}
                  onChange={handleTreatmentTypeChange}
                  fullWidth
                  required
                  size="small"
                >
                  <MenuItem value="Filling">Filling (Composite)</MenuItem>
                  <MenuItem value="Scaling">Scaling & Polishing</MenuItem>
                  <MenuItem value="Root Canal">Root Canal Treatment</MenuItem>
                  <MenuItem value="Extraction">Tooth Extraction</MenuItem>
                  <MenuItem value="Crown">Crown Restorative</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Tooth Number (1-32)"
                  value={newTreatment.toothNumber}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, toothNumber: e.target.value }))}
                  fullWidth
                  required
                  size="small"
                >
                  {Array.from({ length: 32 }, (_, i) => String(i + 1)).map(tNum => (
                    <MenuItem key={tNum} value={tNum}>Tooth #{tNum}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Treatment Fee (PKR)"
                  type="number"
                  value={newTreatment.cost}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, cost: e.target.value }))}
                  fullWidth
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Clinical Notes / Diagnosis"
                  value={newTreatment.notes}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, notes: e.target.value }))}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  placeholder="Enter specific diagnosis, material types used, anesthesia details, and guidelines given..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
            <Button onClick={() => setOpenTreatmentModal(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0B7A6F' }, textTransform: 'none' }}
            >
              Log Record & Issue Invoice
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PatientProfile;
