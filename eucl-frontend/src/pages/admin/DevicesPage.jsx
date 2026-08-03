import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import devicesApi from '../../api/devices'
import * as branchesApi from '../../api/branches'
import Pagination from '../../components/Pagination'
import BulkImportModal from '../../components/BulkImportModal'
import ComboBox from '../../components/ComboBox'

const PAGE_SIZE = 8

const STATUSES = ['UNASSIGNED', 'ACTIVE', 'IN_REPAIR', 'DECOMMISSIONED']

const statusBadge = {
    ACTIVE:         'bg-green-100 text-green-700',
    UNASSIGNED:     'bg-gray-100 text-gray-600',
    IN_REPAIR:      'bg-yellow-100 text-yellow-700',
    DECOMMISSIONED: 'bg-red-100 text-red-600',
}

const empty = { tagNumber: '', model: '', serialNumber: '', deviceType: '', status: 'UNASSIGNED', branchId: '' }

export default function DevicesPage() {
    const { auth } = useAuth()
    const canUpdate = auth?.permissions?.includes('DEVICE_UPDATE')
    const canEdit = auth?.permissions?.includes('DEVICE_CREATE') || canUpdate
    const canDelete = auth?.permissions?.includes('DEVICE_DELETE')
    const [devices, setDevices] = useState([])
    const [branches, setBranches] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState(empty)
    const [editId, setEditId] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [statusModal, setStatusModal] = useState(false)
    const [statusDevice, setStatusDevice] = useState(null)
    const [statusForm, setStatusForm] = useState({ newStatus: '', reason: '' })
    const [statusSaving, setStatusSaving] = useState(false)
    const [statusError, setStatusError] = useState('')
    const [historyModal, setHistoryModal] = useState(false)
    const [historyEntries, setHistoryEntries] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [bulkModal, setBulkModal] = useState(false)

    const hqBranch = branches.find(b => /head(quarter)?|hq/i.test(b.name)) ?? branches[0] ?? null

    const fetchAll = async () => {
        const [dRes, bRes] = await Promise.allSettled([devicesApi.getAll(), branchesApi.getAll()])
        setDevices(dRes.status === 'fulfilled' && Array.isArray(dRes.value.data) ? dRes.value.data : [])
        setBranches(bRes.status === 'fulfilled' && Array.isArray(bRes.value.data) ? bRes.value.data : [])
        setLoading(false)
    }

    useEffect(() => { fetchAll() }, [])

    const openAdd = () => { setForm({ ...empty, branchId: hqBranch?.id ?? '' }); setEditId(null); setError(''); setModal(true) }

    const openEdit = (dev) => {
        setForm({
            tagNumber: dev.tagNumber,
            model: dev.model,
            serialNumber: dev.serialNumber,
            deviceType: dev.deviceType,
            branchId: dev.branch?.id ?? '',
        })
        setEditId(dev.id)
        setError('')
        setModal(true)
    }

    const closeStatusModal = () => {
        setStatusModal(false)
        setStatusDevice(null)
        setStatusForm({ newStatus: '', reason: '' })
        setStatusError('')
    }

    const openStatusModal = (dev) => {
        const otherStatuses = STATUSES.filter(s => s !== dev.status)
        setStatusDevice(dev)
        setStatusForm({ newStatus: otherStatuses[0] ?? '', reason: '' })
        setStatusError('')
        setStatusModal(true)
    }

    const closeHistoryModal = () => {
        setHistoryModal(false)
        setHistoryEntries([])
    }

    const openHistoryModal = async (dev) => {
        setHistoryLoading(true)
        setHistoryEntries([])
        setHistoryModal(true)
        try {
            const res = await devicesApi.getStatusHistory(dev.id)
            setHistoryEntries(Array.isArray(res.data) ? res.data : [])
        } catch {
            setHistoryEntries([])
        } finally {
            setHistoryLoading(false)
        }
    }

    const closeModal = () => { setModal(false); setForm(empty); setEditId(null); setError('') }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSaving(true)
        try {
            const payload = { ...form, branchId: Number(form.branchId) }
            if (editId) {
                const { status, ...updatePayload } = payload
                await devicesApi.update(editId, updatePayload)
            } else {
                await devicesApi.create(payload)
            }
            closeModal()
            await fetchAll()
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try { await devicesApi.remove(deleteId); await fetchAll() }
        finally { setDeleteId(null) }
    }

    const handleStatusSubmit = async (e) => {
        e.preventDefault()
        setStatusError('')
        setStatusSaving(true)
        try {
            await devicesApi.changeStatus(statusDevice.id, {
                newStatus: statusForm.newStatus,
                reason: statusForm.reason,
                changedById: auth.id,
            })
            closeStatusModal()
            await fetchAll()
        } catch (err) {
            setStatusError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setStatusSaving(false)
        }
    }

    const field = (key, value) => setForm(f => ({ ...f, [key]: value }))
    const statusField = (key, value) => setStatusForm(f => ({ ...f, [key]: value }))

    const filtered = devices
        .filter(d => filterStatus === 'ALL' || d.status === filterStatus)
        .filter(d => {
            const q = search.toLowerCase()
            return !q || d.tagNumber?.toLowerCase().includes(q) || d.model?.toLowerCase().includes(q)
        })
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const statusOptions = statusDevice ? STATUSES.filter(s => s !== statusDevice.status).map(s => ({ value: s, label: s.replace('_', ' ') })) : []

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Devices</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage EUCL device inventory</p>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setBulkModal(true)}
                            className="border border-gray-300 text-gray-700 hover:border-gray-400 text-sm font-medium px-4 py-2 rounded-lg transition"
                        >
                            ⬆ Bulk Import
                        </button>
                        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                            + Add Device
                        </button>
                    </div>
                )}
            </div>

            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by tag number or model..."
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
                            <span className="ml-1.5 opacity-70">
                                {devices.filter(d => d.status === s).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No devices found.</div>
                ) : (
                    <>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Tag No.</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Model</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Serial No.</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Type</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Branch</th>
                                <th className="px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.map((dev, i) => (
                                <tr key={dev.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                    <td className="px-6 py-4 font-mono text-gray-600">{dev.tagNumber}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{dev.model}</td>
                                    <td className="px-6 py-4 font-mono text-gray-500 text-xs">{dev.serialNumber}</td>
                                    <td className="px-6 py-4 text-gray-500">{dev.deviceType}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge[dev.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {dev.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{dev.branch?.name ?? '—'}</td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        {canEdit && <button onClick={() => openEdit(dev)} className="text-blue-600 hover:text-blue-800 font-medium transition">Edit</button>}
                                        {canUpdate && <button onClick={() => openStatusModal(dev)} className="text-orange-600 hover:text-orange-800 font-medium transition">Change Status</button>}
                                        {canUpdate && <button onClick={() => openHistoryModal(dev)} className="text-indigo-600 hover:text-indigo-800 font-medium transition">History</button>}
                                        {canDelete && <button onClick={() => setDeleteId(dev.id)} className="text-red-500 hover:text-red-700 font-medium transition">Delete</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p) }} />
                    </>
                )}
            </div>

            {/* Add / Edit Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">{editId ? 'Edit Device' : 'Add Device'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tag Number</label>
                                    <input
                                        required
                                        value={form.tagNumber}
                                        onChange={e => field('tagNumber', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. TAG-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                                    <input
                                        required
                                        value={form.serialNumber}
                                        onChange={e => field('serialNumber', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. SN-123456"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                                    <input
                                        required
                                        value={form.model}
                                        onChange={e => field('model', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Dell Latitude 5520"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                                    <input
                                        required
                                        value={form.deviceType}
                                        onChange={e => field('deviceType', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Laptop"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {!editId ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={form.status}
                                            onChange={e => field('status', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                        </select>
                                    </div>
                                ) : null}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                    <input
                                        readOnly
                                        value={hqBranch?.name ?? '—'}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <BulkImportModal
                open={bulkModal}
                onClose={() => setBulkModal(false)}
                title="Bulk Import Devices"
                downloadTemplate={devicesApi.downloadTemplate}
                uploadFile={devicesApi.bulkImport}
                onImported={fetchAll}
            />

            {/* Change Status Modal */}
            {statusModal && statusDevice && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Change Device Status</h2>
                        <form onSubmit={handleStatusSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                                <input
                                    readOnly
                                    value={statusDevice.status.replace('_', ' ')}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                                <ComboBox
                                    required
                                    value={statusForm.newStatus}
                                    onChange={v => statusField('newStatus', v)}
                                    options={statusOptions}
                                    placeholder="Select new status..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <textarea
                                    required
                                    value={statusForm.reason}
                                    onChange={e => statusField('reason', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                                    placeholder="Enter a reason for the status change"
                                />
                            </div>
                            {statusError && <p className="text-red-500 text-sm">{statusError}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeStatusModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={statusSaving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                                >
                                    {statusSaving ? 'Saving...' : 'Update Status'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status History Modal */}
            {historyModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Status History</h2>
                                <p className="text-sm text-gray-500">Most recent status changes first.</p>
                            </div>
                            <button onClick={closeHistoryModal} className="text-gray-500 hover:text-gray-800 text-sm">Close</button>
                        </div>
                        {historyLoading ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Loading history...</div>
                        ) : historyEntries.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No history entries found.</div>
                        ) : (
                            <div className="space-y-4">
                                {historyEntries.map(entry => (
                                    <div key={entry.id} className="border border-gray-200 rounded-2xl p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                            <span className="text-sm font-medium text-gray-700">{entry.oldStatus.replace('_', ' ')} → {entry.newStatus.replace('_', ' ')}</span>
                                            <span className="text-xs text-gray-500">{new Date(entry.changedAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">Reason: {entry.reason}</p>
                                        <p className="text-sm text-gray-500">Changed by: {entry.changedBy?.username ?? entry.changedBy?.employee?.name ?? 'Unknown'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Device</h2>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this device? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
                            <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
