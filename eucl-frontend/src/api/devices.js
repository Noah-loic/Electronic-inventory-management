import api from './axiosInstance'

const BASE = '/devices'

export default {
    getAll: () => api.get(BASE),
    create: (data) => api.post(BASE, data),
    update: (id, data) => api.put(`${BASE}/${id}`, data),
    changeStatus: (id, data) => api.put(`${BASE}/${id}/status`, data),
    getStatusHistory: (id) => api.get(`${BASE}/${id}/status-history`),
    remove: (id) => api.delete(`${BASE}/${id}`),
    downloadTemplate: () => api.get(`${BASE}/import-template`, { responseType: 'blob' }),
    bulkImport: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post(`${BASE}/bulk-import`, formData)
    },
}
