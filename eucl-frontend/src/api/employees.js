import api from './axiosInstance'

const BASE = '/employees'

export default {
    getAll: () => api.get(BASE),
    create: (data) => api.post(BASE, data),
    update: (id, data) => api.put(`${BASE}/${id}`, data),
    remove: (id) => api.delete(`${BASE}/${id}`),
    downloadTemplate: () => api.get(`${BASE}/import-template`, { responseType: 'blob' }),
    bulkImport: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post(`${BASE}/bulk-import`, formData)
    },
}
