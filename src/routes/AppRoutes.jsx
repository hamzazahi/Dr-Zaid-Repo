import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Patients from '../pages/Patients';
import PatientProfile from '../pages/PatientProfile';
import Appointments from '../pages/Appointments';
import Treatments from '../pages/Treatments';
import Billing from '../pages/Billing';
import Payments from '../pages/Payments';
import Reports from '../pages/Reports';
import Prescriptions from '../pages/Prescriptions';
import Inventory from '../pages/Inventory';
import Settings from '../pages/Settings';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/patients" element={<Patients />} />
      <Route path="/patients/:id" element={<PatientProfile />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/treatments" element={<Treatments />} />
      <Route path="/billing" element={<Billing />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/prescriptions" element={<Prescriptions />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
