import axiosInstance from './axiosInstance'

export const getAll = () => axiosInstance.get('/departments')
export const create = (data) => axiosInstance.post('/departments', data)
export const update = (id, data) => axiosInstance.put(`/departments/${id}`, data)
export const remove = (id) => axiosInstance.delete(`/departments/${id}`)
