import { useEffect, useState } from 'react'
import usersApi from '../../api/users'
import employeesApi from '../../api/employees'
import rolesApi from '../../api/roles'
import Pagination from '../../components/Pagination'
import ComboBox from '../../components/ComboBox'

const PAGE_SIZE = 8

const empty = { username: '', password: '', employeeId: '' }

const roleBadge = {
    ADMIN: 'bg-purple-100 text-purple-700',
    ICT_STAFF: 'bg-blue-100 text-blue-700',
    BRANCH_MANAGER: 'bg-green-100 text-green-700',
}

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [employees, setEmployees] = useState([])
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState(empty)
    const [effectivePerms, setEffectivePerms] = useState([])
    const [selectedRoleIds, setSelectedRoleIds] = useState(new Set())
    const [editId, setEditId] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)

    const fetchAll = async () => {
        try {
            const [uRes, eRes, rRes] = await Promise.all([usersApi.getAll(), employeesApi.getAll(), rolesApi.getAll()])
            setUsers(Array.isArray(uRes.data) ? uRes.data : [])
            setEmployees(Array.isArray(eRes.data) ? eRes.data : [])
            setRoles(Array.isArray(rRes.data) ? rRes.data : [])
        } catch {
            setUsers([])
            setEmployees([])
            setRoles([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAll() }, [])

    const openAdd = () => {
        setForm(empty)
        setEffectivePerms([])
        setSelectedRoleIds(new Set())
        setEditId(null)
        setError('')
        setModal(true)
    }

    const openEdit = (user) => {
        setForm({
            username: user.username,
            password: '',
            employeeId: user.employee?.id ?? '',
        })
        const roleIds = new Set((user.roles ?? []).map(r => r.id))
        setSelectedRoleIds(roleIds)
        setEffectivePerms(user.permissions ?? [])
        setEditId(user.id)
        setError('')
        setModal(true)
    }

    const closeModal = () => { setModal(false); setForm(empty); setEffectivePerms([]); setSelectedRoleIds(new Set()); setEditId(null); setError('') }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSaving(true)
        try {
            const payload = { ...form, employeeId: Number(form.employeeId), roleIds: [...selectedRoleIds] }
            if (!editId && !payload.password) { setError('Password is required'); setSaving(false); return }

            if (editId) {
                const updatePayload = { ...payload }
                if (!updatePayload.password) delete updatePayload.password
                await usersApi.update(editId, updatePayload)
            } else {
                await usersApi.create(payload)
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
        try { await usersApi.remove(deleteId); await fetchAll() }
        finally { setDeleteId(null) }
    }

    const field = (key, value) => setForm(f => ({ ...f, [key]: value }))

    const toggleRole = (roleId) => {
        setSelectedRoleIds(prev => {
            const next = new Set(prev)
            next.has(roleId) ? next.delete(roleId) : next.add(roleId)
            return next
        })
    }

    useEffect(() => {
        const isAdmin = roles.some(r => selectedRoleIds.has(r.id) && r.name === 'ADMIN')
        if (isAdmin) {
            setEffectivePerms(['ALL PERMISSIONS'])
            return
        }
        const union = roles
            .filter(r => selectedRoleIds.has(r.id))
            .flatMap(r => r.permissions ?? [])
        setEffectivePerms([...new Set(union)])
    }, [selectedRoleIds, roles])

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Users</h1>
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
                                        <div className="flex flex-wrap gap-1.5">
                                            {(user.roles ?? []).map(role => {
                                                const base = roleBadge[role.name] ?? 'bg-gray-100 text-gray-600'
                                                return <span key={role.id ?? role.name} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${base}`}>{role.name}</span>
                                            })}
                                            {(user.roles ?? []).length === 0 && <span className="text-xs text-gray-400">No roles</span>}
                                        </div>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                                        <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                                            {roles.map(role => (
                                                <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRoleIds.has(role.id)}
                                                        onChange={() => toggleRole(role.id)}
                                                        className="w-4 h-4 accent-blue-600"
                                                    />
                                                    <span>{role.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                        <ComboBox
                                            required
                                            value={form.employeeId}
                                            onChange={v => field('employeeId', v)}
                                            options={employees.map(emp => ({ value: emp.id, label: `${emp.name} (${emp.employeeId})` }))}
                                            placeholder="Search employee..."
                                        />
                                    </div>
                                </div>

                                {/* Permissions — read-only, derived from roles */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Effective Permissions</p>
                                    <p className="text-xs text-gray-400 mb-3">Permissions are inherited from assigned roles. Edit them in Roles &amp; Permissions.</p>
                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 min-h-[60px]">
                                        {effectivePerms.length === 0 ? (
                                            <span className="text-xs text-gray-400">No permissions — assign a role above.</span>
                                        ) : effectivePerms[0] === 'ALL PERMISSIONS' ? (
                                            <span className="text-xs font-semibold text-purple-600">All permissions (ADMIN)</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {effectivePerms.map(p => (
                                                    <span key={p} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p}</span>
                                                ))}
                                            </div>
                                        )}
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
