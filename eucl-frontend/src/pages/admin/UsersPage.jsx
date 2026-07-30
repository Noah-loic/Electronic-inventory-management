import { useEffect, useState } from 'react'
import usersApi from '../../api/users'
import employeesApi from '../../api/employees'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 8

const ALL_PERMISSIONS = {
    Device:      ['DEVICE_CREATE', 'DEVICE_READ', 'DEVICE_UPDATE', 'DEVICE_DELETE'],
    Employee:    ['EMPLOYEE_CREATE', 'EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE'],
    Branch:      ['BRANCH_CREATE', 'BRANCH_READ', 'BRANCH_UPDATE', 'BRANCH_DELETE'],
    Department:  ['DEPARTMENT_CREATE', 'DEPARTMENT_READ', 'DEPARTMENT_UPDATE', 'DEPARTMENT_DELETE'],
    Assignment:  ['ASSIGNMENT_CREATE', 'ASSIGNMENT_READ'],
    'Repair Request': ['REPAIR_REQUEST_CREATE', 'REPAIR_REQUEST_READ', 'REPAIR_REQUEST_UPDATE'],
    Report:      ['REPORT_READ'],
    User:        ['USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE'],
}

const ROLES = ['ADMIN', 'ICT_STAFF', 'BRANCH_MANAGER']

const ALL_PERMS_FLAT = Object.values(ALL_PERMISSIONS).flat()

const ROLE_DEFAULTS = {
    ADMIN: new Set(ALL_PERMS_FLAT),
    ICT_STAFF: new Set([
        'DEVICE_CREATE', 'DEVICE_READ', 'DEVICE_UPDATE',
        'EMPLOYEE_READ', 'BRANCH_READ', 'DEPARTMENT_READ',
        'ASSIGNMENT_CREATE', 'ASSIGNMENT_READ',
        'REPAIR_REQUEST_READ', 'REPAIR_REQUEST_UPDATE',
        'REPORT_READ',
    ]),
    BRANCH_MANAGER: new Set([
        'BRANCH_READ',
        'REPAIR_REQUEST_CREATE', 'REPAIR_REQUEST_READ',
        'REPORT_READ',
    ]),
}

const empty = { username: '', password: '', role: '', employeeId: '' }

const roleBadge = {
    ADMIN: 'bg-purple-100 text-purple-700',
    ICT_STAFF: 'bg-blue-100 text-blue-700',
    BRANCH_MANAGER: 'bg-green-100 text-green-700',
}

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState(empty)
    const [selectedPerms, setSelectedPerms] = useState(new Set())
    const [editId, setEditId] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)

    const fetchAll = async () => {
        try {
            const [uRes, eRes] = await Promise.all([usersApi.getAll(), employeesApi.getAll()])
            setUsers(Array.isArray(uRes.data) ? uRes.data : [])
            setEmployees(Array.isArray(eRes.data) ? eRes.data : [])
        } catch {
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAll() }, [])

    const openAdd = () => {
        setForm(empty)
        setSelectedPerms(new Set())
        setEditId(null)
        setError('')
        setModal(true)
    }

    const openEdit = (user) => {
        setForm({
            username: user.username,
            password: '',
            role: user.role,
            employeeId: user.employee?.id ?? '',
        })
        setSelectedPerms(new Set(user.permissions ?? []))
        setEditId(user.id)
        setError('')
        setModal(true)
    }

    const closeModal = () => { setModal(false); setForm(empty); setSelectedPerms(new Set()); setEditId(null); setError('') }

    const togglePerm = (perm) => {
        setSelectedPerms(prev => {
            const next = new Set(prev)
            next.has(perm) ? next.delete(perm) : next.add(perm)
            return next
        })
    }

    const toggleGroup = (perms) => {
        const allChecked = perms.every(p => selectedPerms.has(p))
        setSelectedPerms(prev => {
            const next = new Set(prev)
            perms.forEach(p => allChecked ? next.delete(p) : next.add(p))
            return next
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSaving(true)
        try {
            const payload = { ...form, employeeId: Number(form.employeeId) }
            if (!editId && !payload.password) { setError('Password is required'); setSaving(false); return }

            let userId = editId
            if (editId) {
                const updatePayload = { ...payload }
                if (!updatePayload.password) delete updatePayload.password
                await usersApi.update(editId, updatePayload)
            } else {
                const { data } = await usersApi.create(payload)
                userId = data.id
            }
            await usersApi.setPermissions(userId, [...selectedPerms])
            closeModal()
            await fetchAll()
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try { await usersApi.remove(deleteId); await fetchAll() }
        finally { setDeleteId(null) }
    }

    const field = (key, value) => setForm(f => ({ ...f, [key]: value }))

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Users & Permissions</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage system users and their access rights</p>
                </div>
                <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                    + Add User
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No users found.</div>
                ) : (() => {
                    const totalPages = Math.ceil(users.length / PAGE_SIZE)
                    const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                    return (
                    <>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Username</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Employee</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Role</th>
                                <th className="text-left px-6 py-3 text-gray-500 font-medium">Permissions</th>
                                <th className="px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.map((user, i) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{user.username}</td>
                                    <td className="px-6 py-4 text-gray-500">{user.employee?.name ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">{user.permissions?.length ?? 0} permissions</td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button onClick={() => openEdit(user)} className="text-blue-600 hover:text-blue-800 font-medium transition">Edit</button>
                                        <button onClick={() => setDeleteId(user.id)} className="text-red-500 hover:text-red-700 font-medium transition">Delete</button>
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
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">{editId ? 'Edit User' : 'Add User'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="overflow-y-auto flex-1 p-6 space-y-4">
                                {/* User fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            required
                                            value={form.username}
                                            onChange={e => field('username', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. john.doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password {editId && <span className="text-gray-400 font-normal">(leave blank to keep)</span>}
                                        </label>
                                        <input
                                            type="password"
                                            value={form.password}
                                            onChange={e => field('password', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select
                                            required
                                            value={form.role}
                                            onChange={e => {
                                                field('role', e.target.value)
                                                if (ROLE_DEFAULTS[e.target.value]) {
                                                    setSelectedPerms(new Set(ROLE_DEFAULTS[e.target.value]))
                                                }
                                            }}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select role</option>
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                        <select
                                            required
                                            value={form.employeeId}
                                            onChange={e => field('employeeId', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select employee</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-3">Permissions</p>
                                    <div className="space-y-3">
                                        {Object.entries(ALL_PERMISSIONS).map(([group, perms]) => {
                                            const allChecked = perms.every(p => selectedPerms.has(p))
                                            const someChecked = perms.some(p => selectedPerms.has(p))
                                            return (
                                                <div key={group} className="border border-gray-200 rounded-lg p-3">
                                                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={allChecked}
                                                            ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                                                            onChange={() => toggleGroup(perms)}
                                                            className="w-4 h-4 accent-blue-600"
                                                        />
                                                        <span className="text-sm font-semibold text-gray-700">{group}</span>
                                                    </label>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pl-6">
                                                        {perms.map(perm => (
                                                            <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedPerms.has(perm)}
                                                                    onChange={() => togglePerm(perm)}
                                                                    className="w-3.5 h-3.5 accent-blue-600"
                                                                />
                                                                <span className="text-xs text-gray-600">
                                                                    {perm.split('_').slice(1).join(' ')}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-sm">{error}</p>}
                            </div>

                            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
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

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Delete User</h2>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
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
