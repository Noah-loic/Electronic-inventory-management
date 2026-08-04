import { useEffect, useState } from 'react'
import * as branchesApi from '../../api/branches'
import employeesApi from '../../api/employees'
import devicesApi from '../../api/devices'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 8

const empty = { name: '', address: '' }

export default function BranchesPage() {
    const [branches, setBranches] = useState([])
    const [employeeCounts, setEmployeeCounts] = useState({})
    const [deviceCounts, setDeviceCounts] = useState({})
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState(empty)
    const [editId, setEditId] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)

    const fetchBranches = async () => {
        const [bRes, eRes, dRes] = await Promise.allSettled([
            branchesApi.getAll(),
            employeesApi.getAll(),
            devicesApi.getAll(),
        ])
        const branchList = bRes.status === 'fulfilled' && Array.isArray(bRes.value.data) ? bRes.value.data : []
        setBranches(branchList)
        if (eRes.status === 'fulfilled' && Array.isArray(eRes.value.data)) {
            const counts = {}
            eRes.value.data.forEach(emp => {
                if (emp.branch?.id) counts[emp.branch.id] = (counts[emp.branch.id] ?? 0) + 1
            })
            setEmployeeCounts(counts)
        }
        if (dRes.status === 'fulfilled' && Array.isArray(dRes.value.data)) {
            const counts = {}
            dRes.value.data.forEach(dev => {
                if (dev.branch?.id) counts[dev.branch.id] = (counts[dev.branch.id] ?? 0) + 1
            })
            setDeviceCounts(counts)
        }
        setLoading(false)
    }

    useEffect(() => { fetchBranches() }, [])

    const openAdd = () => {
        setForm(empty)
        setEditId(null)
        setError('')
        setModal(true)
    }

    const openEdit = (branch) => {
        setForm({ name: branch.name, address: branch.address })
        setEditId(branch.id)
        setError('')
        setModal(true)
    }

    const closeModal = () => {
        setModal(false)
        setForm(empty)
        setEditId(null)
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            if (editId) {
                await branchesApi.update(editId, form)
            } else {
                await branchesApi.create(form)
            }
            await fetchBranches()
            closeModal()
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            await branchesApi.remove(deleteId)
            await fetchBranches()
        } finally {
            setDeleteId(null)
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Branches</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage EUCL branches across Rwanda</p>
                </div>
                <button
                    onClick={openAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                    + Add Branch
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : branches.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No branches found.</div>
                ) : (() => {
                    const totalPages = Math.ceil(branches.length / PAGE_SIZE)
                    const paginated = branches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                    return (
                    <>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Address</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Created At</th>
                                <th className="px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.map((branch, i) => (
                                <tr key={branch.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            {branch.name}
                                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium" title="Employees">
                                                👤 {employeeCounts[branch.id] ?? 0}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium" title="Devices">
                                                🖥 {deviceCounts[branch.id] ?? 0}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{branch.address}</td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button
                                            onClick={() => openEdit(branch)}
                                            className="text-blue-600 hover:text-blue-800 font-medium transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(branch.id)}
                                            className="text-red-500 hover:text-red-700 font-medium transition"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                    </>
                    )
                })()}
            </div>

            {/* Add / Edit Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">
                            {editId ? 'Edit Branch' : 'Add Branch'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Gasabo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    required
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Gasabo, Kigali"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
                                >
                                    Cancel
                                </button>
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

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Branch</h2>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this branch? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
