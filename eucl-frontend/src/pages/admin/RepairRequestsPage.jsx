import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import repairRequestsApi from '../../api/repairRequests'
import devicesApi from '../../api/devices'
import Pagination from '../../components/Pagination'
import ComboBox from '../../components/ComboBox'

const PAGE_SIZE = 8

const STATUSES = ['PENDING', 'IN_PROGRESS', 'REPAIRED', 'UNREPAIRABLE']

const statusBadge = {
    PENDING:       'bg-yellow-100 text-yellow-700',
    IN_PROGRESS:   'bg-blue-100 text-blue-700',
    REPAIRED:      'bg-green-100 text-green-700',
    UNREPAIRABLE:  'bg-red-100 text-red-600',
}

const nextStatuses = {
    PENDING:      ['IN_PROGRESS'],
    IN_PROGRESS:  ['REPAIRED', 'UNREPAIRABLE'],
    REPAIRED:     [],
    UNREPAIRABLE: [],
}

export default function RepairRequestsPage({ branchOnly = false, useTagInput = false }) {
    const { auth } = useAuth()
    const canCreate = auth?.permissions?.includes('REPAIR_REQUEST_CREATE')
    const canUpdate = auth?.permissions?.includes('REPAIR_REQUEST_UPDATE')
    const [requests, setRequests] = useState([])
    const [devices, setDevices] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)

    // Submit modal
    const [submitModal, setSubmitModal] = useState(false)
    const [submitForm, setSubmitForm] = useState({ deviceId: '', issueDescription: '' })
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    // Status update modal
    const [updateModal, setUpdateModal] = useState(null) // holds the request object
    const [updateForm, setUpdateForm] = useState({ newStatus: '', resolutionNote: '' })
    const [updating, setUpdating] = useState(false)
    const [updateError, setUpdateError] = useState('')

    const fetchAll = async () => {
        try {
            const [rRes, dRes] = await Promise.all([
                branchOnly ? repairRequestsApi.getByBranch(auth.id) : repairRequestsApi.getAll(),
                devicesApi.getAll(),
            ])
            setRequests(Array.isArray(rRes.data) ? rRes.data : [])
            setDevices(Array.isArray(dRes.data) ? dRes.data : [])
        } catch {
            setRequests([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAll() }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitError('')
        setSubmitting(true)
        try {
            let deviceId = Number(submitForm.deviceId)
            if (useTagInput) {
                const match = devices.find(d => d.tagNumber.toLowerCase() === submitForm.tagNumber?.trim().toLowerCase())
                if (!match) { setSubmitError('No device found with that tag number'); setSubmitting(false); return }
                deviceId = match.id
            }
            await repairRequestsApi.submit({
                deviceId,
                requestedById: auth.id,
                issueDescription: submitForm.issueDescription,
            })
            setSubmitModal(false)
            setSubmitForm({ deviceId: '', issueDescription: '' })
            await fetchAll()
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    const openUpdate = (req) => {
        setUpdateModal(req)
        setUpdateForm({ newStatus: nextStatuses[req.status][0] ?? '', resolutionNote: req.resolutionNote ?? '' })
        setUpdateError('')
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        setUpdateError('')
        setUpdating(true)
        try {
            await repairRequestsApi.updateStatus(updateModal.id, {
                newStatus: updateForm.newStatus,
                handledById: auth.id,
                resolutionNote: updateForm.resolutionNote || null,
            })
            setUpdateModal(null)
            await fetchAll()
        } catch (err) {
            setUpdateError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setUpdating(false)
        }
    }

    const displayed = requests
        .filter(r => filterStatus === 'ALL' || r.status === filterStatus)
        .filter(r => {
            const q = search.toLowerCase()
            return !q ||
                (r.requestedBy?.employee?.name ?? r.requestedBy?.username ?? '').toLowerCase().includes(q) ||
                (r.handledBy?.employee?.name ?? r.handledBy?.username ?? '').toLowerCase().includes(q)
        })
    const totalPages = Math.ceil(displayed.length / PAGE_SIZE)
    const paginated = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Only show non-ACTIVE devices for repair submission (active = assigned, still valid to request repair)
    const repairableDevices = devices.filter(d => d.status !== 'DECOMMISSIONED')

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Repair Requests</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track and manage device repair requests</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => { setSubmitForm({ deviceId: '', issueDescription: '' }); setSubmitError(''); setSubmitModal(true) }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                    >
                        + New Request
                    </button>
                )}
            </div>

            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by requested by or handled by..."
                className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            {/* Status filter tabs */}
            <div className="flex gap-2 mb-4">
                {['ALL', ...STATUSES].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            filterStatus === s
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                    >
                        {s === 'ALL' ? 'All' : s.replace('_', ' ')}
                        {s !== 'ALL' && (
                            <span className="ml-1.5 opacity-70">{requests.filter(r => r.status === s).length}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : displayed.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No repair requests found.</div>
                ) : (
                    <>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Device</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Issue</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Requested By</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Handled By</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Requested At</th>
                                <th className="px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.map((req, i) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{req.device?.model}</div>
                                        <div className="text-xs text-gray-400 font-mono">{req.device?.tagNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{req.issueDescription}</td>
                                    <td className="px-6 py-4 text-gray-500">{req.requestedBy?.employee?.name ?? req.requestedBy?.username ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-500">{req.handledBy?.employee?.name ?? req.handledBy?.username ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge[req.status]}`}>
                                            {req.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {canUpdate && nextStatuses[req.status].length > 0 && (
                                            <button
                                                onClick={() => openUpdate(req)}
                                                className="text-blue-600 hover:text-blue-800 font-medium transition"
                                            >
                                                Update
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                    </>
                )}
            </div>

            {/* Submit Modal */}
            {submitModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">New Repair Request</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
                                {useTagInput ? (
                                    <input
                                        required
                                        value={submitForm.tagNumber ?? ''}
                                        onChange={e => setSubmitForm(f => ({ ...f, tagNumber: e.target.value, deviceId: '' }))}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter device tag number e.g. TAG-001"
                                    />
                                ) : (
                                    <ComboBox
                                        required
                                        value={submitForm.deviceId}
                                        onChange={v => setSubmitForm(f => ({ ...f, deviceId: v }))}
                                        options={repairableDevices.map(d => ({ value: d.id, label: `${d.model} — ${d.tagNumber}` }))}
                                        placeholder="Search device..."
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={submitForm.issueDescription}
                                    onChange={e => setSubmitForm(f => ({ ...f, issueDescription: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Describe the issue..."
                                />
                            </div>
                            {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setSubmitModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {updateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-1">Update Repair Status</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {updateModal.device?.model} — <span className="font-mono">{updateModal.device?.tagNumber}</span>
                        </p>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                                <select
                                    required
                                    value={updateForm.newStatus}
                                    onChange={e => setUpdateForm(f => ({ ...f, newStatus: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {nextStatuses[updateModal.status].map(s => (
                                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Note <span className="text-gray-400 font-normal">(optional)</span></label>
                                <textarea
                                    rows={3}
                                    value={updateForm.resolutionNote}
                                    onChange={e => setUpdateForm(f => ({ ...f, resolutionNote: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Describe what was done..."
                                />
                            </div>
                            {updateError && <p className="text-red-500 text-sm">{updateError}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setUpdateModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                                >
                                    {updating ? 'Saving...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
