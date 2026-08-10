import api from './api'

const specialtyService = {
  list: (params = {}) => api.get('/specialties', { params }).then((r) => r.data),
  get: (idOrSlug) => api.get(`/specialties/${idOrSlug}`).then((r) => r.data),
  create: (payload) => api.post('/specialties', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/specialties/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/specialties/${id}`).then((r) => r.data),
}

export default specialtyService
