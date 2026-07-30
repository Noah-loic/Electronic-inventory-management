import { useEffect, useState } from 'react'
import * as departmentsApi from '../../api/departments'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 8

const empty = { name: '' }

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState(empty)
    const [editId, setEditId] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)

    const fetchDepartments = async () => {
        try {
            const { data } = await departmentsApi.getAll()
            setDepartments(Array.isArray(data) ? data : [])
        } catch {
            setDepartments([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDepartments() }, [])

    const openAdd = () => {
        setForm(empty)
        setEditId(null)
        setError('')
        setModal(true)
    }

    const openEdit = (dept) => {
        setForm({ name: dept.name })
        setEditId(dept.id)
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
        setError('')
        setSaving(true)
        try {
            if (editId) {
                await departmentsApi.update(editId, form)
            } else {
                await departmentsApi.create(form)
            }
            closeModal()
            await fetchDepartments()
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            await departmentsApi.remove(deleteId)
            await fetchDepartments()
        } finally {
            setDeleteId(null)
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage organizational departments</p>
                </div>
                <button
                    onClick={openAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                    + Add Department
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : departments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No departments found.</div>
                ) : (() => {
                    const totalPages = Math.ceil(departments.length / PAGE_SIZE)
                    const paginated = departments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                    return (
                    <>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Created At</th>
                                <th className="px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.map((dept, i) => (
                                <tr key={dept.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{dept.name}</td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button
                                            onClick={() => openEdit(dept)}
                                            className="text-blue-600 hover:text-blue-800 font-medium transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(dept.id)}
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
                            {editId ? 'Edit Department' : 'Add Department'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. ICT"
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
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Department</h2>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this department? This action cannot be undone.</p>
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
