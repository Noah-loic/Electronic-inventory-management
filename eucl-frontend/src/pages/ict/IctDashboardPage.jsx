import { useAuth } from '../../context/AuthContext'

export default function IctDashboardPage() {
    const { auth } = useAuth()
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome, {auth?.username}</h1>
            <p className="text-sm text-gray-500">ICT Staff Portal — manage devices, assignments and repair requests.</p>
        </div>
    )
}
