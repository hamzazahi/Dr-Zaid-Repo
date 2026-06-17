import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Alert,
  Avatar,
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
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PaymentIcon from '@mui/icons-material/Payment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency, formatDate, calculateAge } from '../utils/helpers';
import { PAYMENT_METHODS, TREATMENT_COSTS, TREATMENT_TYPES, TOOTH_NUMBERS } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import { colors } from '../theme/theme';

const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
    {value === index && children}
  </Box>
);

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    patients,
    appointments,
    treatments,
    invoices,
    addPayment,
    addTreatment,
  } = useClinicData();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState(0);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [openTreatmentModal, setOpenTreatmentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentError, setPaymentError] = useState('');
  const [treatmentForm, setTreatmentForm] = useState({
    type: 'Filling',
    toothNumber: '11',
    cost: TREATMENT_COSTS.Filling,
    notes: '',
  });
  const [treatmentError, setTreatmentError] = useState('');

  useEffect(() => {
    if (location.state?.tab !== undefined) {
      setActiveTab(location.state.tab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const patient = patients.find((p) => p.id === id);

  const patientAppts = useMemo(
    () => appointments.filter((a) => a.patientId === id),
    [appointments, id]
  );
  const patientTreatments = useMemo(
    () => treatments.filter((t) => t.patientId === id),
    [treatments, id]
  );
  const patientInvoices = useMemo(
    () => invoices.filter((i) => i.patientId === id),
    [invoices, id]
  );
  const patientOutstanding = useMemo(
    () => patientInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0),
    [patientInvoices]
  );

  if (!patient) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Patient record not found.
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/patients')}>
          Back to Directory
        </Button>
      </Box>
    );
  }

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(String(invoice.balanceDue));
    setPaymentError('');
    setOpenPaymentModal(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError('Please enter a valid payment amount.');
      return;
    }
    if (amount > selectedInvoice.balanceDue) {
      setPaymentError(`Amount cannot exceed the balance due (${formatCurrency(selectedInvoice.balanceDue)}).`);
      return;
    }
    addPayment({
      invoiceId: selectedInvoice.id,
      patientName: patient.name,
      amount,
      method: paymentMethod,
    });
    setOpenPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentAmount('');
    setPaymentError('');
    notify(`Payment of ${formatCurrency(amount)} recorded for ${patient.name}.`, 'success');
  };

  const handleTreatmentTypeChange = (type) => {
    setTreatmentForm((prev) => ({ ...prev, type, cost: TREATMENT_COSTS[type] || '' }));
  };

  const handleTreatmentSubmit = (e) => {
    e.preventDefault();
    if (!treatmentForm.cost || Number(treatmentForm.cost) <= 0) {
      setTreatmentError('Please enter a valid fee amount.');
      return;
    }
    addTreatment({
      patientId: patient.id,
      patientName: patient.name,
      ...treatmentForm,
      cost: Number(treatmentForm.cost),
    });
    setOpenTreatmentModal(false);
    setTreatmentForm({ type: 'Filling', toothNumber: '11', cost: TREATMENT_COSTS.Filling, notes: '' });
    setTreatmentError('');
    notify(`Treatment logged. Invoice generated for ${patient.name}.`, 'success');
  };

  const emergencyName = patient.emergencyContactName || '—';
  const emergencyPhone = patient.emergencyContactPhone || '—';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/patients')}
          sx={{ textTransform: 'none', color: colors.primary, fontWeight: 700 }}
        >
          Back to Patient Directory
        </Button>
      </Box>

      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ bgcolor: colors.primary, py: 1.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Clinical Record File
          </Typography>
          <StatusBadge status={patient.status} />
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={1.5} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: '#EFF6FF', color: colors.primary, fontSize: '2rem', fontWeight: 700, border: `2px solid ${colors.border}` }}
              >
                {patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Avatar>
            </Grid>

            <Grid item xs={12} md={6.5}>
              <Typography variant="h5" fontWeight={700}>{patient.name}</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1, color: 'text.secondary' }}>
                <Typography variant="body2"><strong>ID:</strong> <span style={{ fontFamily: 'monospace' }}>{patient.id}</span></Typography>
                <Typography variant="body2"><strong>Age / Gender:</strong> {calculateAge(patient.dob)} yrs / {patient.gender}</Typography>
                <Typography variant="body2"><strong>Blood Group:</strong> {patient.bloodGroup || 'O+'}</Typography>
                <Typography variant="body2"><strong>Registered:</strong> {formatDate(patient.registrationDate)}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4} sx={{ borderLeft: { md: `1px solid ${colors.border}` }, pl: { md: 4 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Outstanding Patient Ledger
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: patientOutstanding > 0 ? colors.error : colors.success, mt: 0.5 }}>
                {formatCurrency(patientOutstanding)}
              </Typography>
              <Stack direction="row" gap={1.5} sx={{ mt: 1.5 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<LocalHospitalIcon />}
                  onClick={() => setOpenTreatmentModal(true)}
                  sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0B7A6F' }, textTransform: 'none', borderRadius: '6px' }}
                >
                  Log Treatment
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {patient.allergies && patient.allergies.toLowerCase() !== 'none' && (
        <Card sx={{ bgcolor: '#FEF2F2', border: `1px solid #FCA5A5` }}>
          <CardContent sx={{ p: '12px 20px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
            <WarningAmberIcon color="error" sx={{ fontSize: 28, flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="error.dark">
                CRITICAL ALLERGY ALERT
              </Typography>
              <Typography variant="body2">
                Patient is allergic to: <strong>{patient.allergies}</strong>. Verify prescriptions and materials before procedure.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: colors.surface, borderRadius: '8px 8px 0 0' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2 }}>
            <Tab label="Demographics" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label={`Visits (${patientAppts.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label={`Treatments (${patientTreatments.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label={`Billing (${patientInvoices.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
          </Tabs>
        </Box>

        <Paper sx={{ p: 1, borderRadius: '0 0 8px 8px' }}>
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: colors.primary }}>
                  Contact Information
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    ['Phone', patient.phone],
                    ['Email', patient.email || 'Not registered'],
                    ['Address', patient.address || 'Not registered'],
                  ].map(([label, value]) => (
                    <>
                      <Grid item xs={4} key={label + '-l'}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                      </Grid>
                      <Grid item xs={8} key={label + '-v'}>
                        <Typography variant="body2" fontWeight={label === 'Phone' ? 700 : 400}>{value}</Typography>
                      </Grid>
                    </>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: colors.primary }}>
                  Emergency Contact
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    ['Contact Name', emergencyName],
                    ['Phone', emergencyPhone],
                    ['Consent', null],
                  ].map(([label, value]) => (
                    <>
                      <Grid item xs={4} key={label + '-l'}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                      </Grid>
                      <Grid item xs={8} key={label + '-v'}>
                        {label === 'Consent' ? (
                          <Chip label="Approved" color="success" size="small" sx={{ fontWeight: 700 }} />
                        ) : (
                          <Typography variant="body2" fontWeight={label === 'Contact Name' ? 700 : 400}>{value}</Typography>
                        )}
                      </Grid>
                    </>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {patientAppts.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CalendarMonthIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No appointment history found.</Typography>
              </Box>
            ) : (
              <TableContainer component={Box}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Dentist</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patientAppts.map((appt) => (
                      <TableRow key={appt.id} hover>
                        <TableCell fontWeight={700}>{formatDate(appt.date)}</TableCell>
                        <TableCell>{appt.time}</TableCell>
                        <TableCell>{appt.dentistName}</TableCell>
                        <TableCell><Chip label={appt.type} size="small" variant="outlined" /></TableCell>
                        <TableCell sx={{ color: 'text.secondary', maxWidth: 280 }}>{appt.notes || '—'}</TableCell>
                        <TableCell><StatusBadge status={appt.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {patientTreatments.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <LocalHospitalIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No clinical treatments logged yet.</Typography>
              </Box>
            ) : (
              <Box>
                <Card sx={{ bgcolor: colors.surfaceAlt, mb: 3, border: `1px dashed ${colors.border}` }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Treated Teeth Map
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center', py: 1 }}>
                      {Array.from({ length: 32 }, (_, i) => i + 1).map((num) => {
                        const hasTreatment = patientTreatments.some((t) => t.toothNumber === String(num));
                        return (
                          <Avatar
                            key={num}
                            sx={{
                              width: 30,
                              height: 30,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: hasTreatment ? '#0D9488' : '#fff',
                              color: hasTreatment ? '#fff' : colors.textLight,
                              border: hasTreatment ? 'none' : `1px solid ${colors.border}`,
                              boxShadow: hasTreatment ? '0 2px 4px rgba(13,148,136,0.3)' : 'none',
                            }}
                          >
                            {num}
                          </Avatar>
                        );
                      })}
                    </Box>
                  </CardContent>
                </Card>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Procedure</TableCell>
                        <TableCell>Tooth #</TableCell>
                        <TableCell>Clinical Notes</TableCell>
                        <TableCell align="right">Fee</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patientTreatments.map((t) => (
                        <TableRow key={t.id} hover>
                          <TableCell>{formatDate(t.date)}</TableCell>
                          <TableCell>
                            <Chip label={t.type} size="small" sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {t.toothNumber === 'All' ? 'All Teeth' : `#${t.toothNumber}`}
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', maxWidth: 350 }}>{t.notes || '—'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#0D9488' }}>{formatCurrency(t.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            {patientInvoices.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No invoices issued to this patient.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Issued</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patientInvoices.map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{inv.invoiceNumber}</TableCell>
                        <TableCell>{formatDate(inv.date)}</TableCell>
                        <TableCell>{formatDate(inv.dueDate)}</TableCell>
                        <TableCell align="right" fontWeight={700}>{formatCurrency(inv.totalAmount)}</TableCell>
                        <TableCell align="right" sx={{ color: colors.success }}>{formatCurrency(inv.paidAmount)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: inv.balanceDue > 0 ? colors.error : colors.success }}>
                          {formatCurrency(inv.balanceDue)}
                        </TableCell>
                        <TableCell><StatusBadge status={inv.status} /></TableCell>
                        <TableCell align="right">
                          {inv.balanceDue > 0 && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PaymentIcon />}
                              onClick={() => handleOpenPayment(inv)}
                              sx={{ textTransform: 'none' }}
                            >
                              Collect
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

      {/* Payment Modal */}
      <Dialog open={openPaymentModal} onClose={() => setOpenPaymentModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Collect Outstanding Payment
        </DialogTitle>
        <form onSubmit={handlePaymentSubmit} noValidate>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Invoice Number</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedInvoice?.invoiceNumber}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: colors.surfaceAlt, p: 1.5, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <Typography variant="body2">Total: <strong>{formatCurrency(selectedInvoice?.totalAmount || 0)}</strong></Typography>
              <Typography variant="body2" color="error">Balance: <strong>{formatCurrency(selectedInvoice?.balanceDue || 0)}</strong></Typography>
            </Box>
            {paymentError && <Alert severity="error" sx={{ borderRadius: '8px', py: 0.5 }}>{paymentError}</Alert>}
            <TextField
              label="Collect Amount (PKR)"
              type="number"
              value={paymentAmount}
              onChange={(e) => { setPaymentAmount(e.target.value); setPaymentError(''); }}
              fullWidth
              required
              inputProps={{ min: 1, max: selectedInvoice?.balanceDue }}
            />
            <TextField
              select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              fullWidth
            >
              {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => setOpenPaymentModal(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Confirm Payment</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Treatment Modal */}
      <Dialog open={openTreatmentModal} onClose={() => setOpenTreatmentModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>
          Log New Treatment
        </DialogTitle>
        <form onSubmit={handleTreatmentSubmit} noValidate>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {treatmentError && <Alert severity="error" sx={{ borderRadius: '8px', py: 0.5 }}>{treatmentError}</Alert>}
            <TextField
              select
              label="Procedure Type"
              value={treatmentForm.type}
              onChange={(e) => handleTreatmentTypeChange(e.target.value)}
              fullWidth
            >
              {TREATMENT_TYPES.filter((t) => t !== 'Consultation').map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Tooth Number"
              value={treatmentForm.toothNumber}
              onChange={(e) => setTreatmentForm((prev) => ({ ...prev, toothNumber: e.target.value }))}
              fullWidth
            >
              <MenuItem value="All">All Teeth</MenuItem>
              {TOOTH_NUMBERS.map((n) => <MenuItem key={n} value={n}>Tooth #{n}</MenuItem>)}
            </TextField>
            <TextField
              label="Fee (PKR)"
              type="number"
              value={treatmentForm.cost}
              onChange={(e) => { setTreatmentForm((prev) => ({ ...prev, cost: e.target.value })); setTreatmentError(''); }}
              fullWidth
              required
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Clinical Notes"
              value={treatmentForm.notes}
              onChange={(e) => setTreatmentForm((prev) => ({ ...prev, notes: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              placeholder="Procedure details, findings, follow-up…"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => setOpenTreatmentModal(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Log Treatment</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PatientProfile;
