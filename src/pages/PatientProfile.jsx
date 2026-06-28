import { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  LinearProgress,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  WarningAmber as WarningAmberIcon,
  LocalHospital as LocalHospitalIcon,
  Payment as PaymentIcon,
  CalendarMonth as CalendarMonthIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate, calculateAge } from '../utils/helpers';
import { PAYMENT_METHODS, TREATMENT_COSTS, TREATMENT_TYPES, TOOTH_NUMBERS } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import Odontogram from '../components/clinical/Odontogram';
import { colors } from '../theme/theme';

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

function TabPanel({ children, value, index }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.25, borderBottom: `1px solid ${colors.borderLight}` }}>
      <Box sx={{ color: colors.textLight, display: 'flex', mt: '2px', flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>{value || '—'}</Typography>
      </Box>
    </Box>
  );
}

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { patients, appointments, treatments, invoices, prescriptions, documents, addPayment, addTreatment } = useClinicData();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState(location.state?.tab ?? 0);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [openTreatmentModal, setOpenTreatmentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentError, setPaymentError] = useState('');
  const [treatmentForm, setTreatmentForm] = useState({ type: 'Filling', toothNumber: '11', cost: TREATMENT_COSTS.Filling, notes: '' });
  const [treatmentError, setTreatmentError] = useState('');

  // Apply the tab requested via navigation state once per navigation. Done in
  // render (React's supported "adjust state on prop change" pattern) keyed off
  // location.key, which avoids the cascading-render cost of doing it in an effect.
  const [appliedNavKey, setAppliedNavKey] = useState(location.key);
  if (location.key !== appliedNavKey) {
    setAppliedNavKey(location.key);
    if (location.state?.tab !== undefined) setActiveTab(location.state.tab);
  }

  const patient = patients.find((p) => p.id === id);
  const patientAppts = useMemo(() => appointments.filter((a) => a.patientId === id), [appointments, id]);
  const patientTreatments = useMemo(() => treatments.filter((t) => t.patientId === id), [treatments, id]);
  const patientInvoices = useMemo(() => invoices.filter((i) => i.patientId === id), [invoices, id]);
  const patientPrescriptions = useMemo(() => prescriptions.filter((px) => px.patientId === id), [prescriptions, id]);
  const patientDocuments = useMemo(() => documents.filter((d) => d.patientId === id), [documents, id]);
  const patientOutstanding = useMemo(() => patientInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0), [patientInvoices]);

  if (!patient) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>Patient record not found.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/patients')}>Back to Directory</Button>
      </Box>
    );
  }

  const handleOpenPayment = (invoice) => { setSelectedInvoice(invoice); setPaymentAmount(String(invoice.balanceDue)); setPaymentError(''); setOpenPaymentModal(true); };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) { setPaymentError('Please enter a valid payment amount.'); return; }
    if (amount > selectedInvoice.balanceDue) { setPaymentError(`Amount cannot exceed the balance due (${formatCurrency(selectedInvoice.balanceDue)}).`); return; }
    addPayment({ invoiceId: selectedInvoice.id, patientName: patient.name, amount, method: paymentMethod });
    setOpenPaymentModal(false); setSelectedInvoice(null); setPaymentAmount(''); setPaymentError('');
    notify(`Payment of ${formatCurrency(amount)} recorded for ${patient.name}.`, 'success');
  };

  const handleTreatmentSubmit = (e) => {
    e.preventDefault();
    if (!treatmentForm.cost || Number(treatmentForm.cost) <= 0) { setTreatmentError('Please enter a valid fee amount.'); return; }
    addTreatment({ patientId: patient.id, patientName: patient.name, ...treatmentForm, cost: Number(treatmentForm.cost) });
    setOpenTreatmentModal(false);
    setTreatmentForm({ type: 'Filling', toothNumber: '11', cost: TREATMENT_COSTS.Filling, notes: '' });
    setTreatmentError('');
    notify(`Treatment logged. Invoice generated for ${patient.name}.`, 'success');
  };

  const bgColor = avatarColor(patient.name);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/patients')} sx={{ color: colors.primary, fontWeight: 700, textTransform: 'none' }}>
          Back to Patient Directory
        </Button>
      </Box>

      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ height: 6, background: `linear-gradient(90deg, ${bgColor}, ${colors.primary})` }} />
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs="auto">
              <Avatar sx={{ width: 72, height: 72, bgcolor: bgColor, fontSize: '1.6rem', fontWeight: 700, border: `3px solid ${colors.surface}`, boxShadow: `0 0 0 2px ${bgColor}40` }}>
                {patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: colors.textPrimary }}>{patient.name}</Typography>
                <StatusBadge status={patient.status} />
              </Box>
              <Stack direction="row" gap={2} flexWrap="wrap">
                <Typography variant="caption" sx={{ color: colors.textSecondary }}><strong>ID:</strong> <span style={{ fontFamily: 'monospace' }}>{patient.id}</span></Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}><strong>Age:</strong> {calculateAge(patient.dob)} yrs / {patient.gender}</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}><strong>Blood:</strong> {patient.bloodGroup || 'O+'}</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}><strong>Registered:</strong> {formatDate(patient.registrationDate)}</Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md="auto">
              <Card sx={{ borderRadius: '10px', bgcolor: patientOutstanding > 0 ? colors.errorBg : colors.successBg, border: `1px solid ${patientOutstanding > 0 ? colors.errorBorder : colors.successBorder}`, px: 2.5, py: 1.5, minWidth: 180 }}>
                <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>Outstanding Balance</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: patientOutstanding > 0 ? colors.error : colors.success, letterSpacing: '-0.02em' }}>{formatCurrency(patientOutstanding)}</Typography>
                <Button size="small" variant="contained" startIcon={<LocalHospitalIcon sx={{ fontSize: 14 }} />} onClick={() => setOpenTreatmentModal(true)} sx={{ mt: 1, bgcolor: '#0D9488', '&:hover': { bgcolor: '#0B7A6F' }, fontWeight: 700, fontSize: '0.75rem', py: 0.5 }}>
                  Log Treatment
                </Button>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {patient.allergies && patient.allergies.toLowerCase() !== 'none' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5, borderRadius: '10px', bgcolor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
          <WarningAmberIcon color="error" sx={{ flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="error.dark" sx={{ letterSpacing: '0.04em' }}>CRITICAL ALLERGY ALERT</Typography>
            <Typography variant="body2">Patient is allergic to: <strong>{patient.allergies}</strong>. Verify all materials and prescriptions.</Typography>
          </Box>
        </Box>
      )}

      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: `1px solid ${colors.border}`, px: 2 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ minHeight: 48 }}>
            {['Demographics', `Visits (${patientAppts.length})`, `Treatments (${patientTreatments.length})`, 'Dental Chart', `Billing (${patientInvoices.length})`, `Prescriptions (${patientPrescriptions.length})`, `Documents (${patientDocuments.length})`].map((label) => (
              <Tab key={label} label={label} sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.85rem', minHeight: 48 }} />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: colors.primary, mb: 1.5 }}>Contact Information</Typography>
                <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={patient.phone} />
                <InfoRow icon={<EmailIcon fontSize="small" />} label="Email" value={patient.email} />
                <InfoRow icon={<HomeIcon fontSize="small" />} label="Address" value={patient.address} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: colors.primary, mb: 1.5 }}>Emergency Contact</Typography>
                <InfoRow icon={<PhoneIcon fontSize="small" />} label="Contact Name" value={patient.emergencyContactName} />
                <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={patient.emergencyContactPhone} />
                <Box sx={{ py: 1.25 }}>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>Consent Status</Typography>
                  <Box sx={{ mt: 0.5, display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: '#F0FDF4' }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#065F46' }}>Approved</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {patientAppts.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <CalendarMonthIcon sx={{ fontSize: 40, color: colors.textLight, mb: 1 }} />
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>No appointments found</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>This patient has no appointment history.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 600 }}>
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
                      <TableRow key={appt.id}>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{formatDate(appt.date)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{appt.time}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{appt.dentistName}</Typography></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'inline-flex', px: '7px', py: '2px', borderRadius: '5px', bgcolor: colors.primaryAlpha8 }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: colors.primary }}>{appt.type}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}><Typography variant="body2" sx={{ fontSize: '0.8rem', color: colors.textSecondary }} noWrap>{appt.notes || '—'}</Typography></TableCell>
                        <TableCell><StatusBadge status={appt.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {patientTreatments.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <LocalHospitalIcon sx={{ fontSize: 40, color: colors.textLight, mb: 1 }} />
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>No treatments logged</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Use "Log Treatment" to add the first procedure.</Typography>
              </Box>
            ) : (
              <Box>
                <Box sx={{ mb: 3, p: 2, borderRadius: '10px', bgcolor: colors.surfaceAlt, border: `1px solid ${colors.border}` }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1.5 }}>Treated Teeth Map</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {Array.from({ length: 32 }, (_, i) => i + 1).map((num) => {
                      const treated = patientTreatments.some((t) => t.toothNumber === String(num));
                      return (
                        <Avatar key={num} sx={{ width: 30, height: 30, fontSize: '0.65rem', fontWeight: 700, bgcolor: treated ? '#0D9488' : colors.surface, color: treated ? '#fff' : colors.textLight, border: treated ? 'none' : `1px solid ${colors.border}`, boxShadow: treated ? '0 2px 4px rgba(13,148,136,0.25)' : 'none' }}>
                          {num}
                        </Avatar>
                      );
                    })}
                  </Box>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 560 }}>
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
                        <TableRow key={t.id}>
                          <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(t.date)}</Typography></TableCell>
                          <TableCell>
                            <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: '#E0F2FE' }}>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369A1' }}>{t.type}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" fontWeight={700}>{t.toothNumber === 'All' ? 'All Teeth' : `#${t.toothNumber}`}</Typography></TableCell>
                          <TableCell sx={{ maxWidth: 300 }}><Typography variant="body2" sx={{ fontSize: '0.8rem', color: colors.textSecondary }} noWrap>{t.notes || '—'}</Typography></TableCell>
                          <TableCell align="right"><Typography sx={{ fontWeight: 700, color: '#0D9488' }}>{formatCurrency(t.cost)}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Odontogram patientId={patient.id} />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            {patientInvoices.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 40, color: colors.textLight, mb: 1 }} />
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>No invoices issued</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Invoices are created automatically when treatments are logged.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 700 }}>
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
                      <TableRow key={inv.id}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>{inv.invoiceNumber}</TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(inv.date)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(inv.dueDate)}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={700}>{formatCurrency(inv.totalAmount)}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" sx={{ color: colors.success, fontWeight: 600 }}>{formatCurrency(inv.paidAmount)}</Typography></TableCell>
                        <TableCell align="right"><Typography sx={{ fontWeight: 700, color: inv.balanceDue > 0 ? colors.error : colors.success }}>{formatCurrency(inv.balanceDue)}</Typography></TableCell>
                        <TableCell sx={{ minWidth: 150 }}>
                          <StatusBadge status={inv.status} />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(inv.paymentPercentage ?? 0, 100)}
                              sx={{ flex: 1, height: 5, borderRadius: 999, bgcolor: colors.borderLight, '& .MuiLinearProgress-bar': { bgcolor: inv.balanceDue <= 0 ? colors.success : inv.paidAmount > 0 ? '#D97706' : colors.error } }}
                            />
                            <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{inv.paymentPercentage ?? 0}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {inv.balanceDue > 0 && (
                            <Button size="small" startIcon={<PaymentIcon sx={{ fontSize: 13 }} />} onClick={() => handleOpenPayment(inv)} sx={{ color: colors.primary, fontWeight: 600, fontSize: '0.78rem', p: '4px 10px' }}>Collect</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={5}>
            {patientPrescriptions.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <LocalHospitalIcon sx={{ fontSize: 40, color: colors.textLight, mb: 1 }} />
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>No prescriptions</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Prescriptions issued from the Prescriptions page appear here.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 620 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Medication</TableCell>
                      <TableCell>Dosage</TableCell>
                      <TableCell>Frequency</TableCell>
                      <TableCell>Prescribed By</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patientPrescriptions.map((px) => (
                      <TableRow key={px.id}>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(px.date)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={700} sx={{ color: colors.primary }}>{px.medication}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{px.dosage}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{px.frequency || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{px.doctorName}</Typography></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: '8px', py: '3px', borderRadius: '6px', bgcolor: px.status === 'active' ? '#EFF6FF' : '#F0FDF4' }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: px.status === 'active' ? '#3B82F6' : '#10B981' }} />
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: px.status === 'active' ? '#1D4ED8' : '#065F46' }}>{px.status === 'active' ? 'Active' : 'Completed'}</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={6}>
            {patientDocuments.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <LocalHospitalIcon sx={{ fontSize: 40, color: colors.textLight, mb: 1 }} />
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>No documents</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Upload X-rays, scans or consent forms from the Documents page.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 560 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Uploaded</TableCell>
                      <TableCell>By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patientDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell><Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.84rem' }}>{doc.name}</Typography></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'inline-flex', px: '8px', py: '3px', borderRadius: '6px', bgcolor: colors.primaryAlpha8 }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: colors.primary }}>{doc.category}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatSize(doc.size)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(doc.uploadedDate)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{doc.uploadedBy}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </TabPanel>
        </Box>
      </Card>

      <Dialog open={openPaymentModal} onClose={() => setOpenPaymentModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Collect Outstanding Payment</DialogTitle>
        <form onSubmit={handlePaymentSubmit} noValidate>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>Invoice Number</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedInvoice?.invoiceNumber}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: colors.surfaceAlt, p: 1.5, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <Typography variant="body2">Total: <strong>{formatCurrency(selectedInvoice?.totalAmount || 0)}</strong></Typography>
              <Typography variant="body2" color="error">Balance: <strong>{formatCurrency(selectedInvoice?.balanceDue || 0)}</strong></Typography>
            </Box>
            {paymentError && <Alert severity="error" sx={{ borderRadius: '8px', py: 0.5 }}>{paymentError}</Alert>}
            <TextField label="Collect Amount (PKR)" type="number" value={paymentAmount} onChange={(e) => { setPaymentAmount(e.target.value); setPaymentError(''); }} fullWidth required inputProps={{ min: 1, max: selectedInvoice?.balanceDue }} />
            <TextField select label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} fullWidth>
              {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={() => setOpenPaymentModal(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Confirm Payment</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openTreatmentModal} onClose={() => setOpenTreatmentModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Log New Treatment</DialogTitle>
        <form onSubmit={handleTreatmentSubmit} noValidate>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {treatmentError && <Alert severity="error" sx={{ borderRadius: '8px', py: 0.5 }}>{treatmentError}</Alert>}
            <TextField select label="Procedure Type" value={treatmentForm.type} onChange={(e) => setTreatmentForm((p) => ({ ...p, type: e.target.value, cost: TREATMENT_COSTS[e.target.value] || '' }))} fullWidth>
              {TREATMENT_TYPES.filter((t) => t !== 'Consultation').map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Tooth Number" value={treatmentForm.toothNumber} onChange={(e) => setTreatmentForm((p) => ({ ...p, toothNumber: e.target.value }))} fullWidth>
              <MenuItem value="All">All Teeth</MenuItem>
              {TOOTH_NUMBERS.map((n) => <MenuItem key={n} value={n}>Tooth #{n}</MenuItem>)}
            </TextField>
            <TextField label="Fee (PKR)" type="number" value={treatmentForm.cost} onChange={(e) => { setTreatmentForm((p) => ({ ...p, cost: e.target.value })); setTreatmentError(''); }} fullWidth required inputProps={{ min: 0 }} />
            <TextField label="Clinical Notes" value={treatmentForm.notes} onChange={(e) => setTreatmentForm((p) => ({ ...p, notes: e.target.value }))} fullWidth multiline rows={2} placeholder="Procedure details, findings, follow-up…" />
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
