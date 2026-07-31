import api from './axiosInstance'

export default {
    getDeviceReport: (branchId, year) => api.get('/audit/devices', { params: { branchId, year } }),
}
