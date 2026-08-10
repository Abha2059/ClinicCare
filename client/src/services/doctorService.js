import api from './api'

const doctorService = {
  /** Public directory listing with search / filter / sort / pagination. */
  list: (params = {}) => api.get('/doctors', { params }).then((r) => r.data),
  get: (id) => api.get(`/doctors/${id}`).then((r) => r.data),
  /** Free/booked slots for a doctor on a given YYYY-MM-DD date. */
  slots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }).then((r) => r.data),
  featured: (limit = 6) => api.get('/doctors', { params: { limit, sort: 'rating' } }).then((r) => r.data),

  // Doctor-owned resources
  me: () => api.get('/doctors/me/profile').then((r) => r.data),
  updateMe: (payload) => api.put('/doctors/me/profile', payload).then((r) => r.data),
  updateAvailability: (payload) => api.put('/doctors/me/availability', payload).then((r) => r.data),
  stats: () => api.get('/doctors/me/stats').then((r) => r.data),

  // Admin-managed
  create: (payload) => api.post('/doctors', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/doctors/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/doctors/${id}`).then((r) => r.data),
}

export default doctorService
