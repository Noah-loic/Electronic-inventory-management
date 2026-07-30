import api from './axiosInstance'

const BASE = '/assignments'

export default {
    getAll: () => api.get(BASE),
    assign: (data) => api.post(`${BASE}/assign`, data),
    unassign: (id, note) => api.put(`${BASE}/${id}/unassign`, null, { params: { note } }),
}
