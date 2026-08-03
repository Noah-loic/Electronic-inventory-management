import api from './axiosInstance'

const BASE = '/roles'

export default {
    getAll: () => api.get(BASE),
    create: (data) => api.post(BASE, data),
    update: (id, data) => api.put(`${BASE}/${id}`, data),
    remove: (id) => api.delete(`${BASE}/${id}`),
}
