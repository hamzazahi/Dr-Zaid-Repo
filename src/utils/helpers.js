export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// A short, human-friendly patient reference for display. Database ids are long
// UUIDs (live) or `pat-…` strings (demo) - neither is meaningful to staff, so
// we show a compact code derived from the id (stable per patient, for reference
// only - patients are looked up by name/phone, never by this code).
export const patientRef = (id) => {
  if (!id) return '-';
  const tail = String(id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `P-${tail}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const calculateAge = (dobString) => {
  if (!dobString) return '';
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
    case 'active':
      return 'info'; // blue
    case 'arrived':
    case 'partially paid':
      return 'warning'; // orange
    case 'in progress':
      return 'secondary'; // purple
    case 'completed':
    case 'paid':
      return 'success'; // green
    case 'no show':
    case 'cancelled':
    case 'unpaid':
    case 'pending payment':
    case 'overdue':
      return 'error'; // red
    default:
      return 'default';
  }
};
