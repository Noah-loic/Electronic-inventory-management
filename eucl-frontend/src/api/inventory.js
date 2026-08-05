import api from './axiosInstance'

export const getInventory = (branchId, year) => api.get('/inventory', { params: { branchId, year } })
export const saveCheck = (data) => api.post('/inventory/check', data)
export const downloadTemplate = (branchId, year) => api.get('/inventory/template', { params: { branchId, year }, responseType: 'blob' })
export const bulkImport = (file, branchId, year) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/inventory/bulk-import', formData, { params: { branchId, year } })
}
