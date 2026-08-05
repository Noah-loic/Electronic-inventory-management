import { createContext, useContext, useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(() => {
        const token = localStorage.getItem('token')
        const user = localStorage.getItem('user')
        return token && user ? { token, ...JSON.parse(user) } : null
    })

    const login = (data) => {
        const roles = Array.isArray(data.roleNames)
            ? data.roleNames
            : Array.from(data.roleNames ?? [])

        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify({
            id: data.id,
            username: data.username,
            roles,
            permissions: data.permissions,
        }))
        setAuth({ ...data, roles })
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setAuth(null)
    }

    const refreshAuth = async () => {
        if (!auth) return
        try {
            const { data } = await axiosInstance.get(`/users/${auth.id}`)
            const updated = {
                ...auth,
                permissions: data.permissions ?? [],
                roles: Array.isArray(data.roles) ? data.roles.map(r => r.name) : [],
                username: data.username,
            }
            localStorage.setItem('user', JSON.stringify({
                id: updated.id,
                username: updated.username,
                roles: updated.roles,
                permissions: updated.permissions,
            }))
            setAuth(updated)
        } catch (err) {
            // only logout if token is actually expired/invalid, ignore network errors
            if (err?.response?.status === 401) logout()
        }
    }

    useEffect(() => {
        refreshAuth()
        const onFocus = () => refreshAuth()
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [])

    return (
        <AuthContext.Provider value={{ auth, login, logout, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
