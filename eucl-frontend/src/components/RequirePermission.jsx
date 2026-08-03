import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequirePermission({ permission, children }) {
    const { auth } = useAuth()

    if (permission && !auth?.permissions?.includes(permission)) {
        return <Navigate to="/unauthorized" replace />
    }

    return children
}
