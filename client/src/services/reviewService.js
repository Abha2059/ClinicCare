import api from './api'

const reviewService = {
  listForDoctor: (doctorId, params = {}) =>
    api.get(`/doctors/${doctorId}/reviews`, { params }).then((r) => r.data),
  create: (doctorId, payload) =>
    api.post(`/doctors/${doctorId}/reviews`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/reviews/${id}`).then((r) => r.data),
  /** Reviews written about the logged-in doctor. */
  mine: () => api.get('/reviews/me').then((r) => r.data),
}

export default reviewService
