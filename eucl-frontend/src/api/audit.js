import api from './axiosInstance'

export default {
    getDeviceReport: (branchId, year) => api.get('/audit/devices', { params: { branchId, year } }),
    exportExcel: (branchId, year) => api.get('/audit/export', { params: { branchId, year }, responseType: 'blob' }),
}
