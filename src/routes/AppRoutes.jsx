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
const Billing = lazy(() => import('../pages/Billing'));
const Payments = lazy(() => import('../pages/Payments'));
const Reports = lazy(() => import('../pages/Reports'));
const Prescriptions = lazy(() => import('../pages/Prescriptions'));
const Inventory = lazy(() => import('../pages/Inventory'));
const LabWork = lazy(() => import('../pages/LabWork'));
const Settings = lazy(() => import('../pages/Settings'));
const Staff = lazy(() => import('../pages/Staff'));

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
        <Route path="/billing" element={<Billing />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/lab-work" element={<LabWork />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
