import axios from 'axios';

// Configured base URL - placeholder for ASP.NET Core backend integration later
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.drzaiddental.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const patientApi = {
  // Get all patients, supporting search and filters
  getAll: async (search = '', filter = '') => {
    return apiClient.get('/patients', { params: { search, filter } });
  },

  // Get patient details by ID
  getById: async (id) => {
    return apiClient.get(`/patients/${id}`);
  },

  // Register a new patient
  create: async (patientData) => {
    return apiClient.post('/patients', patientData);
  },

  // Update existing patient information
  update: async (id, patientData) => {
    return apiClient.put(`/patients/${id}`, patientData);
  },

  // Delete/Archive patient record
  delete: async (id) => {
    return apiClient.delete(`/patients/${id}`);
  }
};
