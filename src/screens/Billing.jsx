import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Receipt, CreditCard, Plus, Filter, FileText, ChevronRight, DollarSign, Bookmark } from 'lucide-react';

export default function Billing() {
  const { 
    invoices, 
    invoiceLineItems, 
    payments, 
    patients, 
    procedures, 
    createInvoice, 
    postPayment, 
    currentUser 
  } = useDatabase();

  const [filterStatus, setFilterStatus] = useState('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Create Invoice fields
  const [patientId, setPatientId] = useState('');
  const [lineItems, setLineItems] = useState([{ ProcedureId: '', Quantity: 1, DiscountPct: 0 }]);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Payment Form fields
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Credit Card');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Invoices list filter
  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus === 'all') return true;
    return inv.Status === filterStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Paid': return 'badge-success';
      case 'Partially Paid': return 'badge-info';
      case 'Sent': return 'badge-warning';
      case 'Overdue': return 'badge-danger';
      default: return 'badge-muted';
    }
  };

  // Create Invoice Logic
  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, { ProcedureId: '', Quantity: 1, DiscountPct: 0 }]);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index, field, value) => {
    setLineItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCreateInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!patientId || lineItems.some(it => !it.ProcedureId)) {
      alert("Please choose a patient and select a procedure for all items.");
      return;
    }

    // Map selected UI line items to procedural costs
    const finalItems = lineItems.map(item => {
      const procObj = procedures.find(p => p.ProcedureId === Number(item.ProcedureId));
      return {
        ProcedureId: procObj.ProcedureId,
        ToothNumber: null,
        Description: `${procObj.ProcedureName} (${procObj.ProcedureCode})`,
        Quantity: Number(item.Quantity),
        UnitPrice: procObj.DefaultCost,
        DiscountPct: Number(item.DiscountPct)
      };
    });

    createInvoice(Number(patientId), null, null, finalItems);

    // Reset Form
    setPatientId('');
    setLineItems([{ ProcedureId: '', Quantity: 1, DiscountPct: 0 }]);
    setShowInvoiceModal(false);
  };

  // Post Payment Logic
  const handleTriggerPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPayAmount(invoice.BalanceDue.toFixed(2));
    setShowPaymentModal(true);
  };

  const handlePostPaymentSubmit = (e) => {
    e.preventDefault();
    if (Number(payAmount) <= 0) {
      alert("Payment amount must be greater than zero.");
      return;
    }

    postPayment(
      selectedInvoice.InvoiceId,
      selectedInvoice.PatientId,
      Number(payAmount),
      payMethod,
      payRef,
      payNotes
    );

    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Billing & Invoices</h1>
          <p className="text-sm text-muted">Generate invoices, collect payments, and audit double-entry transactions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvoiceModal(true)}>
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      {/* Invoice Filter Options */}
      <div className="glass-panel flex flex-wrap gap-4 items-end">
        <div>
          <label className="form-label flex items-center gap-1"><Filter size={14} /> Filter by Status</label>
          <select 
            className="form-select" 
            style={{ width: '200px' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Invoices</option>
            <option value="Sent">Sent (Unpaid)</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Billing Invoices Board */}
      <div className="glass-panel">
        <h3 className="text-base font-bold flex items-center gap-2 mb-4">
          <Receipt size={18} className="text-primary" /> Invoice Journal
        </h3>

        <div style={{ overflowX: 'auto' }}>
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-muted border border-dashed border-color rounded-lg">
              <FileText size={48} className="mx-auto mb-3 opacity-30 text-teal-500" />
              <p className="font-semibold text-lg">No Invoices Found</p>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Patient Name</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => {
                  const patient = patients.find(p => p.PatientId === inv.PatientId);
                  return (
                    <tr key={inv.InvoiceId}>
                      <td className="font-semibold">{inv.InvoiceNumber}</td>
                      <td className="font-bold text-primary">{patient ? `${patient.FirstName} ${patient.LastName}` : 'Unknown'}</td>
                      <td>{inv.InvoiceDate}</td>
                      <td>{inv.DueDate}</td>
                      <td className="font-semibold">${inv.TotalAmount.toFixed(2)}</td>
                      <td className="text-green-500 font-semibold">${inv.PaidAmount.toFixed(2)}</td>
                      <td className={inv.BalanceDue > 0 ? "text-yellow-500 font-bold" : "text-muted"}>
                        ${inv.BalanceDue.toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(inv.Status)}`}>
                          {inv.Status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {inv.BalanceDue > 0 && (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleTriggerPayment(inv)}
                            >
                              <CreditCard size={12} /> Pay
                            </button>
                          )}
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => {
                              setSelectedInvoice(inv);
                              // Simple alert mockup or future print details view
                              alert(`Invoice details for ${inv.InvoiceNumber}:\nTotal: $${inv.TotalAmount}\nPaid: $${inv.PaidAmount}\nBalance: $${inv.BalanceDue}\nNotes: ${inv.Notes}`);
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invoice Creation Modal */}
      {showInvoiceModal && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <form className="modal-content animate-scale" onClick={e => e.stopPropagation()} onSubmit={handleCreateInvoiceSubmit} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="text-lg font-bold">Create Clinical Invoice</h3>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowInvoiceModal(false)} style={{ border: 'none', background: 'transparent' }}>&times;</button>
            </div>

            <div className="modal-body flex flex-col gap-4">
              <div>
                <label className="form-label">Select Patient *</label>
                <select className="form-select" value={patientId} onChange={e => setPatientId(e.target.value)} required>
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.PatientId} value={p.PatientId}>{p.FirstName} {p.LastName} ({p.MRN})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Invoice Items</label>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleAddLineItem}>
                    + Add Item
                  </button>
                </div>

                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-sidebar p-3 rounded-lg border border-color">
                      <div className="flex-1">
                        <select 
                          className="form-select text-xs" 
                          value={item.ProcedureId} 
                          onChange={e => handleLineChange(idx, 'ProcedureId', e.target.value)}
                          required
                        >
                          <option value="">-- Choose Dental Procedure --</option>
                          {procedures.map(p => (
                            <option key={p.ProcedureId} value={p.ProcedureId}>{p.ProcedureCode} - {p.ProcedureName} (${p.DefaultCost})</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ width: '70px' }}>
                        <input 
                          type="number" 
                          className="form-input text-xs" 
                          placeholder="Qty" 
                          min="1" 
                          value={item.Quantity} 
                          onChange={e => handleLineChange(idx, 'Quantity', e.target.value)} 
                          required 
                        />
                      </div>

                      <div style={{ width: '90px' }}>
                        <input 
                          type="number" 
                          className="form-input text-xs" 
                          placeholder="Disc %" 
                          min="0" 
                          max="100" 
                          value={item.DiscountPct} 
                          onChange={e => handleLineChange(idx, 'DiscountPct', e.target.value)} 
                        />
                      </div>

                      {lineItems.length > 1 && (
                        <button type="button" className="btn btn-danger text-xs" style={{ padding: '6px' }} onClick={() => handleRemoveLineItem(idx)}>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Internal / Terms Notes</label>
                <textarea 
                  className="form-textarea" 
                  rows="2" 
                  placeholder="Payment Terms, insurance details, etc."
                  value={invoiceNotes}
                  onChange={e => setInvoiceNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Generate Invoice</button>
            </div>
          </form>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <form className="modal-content animate-scale" onClick={e => e.stopPropagation()} onSubmit={handlePostPaymentSubmit} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="text-base font-bold">Record Invoice Payment</h3>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowPaymentModal(false)} style={{ border: 'none', background: 'transparent' }}>&times;</button>
            </div>

            <div className="modal-body flex flex-col gap-4">
              <div className="p-3 bg-sidebar rounded-lg border border-color">
                <div className="text-xs text-muted">Paying For:</div>
                <div className="font-bold text-sm text-primary">{selectedInvoice.InvoiceNumber}</div>
                <div className="text-xs text-muted mt-2">Remaining Balance Due:</div>
                <div className="text-lg font-bold text-yellow-500">${selectedInvoice.BalanceDue.toFixed(2)}</div>
              </div>

              <div>
                <label className="form-label">Payment Amount ($) *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  step="0.01" 
                  max={selectedInvoice.BalanceDue}
                  value={payAmount} 
                  onChange={e => setPayAmount(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label className="form-label">Payment Method *</label>
                <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Insurance">Insurance Claim</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Reference Number (TXN / Claim ID)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. TXN-129048, CHQ-204"
                  value={payRef} 
                  onChange={e => setPayRef(e.target.value)} 
                />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea 
                  className="form-textarea" 
                  rows="2" 
                  placeholder="Add details about payment receipt..."
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Post Credit Entry</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
