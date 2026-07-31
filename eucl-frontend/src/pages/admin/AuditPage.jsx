import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import * as branchesApi from '../../api/branches'
import auditApi from '../../api/audit'
import ComboBox from '../../components/ComboBox'

const STATUSES = ['UNASSIGNED', 'ACTIVE', 'IN_REPAIR', 'DECOMMISSIONED']

const statusBadge = {
    ACTIVE: 'bg-green-100 text-green-700',
    UNASSIGNED: 'bg-gray-100 text-gray-600',
    IN_REPAIR: 'bg-yellow-100 text-yellow-700',
    DECOMMISSIONED: 'bg-red-100 text-red-600',
}

function formatFiscalYearLabel(startYear) {
    return `July ${startYear} – June ${startYear + 1}`
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString()
}

export default function AuditPage() {
    const { auth } = useAuth()
    const [branches, setBranches] = useState([])
    const [branchId, setBranchId] = useState('')
    const [year, setYear] = useState(new Date().getFullYear())
    const [report, setReport] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [hasGenerated, setHasGenerated] = useState(false)

    const fiscalYears = useMemo(() => {
        const current = new Date().getFullYear()
        return Array.from({ length: 5 }, (_, idx) => current - idx).map(y => ({ value: y, label: formatFiscalYearLabel(y) }))
    }, [])

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const res = await branchesApi.getAll()
                setBranches(Array.isArray(res.data) ? res.data : [])
            } catch {
                setBranches([])
            }
        }
        loadBranches()
    }, [])

    const branchOptions = branches.map(branch => ({ value: branch.id, label: branch.name }))

    const handleGenerate = async () => {
        setError('')
        setLoading(true)
        setHasGenerated(true)
        try {
            const res = await auditApi.getDeviceReport(branchId, year)
            setReport(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to load audit report'
            if (message.includes('No devices found for branch id')) {
                setReport([])
                setError('No devices found for the selected branch in this fiscal year.')
            } else {
                setError(message)
                setReport([])
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Audit Report</h1>
                    <p className="text-sm text-gray-500 mt-0.5">View audited device assignment and status history by branch and fiscal year.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="grid gap-4 lg:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                        <ComboBox
                            required
                            value={branchId}
                            onChange={setBranchId}
                            options={branchOptions}
                            placeholder="Select branch..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {fiscalYears.map(fy => (
                                <option key={fy.value} value={fy.value}>{fy.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={!branchId || loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                </div>
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>

            {hasGenerated && !loading && report.length === 0 && !error && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-sm text-gray-500">No devices were found for the selected branch and fiscal year.</div>
            )}

            {report.map(device => (
                <div key={device.deviceId} className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{device.branch?.name ?? device.branch}</p>
                            <h2 className="text-lg font-semibold text-gray-900">{device.tagNumber} — {device.model}</h2>
                            <p className="text-sm text-gray-600">{device.serialNumber} · {device.deviceType}</p>
                        </div>
                        <div>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[device.currentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                                {device.currentStatus.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Assignments</h3>
                            {device.assignmentHistory?.length ? (
                                <div className="overflow-hidden rounded-2xl border border-gray-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Employee</th>
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Assigned At</th>
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Unassigned At</th>
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Assigned By</th>
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {device.assignmentHistory.map(history => (
                                                <tr key={`${device.deviceId}-${history.assignedAt}-${history.employee?.id ?? history.employeeName}`}>
                                                    <td className="px-4 py-3 text-gray-700">{history.employee?.name ?? history.employeeName ?? 'Unknown'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{formatDate(history.assignedAt)}</td>
                                                    <td className="px-4 py-3 text-gray-600">{history.unassignedAt ? formatDate(history.unassignedAt) : 'Active'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{history.assignedBy?.username ?? history.assignedBy?.employee?.name ?? history.assignedByName ?? 'Unknown'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{history.note ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Status Changes</h3>
                            {device.statusHistory?.length ? (
                                <div className="overflow-hidden rounded-2xl border border-gray-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Change</th>
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Reason</th>
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Changed By</th>
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Changed At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {device.statusHistory.map(history => (
                                                <tr key={`${device.deviceId}-${history.changedAt}-${history.oldStatus}`}>
                                                    <td className="px-4 py-3 text-gray-700">{history.oldStatus.replace('_', ' ')} → {history.newStatus.replace('_', ' ')}</td>
                                                    <td className="px-4 py-3 text-gray-600">{history.reason}</td>
                                                    <td className="px-4 py-3 text-gray-600">{history.changedBy?.username ?? history.changedBy?.employee?.name ?? 'Unknown'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{formatDate(history.changedAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}
                        </div>
                        {!device.assignmentHistory?.length && !device.statusHistory?.length && (
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">No activity in this period.</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
