import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import employeesApi from '../../api/employees'
import * as branchesApi from '../../api/branches'
import * as departmentsApi from '../../api/departments'
import Pagination from '../../components/Pagination'
import BulkImportModal from '../../components/BulkImportModal'
import ComboBox from '../../components/ComboBox'

const PAGE_SIZE = 8

const empty = { employeeId: '', name: '', departmentId: '', branchId: '' }

export default function EmployeesPage() {
    const { auth } = useAuth()
    const canEdit = auth?.permissions?.includes('EMPLOYEE_CREATE') || auth?.permissions?.includes('EMPLOYEE_UPDATE')
    const canDelete = auth?.permissions?.includes('EMPLOYEE_DELETE')
    const [employees, setEmployees] = useState([])
    const [branches, setBranches] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState(empty)
    const [editId, setEditId] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)
    const [bulkModal, setBulkModal] = useState(false)

    const fetchAll = async () => {
        const [empRes, brRes, deptRes] = await Promise.allSettled([
            employeesApi.getAll(),
            branchesApi.getAll(),
            departmentsApi.getAll(),
        ])
        setEmployees(empRes.status === 'fulfilled' && Array.isArray(empRes.value.data) ? empRes.value.data : [])
        setBranches(brRes.status === 'fulfilled' && Array.isArray(brRes.value.data) ? brRes.value.data : [])
        setDepartments(deptRes.status === 'fulfilled' && Array.isArray(deptRes.value.data) ? deptRes.value.data : [])
        setLoading(false)
    }

    useEffect(() => { fetchAll() }, [])

    const openAdd = () => { setForm(empty); setEditId(null); setError(''); setModal(true) }

    const openEdit = (emp) => {
        setForm({
            employeeId: emp.employeeId,
            name: emp.name,
            departmentId: emp.department?.id ?? '',
            branchId: emp.branch?.id ?? '',
        })
        setEditId(emp.id)
        setError('')
        setModal(true)
    }

    const closeModal = () => { setModal(false); setForm(empty); setEditId(null); setError('') }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSaving(true)
        try {
            const payload = {
                ...form,
                departmentId: Number(form.departmentId),
                branchId: Number(form.branchId),
            }
            if (editId) await employeesApi.update(editId, payload)
            else await employeesApi.create(payload)
            closeModal()
            await fetchAll()
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try { await employeesApi.remove(deleteId); await fetchAll() }
        finally { setDeleteId(null) }
    }

    const field = (key, value) => setForm(f => ({ ...f, [key]: value }))

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage EUCL employees</p>
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
                            + Add Employee
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : employees.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No employees found.</div>
                ) : (() => {
                    const totalPages = Math.ceil(employees.length / PAGE_SIZE)
                    const paginated = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                    return (
                    <>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Employee ID</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Department</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Branch</th>
                                <th className="px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.map((emp, i) => (
                                <tr key={emp.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                    <td className="px-6 py-4 font-mono text-gray-600">{emp.employeeId}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{emp.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{emp.department?.name ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-500">{emp.branch?.name ?? '—'}</td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        {canEdit && <button onClick={() => openEdit(emp)} className="text-blue-600 hover:text-blue-800 font-medium transition">Edit</button>}
                                        {canDelete && <button onClick={() => setDeleteId(emp.id)} className="text-red-500 hover:text-red-700 font-medium transition">Delete</button>}
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
                            {editId ? 'Edit Employee' : 'Add Employee'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                                <input
                                    required
                                    value={form.employeeId}
                                    onChange={e => field('employeeId', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. EMP-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => field('name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <ComboBox
                                    required
                                    value={form.departmentId}
                                    onChange={v => field('departmentId', v)}
                                    options={departments.map(d => ({ value: d.id, label: d.name }))}
                                    placeholder="Search department..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                <ComboBox
                                    required
                                    value={form.branchId}
                                    onChange={v => field('branchId', v)}
                                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                                    placeholder="Search branch..."
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
                title="Bulk Import Employees"
                downloadTemplate={employeesApi.downloadTemplate}
                uploadFile={employeesApi.bulkImport}
                onImported={fetchAll}
            />

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Employee</h2>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this employee? This action cannot be undone.</p>
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
