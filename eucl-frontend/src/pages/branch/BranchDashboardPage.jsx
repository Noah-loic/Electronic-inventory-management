import { useAuth } from '../../context/AuthContext'

export default function BranchDashboardPage() {
    const { auth } = useAuth()
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome, {auth?.username}</h1>
            <p className="text-sm text-gray-500">Branch Manager Portal — submit and track repair requests for your branch.</p>
        </div>
    )
}
