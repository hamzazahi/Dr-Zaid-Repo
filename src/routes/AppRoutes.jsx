import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Grid, Skeleton } from '@mui/material';
import { usePermissions } from '../hooks/usePermissions';

// Route guard for doctor-only screens: a role without view access is sent
// back to the dashboard (the database would refuse the data anyway - this
// keeps the UI honest).
function RequireAccess({ path, children }) {
  const { canView } = usePermissions();
  if (!canView(path)) return <Navigate to="/" replace />;
  return children;
}

// Route-level code splitting: each page becomes its own chunk and is only
// fetched when its route is visited, keeping the initial bundle small.
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Patients = lazy(() => import('../pages/Patients'));
const PatientProfile = lazy(() => import('../pages/PatientProfile'));
const Appointments = lazy(() => import('../pages/Appointments'));
const Treatments = lazy(() => import('../pages/Treatments'));
const TreatmentPlans = lazy(() => import('../pages/TreatmentPlans'));
const Recalls = lazy(() => import('../pages/Recalls'));
const OnlineBooking = lazy(() => import('../pages/OnlineBooking'));
const Billing = lazy(() => import('../pages/Billing'));
const Payments = lazy(() => import('../pages/Payments'));
const Expenses = lazy(() => import('../pages/Expenses'));
const Insurance = lazy(() => import('../pages/Insurance'));
const Memberships = lazy(() => import('../pages/Memberships'));
const Reports = lazy(() => import('../pages/Reports'));
const Prescriptions = lazy(() => import('../pages/Prescriptions'));
const Inventory = lazy(() => import('../pages/Inventory'));
const LabWork = lazy(() => import('../pages/LabWork'));
const Documents = lazy(() => import('../pages/Documents'));
const Forms = lazy(() => import('../pages/Forms'));
const PerioChart = lazy(() => import('../pages/PerioChart'));
const Settings = lazy(() => import('../pages/Settings'));
const Staff = lazy(() => import('../pages/Staff'));
const AuditLog = lazy(() => import('../pages/AuditLog'));
const Locations = lazy(() => import('../pages/Locations'));
const Marketing = lazy(() => import('../pages/Marketing'));
const Messages = lazy(() => import('../pages/Messages'));
const Assistant = lazy(() => import('../pages/Assistant'));
const Imaging = lazy(() => import('../pages/Imaging'));
const Referrals = lazy(() => import('../pages/Referrals'));

// Page-shaped skeleton: mirrors the standard module layout (title, stat cards,
// content card) so lazy-loaded routes feel instant instead of flashing a spinner.
function RouteFallback() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }} aria-busy="true" aria-label="Loading page">
      <Box>
        <Skeleton variant="text" width={220} height={34} />
        <Skeleton variant="text" width={320} height={20} />
      </Box>
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={6} md={3} key={i}>
            <Skeleton variant="rounded" height={84} sx={{ borderRadius: '12px' }} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={320} sx={{ borderRadius: '12px' }} />
    </Box>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientProfile />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/treatments" element={<Treatments />} />
        <Route path="/treatment-plans" element={<TreatmentPlans />} />
        <Route path="/recalls" element={<Recalls />} />
        <Route path="/online-booking" element={<OnlineBooking />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/expenses" element={<RequireAccess path="/expenses"><Expenses /></RequireAccess>} />
        <Route path="/insurance" element={<Insurance />} />
        <Route path="/memberships" element={<Memberships />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/lab-work" element={<LabWork />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/perio" element={<PerioChart />} />
        <Route path="/imaging" element={<Imaging />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/locations" element={<RequireAccess path="/locations"><Locations /></RequireAccess>} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/staff" element={<RequireAccess path="/staff"><Staff /></RequireAccess>} />
        <Route path="/audit-log" element={<RequireAccess path="/audit-log"><AuditLog /></RequireAccess>} />
        <Route path="/settings" element={<RequireAccess path="/settings"><Settings /></RequireAccess>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
