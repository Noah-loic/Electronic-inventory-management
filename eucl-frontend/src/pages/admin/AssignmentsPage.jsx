import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import assignmentsApi from '../../api/assignments'
import devicesApi from '../../api/devices'
import employeesApi from '../../api/employees'
import * as branchesApi from '../../api/branches'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 8

const empty = { deviceId: '', employeeId: '', branchId: '', note: '' }

export default function AssignmentsPage() {
    const { auth } = useAuth()
    const canAssign = auth?.permissions?.includes('ASSIGNMENT_CREATE')
    const canUnassign = auth?.permissions?.includes('ASSIGNMENT_CREATE')
    const [assignments, setAssignments] = useState([])
    const [devices, setDevices] = useState([])
    const [employees, setEmployees] = useState([])
    const [branches, setBranches] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState(empty)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [unassignId, setUnassignId] = useState(null)
    const [unassignNote, setUnassignNote] = useState('')
    const [showAll, setShowAll] = useState(false)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)

    const fetchAll = async () => {
        try {
            const [aRes, dRes, eRes, bRes] = await Promise.all([
                assignmentsApi.getAll(),
                devicesApi.getAll(),
                employeesApi.getAll(),
                branchesApi.getAll(),
            ])
            setAssignments(Array.isArray(aRes.data) ? aRes.data : [])
            setDevices(Array.isArray(dRes.data) ? dRes.data : [])
            setEmployees(Array.isArray(eRes.data) ? eRes.data : [])
            setBranches(Array.isArray(bRes.data) ? bRes.data : [])
        } catch {
            setAssignments([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAll() }, [])

    const openAssign = () => { setForm(empty); setError(''); setModal(true) }
    const closeModal = () => { setModal(false); setForm(empty); setError('') }

    const handleAssign = async (e) => {
        e.preventDefault()
        setError('')
        setSaving(true)
        try {
            await assignmentsApi.assign({
                deviceId: Number(form.deviceId),
                employeeId: Number(form.employeeId),
                branchId: Number(form.branchId),
                assignedById: auth.id,
                note: form.note || null,
            })
            closeModal()
            await fetchAll()
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const handleUnassign = async () => {
        try {
            await assignmentsApi.unassign(unassignId, unassignNote || undefined)
            await fetchAll()
        } finally {
            setUnassignId(null)
            setUnassignNote('')
        }
    }

    const field = (key, value) => setForm(f => ({ ...f, [key]: value }))

    const availableDevices = devices.filter(d => d.status === 'UNASSIGNED')
    const displayed = assignments
        .filter(a => showAll || a.isActive)
        .filter(a => {
            const q = search.toLowerCase()
            return !q ||
                a.employee?.name?.toLowerCase().includes(q) ||
                (a.assignedBy?.employee?.name ?? a.assignedBy?.username ?? '').toLowerCase().includes(q)
        })
    const totalPages = Math.ceil(displayed.length / PAGE_SIZE)
    const paginated = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Assign and manage device assignments</p>
                </div>
                {canAssign && (
                    <button onClick={openAssign} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        + Assign Device
                    </button>
                )}
            </div>

            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by employee or assigned by..."
                className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            {/* Active / All toggle */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setShowAll(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!showAll ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                    Active <span className="ml-1 opacity-70">{assignments.filter(a => a.isActive).length}</span>
                </button>
                <button
                    onClick={() => setShowAll(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${showAll ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                    All <span className="ml-1 opacity-70">{assignments.length}</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : displayed.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No assignments found.</div>
                ) : (
                    <>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Device</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Employee</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Branch</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Assigned By</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Assigned At</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Note</th>
                                <th className="px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.map((a, i) => (
                                <tr key={a.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{a.device?.model}</div>
                                        <div className="text-xs text-gray-400 font-mono">{a.device?.tagNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{a.employee?.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{a.branch?.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{a.assignedBy?.employee?.name ?? a.assignedBy?.username ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {a.assignedAt ? new Date(a.assignedAt).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {a.isActive ? 'Active' : 'Returned'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs max-w-[150px] truncate">{a.note || '—'}</td>
                                    <td className="px-6 py-4 text-right">
                                        {canUnassign && a.isActive && (
                                            <button
                                                onClick={() => { setUnassignId(a.id); setUnassignNote('') }}
                                                className="text-orange-500 hover:text-orange-700 font-medium transition text-sm"
                                            >
                                                Unassign
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

            {/* Assign Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Assign Device</h2>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
                                <select
                                    required
                                    value={form.deviceId}
                                    onChange={e => field('deviceId', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select device</option>
                                    {availableDevices.map(d => (
                                        <option key={d.id} value={d.id}>{d.model} — {d.tagNumber}</option>
                                    ))}
                                </select>
                                {availableDevices.length === 0 && (
                                    <p className="text-xs text-orange-500 mt-1">No unassigned devices available.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                <select
                                    required
                                    value={form.employeeId}
                                    onChange={e => {
                                        const emp = employees.find(emp => emp.id === Number(e.target.value))
                                        setForm(f => ({ ...f, employeeId: e.target.value, branchId: emp?.branch?.id ?? '' }))
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                <input
                                    readOnly
                                    value={employees.find(e => e.id === Number(form.employeeId))?.branch?.name ?? '—'}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
                                <input
                                    value={form.note}
                                    onChange={e => field('note', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. For field work"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                                >
                                    {saving ? 'Assigning...' : 'Assign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Unassign Confirmation */}
            {unassignId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Unassign Device</h2>
                        <p className="text-sm text-gray-500 mb-4">This will mark the device as unassigned.</p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input
                                value={unassignNote}
                                onChange={e => setUnassignNote(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Reason for unassignment"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setUnassignId(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
                            <button onClick={handleUnassign} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Unassign</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
