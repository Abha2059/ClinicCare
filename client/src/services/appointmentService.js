import api from './api'

const appointmentService = {
  /** Book a new appointment. Server enforces slot availability. */
  create: (payload) => api.post('/appointments', payload).then((r) => r.data),
  /** Role-aware list: patients see their own, doctors see theirs, admin sees all. */
  list: (params = {}) => api.get('/appointments', { params }).then((r) => r.data),
  get: (id) => api.get(`/appointments/${id}`).then((r) => r.data),
  /** Status transitions: confirmed | completed | cancelled | rejected. */
  updateStatus: (id, status, extra = {}) =>
    api.put(`/appointments/${id}`, { status, ...extra }).then((r) => r.data),
  cancel: (id, reason) =>
    api.put(`/appointments/${id}`, { status: 'cancelled', cancellationReason: reason }).then((r) => r.data),
  remove: (id) => api.delete(`/appointments/${id}`).then((r) => r.data),
  /** Patient dashboard summary counters. */
  stats: () => api.get('/appointments/stats/summary').then((r) => r.data),
}

export default appointmentService
