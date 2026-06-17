import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.drzaiddental.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const billingApi = {
  // Get all invoices
  getInvoices: async () => {
    return apiClient.get('/billing/invoices');
  },

  // Get invoice details by ID
  getInvoiceById: async (id) => {
    return apiClient.get(`/billing/invoices/${id}`);
  },

  // Create a new invoice
  createInvoice: async (invoiceData) => {
    return apiClient.post('/billing/invoices', invoiceData);
  },

  // Record a payment against an invoice
  recordPayment: async (paymentData) => {
    return apiClient.post('/billing/payments', paymentData);
  },

  // Get transaction/payment history
  getPayments: async () => {
    return apiClient.get('/billing/payments');
  }
};
