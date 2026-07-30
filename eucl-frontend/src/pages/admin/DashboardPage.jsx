import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import devicesApi from '../../api/devices'
import employeesApi from '../../api/employees'
import assignmentsApi from '../../api/assignments'
import repairRequestsApi from '../../api/repairRequests'
import * as branchesApi from '../../api/branches'

function StatCard({ label, value, sub, color }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color ?? 'text-gray-800'}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    )
}

export default function DashboardPage() {
    const { auth } = useAuth()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            devicesApi.getAll(),
            employeesApi.getAll(),
            assignmentsApi.getAll(),
            repairRequestsApi.getAll(),
            branchesApi.getAll(),
        ]).then(([dRes, eRes, aRes, rRes, bRes]) => {
            const devices = Array.isArray(dRes.data) ? dRes.data : []
            const assignments = Array.isArray(aRes.data) ? aRes.data : []
            const requests = Array.isArray(rRes.data) ? rRes.data : []
            setStats({
                totalDevices: devices.length,
                activeDevices: devices.filter(d => d.status === 'ACTIVE').length,
                unassignedDevices: devices.filter(d => d.status === 'UNASSIGNED').length,
                inRepair: devices.filter(d => d.status === 'IN_REPAIR').length,
                decommissioned: devices.filter(d => d.status === 'DECOMMISSIONED').length,
                totalEmployees: Array.isArray(eRes.data) ? eRes.data.length : 0,
                activeAssignments: assignments.filter(a => a.isActive).length,
                pendingRequests: requests.filter(r => r.status === 'PENDING').length,
                inProgressRequests: requests.filter(r => r.status === 'IN_PROGRESS').length,
                totalBranches: Array.isArray(bRes.data) ? bRes.data.length : 0,
            })
        }).catch(() => setStats(null))
          .finally(() => setLoading(false))
    }, [])

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome back, {auth?.username} 👋</h1>
            <p className="text-gray-500 mt-1 text-sm mb-8">Here's what's happening in the EUCL inventory system.</p>

            {loading ? (
                <div className="text-sm text-gray-400">Loading...</div>
            ) : !stats ? (
                <div className="text-sm text-red-400">Failed to load dashboard data.</div>
            ) : (
                <>
                    {/* Top row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <StatCard label="Total Devices" value={stats.totalDevices} sub={`${stats.unassignedDevices} unassigned`} />
                        <StatCard label="Active Assignments" value={stats.activeAssignments} color="text-green-600" />
                        <StatCard label="Total Employees" value={stats.totalEmployees} sub={`across ${stats.totalBranches} branches`} />
                        <StatCard label="Pending Repairs" value={stats.pendingRequests} color={stats.pendingRequests > 0 ? 'text-yellow-600' : 'text-gray-800'} sub={`${stats.inProgressRequests} in progress`} />
                    </div>

                    {/* Device breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <p className="text-sm font-semibold text-gray-700 mb-4">Device Status Breakdown</p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.activeDevices}</p>
                                <p className="text-xs text-gray-400 mt-1">Active</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-500">{stats.unassignedDevices}</p>
                                <p className="text-xs text-gray-400 mt-1">Unassigned</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">{stats.inRepair}</p>
                                <p className="text-xs text-gray-400 mt-1">In Repair</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-500">{stats.decommissioned}</p>
                                <p className="text-xs text-gray-400 mt-1">Decommissioned</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
