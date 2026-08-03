import { useAuth } from '../../context/AuthContext'
import { PORTAL_NAV_ITEMS } from '../../constants/portalNav'

export default function PortalDashboardPage() {
    const { auth } = useAuth()

    const accessibleItems = PORTAL_NAV_ITEMS.filter(item => !item.permission || auth?.permissions?.includes(item.permission))
    const labels = accessibleItems.filter(item => item.label !== 'Dashboard').map(item => item.label)

    return (
        <div className="max-w-3xl space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-800">Welcome, {auth?.username || 'User'}</h1>
                <p className="text-sm text-gray-500 mt-2">
                    Your portal experience is driven by your assigned permissions.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800">Your roles</h2>
                <div className="flex flex-wrap gap-2 mt-3">
                    {(auth?.roles?.length ? auth.roles : ['No roles assigned']).map(role => (
                        <span key={role} className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">{role}</span>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800">What you can access</h2>
                <p className="text-sm text-gray-600 mt-2">
                    {labels.length > 0 ? `You have access to: ${labels.join(', ')}` : 'You currently do not have access to any additional portal pages.'}
                </p>
            </div>
        </div>
    )
}
