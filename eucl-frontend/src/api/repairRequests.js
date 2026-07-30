import api from './axiosInstance'

const BASE = '/repair-requests'

export default {
    getAll: () => api.get(BASE),
    getByBranch: (userId) => api.get(`${BASE}/branch`, { params: { userId } }),
    submit: (data) => api.post(BASE, data),
    updateStatus: (id, data) => api.put(`${BASE}/${id}/status`, data),
}
