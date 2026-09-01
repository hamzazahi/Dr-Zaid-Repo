import { supabase } from '../lib/supabase';

// Billing - invoices and payments.
//
// The state machine (paid_amount / balance_due / status) lives in Postgres
// triggers: this service ONLY inserts payments and reads invoices back.
// paymentPercentage is derived here for the UI's progress bars.

const INVOICE_JOIN = '*, patients(name)';
const PAYMENT_JOIN = '*, patients(name), invoices(invoice_number)';

const invoiceFromRow = (r) => {
  const total = Number(r.total_amount) || 0;
  const paid = Number(r.paid_amount) || 0;
  return {
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patients?.name ?? 'Unknown Patient',
    invoiceNumber: r.invoice_number,
    date: r.date,
    dueDate: r.due_date,
    totalAmount: total,
    paidAmount: paid,
    balanceDue: Number(r.balance_due ?? total - paid),
    status: r.status,
    paymentPercentage: total > 0 ? Math.round((paid / total) * 100) : 0,
  };
};

const paymentFromRow = (r) => ({
  id: r.id,
  invoiceId: r.invoice_id,
  invoiceNumber: r.invoices?.invoice_number ?? null,
  patientId: r.patient_id,
  patientName: r.patients?.name ?? 'Unknown Patient',
  date: r.date,
  amount: Number(r.amount) || 0,
  method: r.method,
});

const nextInvoiceNumber = () =>
  `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

export const billingService = {
  async listInvoices() {
    const { data, error } = await supabase
      .from('invoices')
      .select(INVOICE_JOIN)
      .order('date', { ascending: false });
    if (error) throw error;
    return data.map(invoiceFromRow);
  },

  async listPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select(PAYMENT_JOIN)
      .order('date', { ascending: false });
    if (error) throw error;
    return data.map(paymentFromRow);
  },

  async getInvoice(id) {
    const { data, error } = await supabase
      .from('invoices')
      .select(INVOICE_JOIN)
      .eq('id', id)
      .single();
    if (error) throw error;
    return invoiceFromRow(data);
  },

  async createInvoice({ patientId, totalAmount, dueDays = 10, invoiceNumber }) {
    const due = new Date();
    due.setDate(due.getDate() + dueDays);
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        patient_id: patientId,
        invoice_number: invoiceNumber || nextInvoiceNumber(),
        due_date: due.toISOString().split('T')[0],
        total_amount: Number(totalAmount) || 0,
      })
      .select(INVOICE_JOIN)
      .single();
    if (error) throw error;
    return invoiceFromRow(data);
  },

  // Correct a wrong invoice total (e.g. a fee typed wrong when the treatment
  // was logged). balance_due is generated; status is not payment-driven here,
  // so the caller passes the recomputed status. New total must be >= amount
  // already paid (the DB also enforces paid <= total).
  async updateInvoiceTotal(id, totalAmount, status) {
    const { data, error } = await supabase
      .from('invoices')
      .update({ total_amount: Number(totalAmount) || 0, status })
      .eq('id', id)
      .select(INVOICE_JOIN)
      .single();
    if (error) throw error;
    return invoiceFromRow(data);
  },

  // Waive (write off) an unpaid invoice: zero the total so the generated
  // balance_due becomes 0, and stamp the terminal 'Waived' status. Requires
  // migration 0008.
  async waiveInvoice(id) {
    const { data, error } = await supabase
      .from('invoices')
      .update({ total_amount: 0, status: 'Waived' })
      .eq('id', id)
      .select(INVOICE_JOIN)
      .single();
    if (error) throw error;
    return invoiceFromRow(data);
  },

  // The BEFORE-INSERT trigger refuses overpayment; the AFTER trigger
  // recalculates the invoice. We just insert.
  async addPayment({ invoiceId, patientId, amount, method }) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        patient_id: patientId ?? null,
        amount: Number(amount),
        method: method ?? 'Cash',
      })
      .select(PAYMENT_JOIN)
      .single();
    if (error) throw error;
    return paymentFromRow(data);
  },
};
