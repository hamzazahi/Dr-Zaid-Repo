import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.drzaiddental.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const treatmentApi = {
  // Get all recorded treatments
  getAll: async () => {
    return apiClient.get('/treatments');
  },

  // Get treatments for a specific patient
  getByPatientId: async (patientId) => {
    return apiClient.get(`/patients/${patientId}/treatments`);
  },

  // Add a new clinical treatment record
  create: async (treatmentData) => {
    return apiClient.post('/treatments', treatmentData);
  }
};
