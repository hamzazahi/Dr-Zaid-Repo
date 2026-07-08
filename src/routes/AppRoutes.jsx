import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

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

function RouteFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
      <CircularProgress size={32} />
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
        <Route path="/expenses" element={<Expenses />} />
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
        <Route path="/locations" element={<Locations />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
