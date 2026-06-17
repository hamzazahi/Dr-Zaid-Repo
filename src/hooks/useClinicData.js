import { useContext } from 'react';
import { ClinicContext } from '../context/ClinicContextCore';

export const useClinicData = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinicData must be used within a ClinicProvider');
  }
  return context;
};
