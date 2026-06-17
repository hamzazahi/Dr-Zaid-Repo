import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.drzaiddental.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const appointmentApi = {
  // Get all appointments
  getAll: async () => {
    return apiClient.get('/appointments');
  },

  // Get appointments scheduled for today
  getToday: async () => {
    return apiClient.get('/appointments/today');
  },

  // Schedule a new appointment
  create: async (appointmentData) => {
    return apiClient.post('/appointments', appointmentData);
  },

  // Update appointment status (Scheduled, Arrived, In Progress, Completed, No Show)
  updateStatus: async (id, status) => {
    return apiClient.patch(`/appointments/${id}/status`, { status });
  },

  // Assign dentist to an appointment
  assignDentist: async (id, dentistId) => {
    return apiClient.patch(`/appointments/${id}/assign-dentist`, { dentistId });
  },

  // Delete/Cancel an appointment
  cancel: async (id) => {
    return apiClient.delete(`/appointments/${id}`);
  }
};
