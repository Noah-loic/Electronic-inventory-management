import { useEffect, useMemo, useState } from 'react'
import rolesApi from '../../api/roles'
import Pagination from '../../components/Pagination'
import { ALL_PERMISSIONS } from '../../constants/permissions'

const PAGE_SIZE = 8

const empty = { name: '', description: '', permissions: [] }

export default function RolesPage() {
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState(empty)
    const [selectedPerms, setSelectedPerms] = useState(new Set())
    const [editId, setEditId] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)

    const fetchRoles = async () => {
        try {
            const { data } = await rolesApi.getAll()
            setRoles(Array.isArray(data) ? data : [])
        } catch {
            setRoles([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchRoles() }, [])

    const openAdd = () => {
        setForm(empty)
        setSelectedPerms(new Set())
        setEditId(null)
        setError('')
        setModal(true)
    }

    const openEdit = (role) => {
        setForm({
            name: role.name,
            description: role.description ?? '',
            permissions: role.permissions ?? [],
        })
        setSelectedPerms(new Set(role.permissions ?? []))
        setEditId(role.id)
        setError('')
        setModal(true)
    }

    const closeModal = () => {
        setModal(false)
        setForm(empty)
        setSelectedPerms(new Set())
        setEditId(null)
        setError('')
    }

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
            const payload = {
                name: form.name,
                description: form.description,
                permissions: [...selectedPerms],
            }
            if (editId) {
                await rolesApi.update(editId, payload)
            } else {
                await rolesApi.create(payload)
            }
            await fetchRoles()
            closeModal()
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            await rolesApi.remove(deleteId)
            await fetchRoles()
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setDeleteId(null)
        }
    }

    const roleLabel = useMemo(() => ({
        ADMIN: 'bg-purple-100 text-purple-700',
        ICT_STAFF: 'bg-blue-100 text-blue-700',
        BRANCH_MANAGER: 'bg-green-100 text-green-700',
    }), [])

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Roles & Permissions</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage role definitions and their permission sets</p>
                </div>
                <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                    + Add Role
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : roles.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No roles found.</div>
                ) : (() => {
                    const totalPages = Math.ceil(roles.length / PAGE_SIZE)
                    const paginated = roles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                    return (
                        <>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Description</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Permissions</th>
                                        <th className="px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginated.map((role, i) => (
                                        <tr key={role.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                            <td className="px-6 py-4 font-medium text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <span>{role.name}</span>
                                                    {role.isSystem && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">System</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{role.description || '—'}</td>
                                            <td className="px-6 py-4 text-gray-500">{role.permissions?.length ?? 0} permissions</td>
                                            <td className="px-6 py-4 text-right space-x-3">
                                                <button onClick={() => openEdit(role)} className="text-blue-600 hover:text-blue-800 font-medium transition">Edit</button>
                                                <button onClick={() => setDeleteId(role.id)} className="text-red-500 hover:text-red-700 font-medium transition">Delete</button>
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

            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">{editId ? 'Edit Role' : 'Add Role'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="overflow-y-auto flex-1 p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name {editId && form.name && roleLabel[form.name] ? '' : ''}
                                    </label>
                                    <input
                                        required
                                        readOnly={editId && roles.find(r => r.id === editId)?.isSystem}
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        placeholder="e.g. Finance Manager"
                                    />
                                    {editId && roles.find(r => r.id === editId)?.isSystem && (
                                        <p className="text-xs text-gray-500 mt-1">System role names cannot be changed</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-3">Permissions</p>
                                    {editId && form.name === 'ADMIN' && (
                                        <p className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-3">ADMIN role always has all permissions — cannot be modified.</p>
                                    )}
                                    <div className="space-y-3">
                                        {Object.entries(ALL_PERMISSIONS).map(([group, perms]) => {
                                            const isAdmin = editId && form.name === 'ADMIN'
                                            const allChecked = perms.every(p => selectedPerms.has(p))
                                            const someChecked = perms.some(p => selectedPerms.has(p))
                                            return (
                                                <div key={group} className={`border rounded-lg p-3 ${isAdmin ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200'}`}>
                                                    <label className={`flex items-center gap-2 mb-2 ${isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={allChecked}
                                                            ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                                                            onChange={() => !isAdmin && toggleGroup(perms)}
                                                            disabled={isAdmin}
                                                            className="w-4 h-4 accent-blue-600"
                                                        />
                                                        <span className="text-sm font-semibold text-gray-700">{group}</span>
                                                    </label>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pl-6">
                                                        {perms.map(perm => (
                                                            <label key={perm} className={`flex items-center gap-1.5 ${isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedPerms.has(perm)}
                                                                    onChange={() => !isAdmin && togglePerm(perm)}
                                                                    disabled={isAdmin}
                                                                    className="w-3.5 h-3.5 accent-blue-600"
                                                                />
                                                                <span className="text-xs text-gray-600">{perm.split('_').slice(1).join(' ')}</span>
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
                                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50">
                                    {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Role</h2>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this role?</p>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setDeleteId(null); setError('') }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
                            <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
