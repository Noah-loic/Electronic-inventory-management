import api from './axiosInstance'

const BASE = '/users'

export default {
    getAll: () => api.get(BASE),
    create: (data) => api.post(BASE, data),
    update: (id, data) => api.put(`${BASE}/${id}`, data),
    remove: (id) => api.delete(`${BASE}/${id}`),
    setPermissions: (id, permissions) => api.put(`${BASE}/${id}/permissions`, { permissions }),
    resetPermissions: (id) => api.post(`${BASE}/${id}/permissions/reset`),
}
