import axiosInstance from './axiosInstance'

export const getAll = () => axiosInstance.get('/branches')
export const getById = (id) => axiosInstance.get(`/branches/${id}`)
export const create = (data) => axiosInstance.post('/branches', data)
export const update = (id, data) => axiosInstance.put(`/branches/${id}`, data)
export const remove = (id) => axiosInstance.delete(`/branches/${id}`)
