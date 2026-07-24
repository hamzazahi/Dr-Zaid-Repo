// Role-based access matrix - the UI mirror of the database RLS policies
// (supabase/migrations/0002_rls.sql). The database is the enforcement layer;
// this file only decides what the interface SHOWS. Keep the two in sync.
//
// Levels: 'full' (see + edit) · 'view' (see, no create/edit) · 'none' (hidden)

export const ACCESS = {
  '/':                { doctor: 'full', receptionist: 'full' },
  '/assistant':       { doctor: 'full', receptionist: 'full' },
  '/patients':        { doctor: 'full', receptionist: 'full' },
  '/appointments':    { doctor: 'full', receptionist: 'full' },
  '/recalls':         { doctor: 'full', receptionist: 'full' },
  '/online-booking':  { doctor: 'full', receptionist: 'full' },
  '/billing':         { doctor: 'full', receptionist: 'full' },
  '/payments':        { doctor: 'full', receptionist: 'full' },
  '/memberships':     { doctor: 'full', receptionist: 'full' },
  '/documents':       { doctor: 'full', receptionist: 'full' },
  '/forms':           { doctor: 'full', receptionist: 'full' },
  '/lab-work':        { doctor: 'full', receptionist: 'full' },
  '/referrals':       { doctor: 'full', receptionist: 'full' },
  '/insurance':       { doctor: 'full', receptionist: 'full' },
  '/inventory':       { doctor: 'full', receptionist: 'full' },

  // Clinical records: receptionists look things up but never author them.
  '/treatments':      { doctor: 'full', receptionist: 'view' },
  '/treatment-plans': { doctor: 'full', receptionist: 'view' },
  '/prescriptions':   { doctor: 'full', receptionist: 'view' },
  '/perio':           { doctor: 'full', receptionist: 'view' },
  '/imaging':         { doctor: 'full', receptionist: 'view' },

  // Business intelligence: readable, not editable.
  '/reports':         { doctor: 'full', receptionist: 'view' },
  '/marketing':       { doctor: 'full', receptionist: 'view' },

  // Owner/admin territory: hidden from the receptionist entirely.
  '/expenses':        { doctor: 'full', receptionist: 'none' },
  '/locations':       { doctor: 'full', receptionist: 'none' },
  '/staff':           { doctor: 'full', receptionist: 'none' },
  '/audit-log':       { doctor: 'full', receptionist: 'none' },
  '/settings':        { doctor: 'full', receptionist: 'none' },
};

const KNOWN_ROLES = ['doctor', 'receptionist'];

// Unknown/legacy roles are treated as doctor so a stale demo session never
// locks the owner out of their own app.
export const normalizeRole = (role) => (KNOWN_ROLES.includes(role) ? role : 'doctor');

export const canView = (role, path) =>
  (ACCESS[path]?.[normalizeRole(role)] ?? 'full') !== 'none';

export const canEdit = (role, path) =>
  (ACCESS[path]?.[normalizeRole(role)] ?? 'full') === 'full';
