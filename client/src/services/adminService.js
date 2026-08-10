import api from './api'

const adminService = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  users: (params = {}) => api.get('/admin/users', { params }).then((r) => r.data),
  doctors: (params = {}) => api.get('/admin/doctors', { params }).then((r) => r.data),
  patients: (params = {}) => api.get('/admin/patients', { params }).then((r) => r.data),
  appointments: (params = {}) => api.get('/admin/appointments', { params }).then((r) => r.data),
  setDoctorVerification: (doctorId, isVerified) =>
    api.put(`/admin/doctors/${doctorId}/verify`, { isVerified }).then((r) => r.data),
  setUserActive: (userId, isActive) =>
    api.put(`/admin/users/${userId}/status`, { isActive }).then((r) => r.data),
  removeUser: (userId) => api.delete(`/admin/users/${userId}`).then((r) => r.data),
}

export default adminService
