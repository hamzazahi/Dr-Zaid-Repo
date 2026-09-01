// Focus mode: for clean demos, show only the modules a dentist cares about
// most. Everything else stays fully built and reachable by URL - this only
// trims what appears in the sidebar and the Ctrl+K search, so the app feels
// simple and uncluttered. Flip FOCUS_MODE to false to show the full product.
export const FOCUS_MODE = true;

export const CORE_PATHS = new Set([
  '/',                 // Dashboard
  '/patients',         // Patients
  '/appointments',     // Appointments
  '/treatments',       // Treatments
  '/treatment-plans',  // Treatment Plans
  '/orthodontics',     // Orthodontics (Dr. Babar)
  '/lab-work',         // Lab Dispatch
  '/prescriptions',    // Prescriptions
  '/perio',            // Perio Chart
  '/documents',        // Documents
  '/billing',          // Billing
  '/reports',          // Reports
  '/staff',            // Staff
]);

export const inFocus = (path) => !FOCUS_MODE || CORE_PATHS.has(path);
