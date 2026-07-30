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
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify({
            id: data.id,
            username: data.username,
            role: data.role,
            permissions: data.permissions,
        }))
        setAuth(data)
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
                role: data.role,
                username: data.username,
            }
            localStorage.setItem('user', JSON.stringify({
                id: updated.id,
                username: updated.username,
                role: updated.role,
                permissions: updated.permissions,
            }))
            setAuth(updated)
        } catch {
            // token expired or user deleted — force logout
            logout()
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
