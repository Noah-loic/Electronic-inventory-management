import { useEffect, useMemo, useState, useCallback } from 'react'
import * as branchesApi from '../../api/branches'
import * as inventoryApi from '../../api/inventory'
import ComboBox from '../../components/ComboBox'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 15

const statusBadge = {
    ACTIVE:         'bg-green-100 text-green-700',
    UNASSIGNED:     'bg-gray-100 text-gray-600',
    IN_REPAIR:      'bg-yellow-100 text-yellow-700',
    DECOMMISSIONED: 'bg-red-100 text-red-600',
}

const repairStatusBadge = {
    PENDING:   'bg-yellow-100 text-yellow-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    RESOLVED:  'bg-green-100 text-green-700',
    REJECTED:  'bg-red-100 text-red-600',
}

function fiscalYearLabel(y) { return `FY ${y}/${String(y + 1).slice(2)} (Jul ${y} – Jun ${y + 1})` }

export default function InventoryPage() {
    const [branches, setBranches] = useState([])
    const [branchId, setBranchId] = useState('')
    const [year, setYear] = useState(new Date().getFullYear())
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [hasGenerated, setHasGenerated] = useState(false)
    const [pending, setPending] = useState({})   // { [deviceId]: { present, working } }
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [page, setPage] = useState(1)
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState(null)

    const fiscalYears = useMemo(() => {
        const cur = new Date().getFullYear()
        return Array.from({ length: 6 }, (_, i) => cur - i)
    }, [])

    useEffect(() => {
        branchesApi.getAll()
            .then(res => setBranches(Array.isArray(res.data) ? res.data : []))
            .catch(() => setBranches([]))
    }, [])

    const handleGenerate = async () => {
        if (!branchId) return
        setError('')
        setSaveError('')
        setLoading(true)
        setHasGenerated(true)
        setPage(1)
        setPending({})
        try {
            const res = await inventoryApi.getInventory(branchId, year)
            setRows(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load inventory')
            setRows([])
        } finally {
            setLoading(false)
        }
    }

    // Track checkbox changes locally without saving
    const handleCheck = useCallback((deviceId, field, value) => {
        // Update display row
        setRows(prev => prev.map(r => r.deviceId === deviceId ? { ...r, [field]: value } : r))
        // Mark as pending
        setPending(prev => {
            const base = prev[deviceId] ?? rows.find(r => r.deviceId === deviceId) ?? {}
            return { ...prev, [deviceId]: { ...base, [field]: value } }
        })
    }, [rows])

    const handleDownloadTemplate = async () => {
        if (!branchId) return
        try {
            const res = await inventoryApi.downloadTemplate(branchId, year)
            const url = URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = `inventory_template_${branchId}_${year}.xlsx`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            setError('Failed to download template')
        }
    }

    const handleImport = async (e) => {
        const file = e.target.files?.[0]
        if (!file || !branchId) return
        e.target.value = ''
        setImporting(true)
        setImportResult(null)
        try {
            const res = await inventoryApi.bulkImport(file, branchId, year)
            setImportResult(res.data)
            if (res.data.successCount > 0) await handleGenerate()
        } catch {
            setImportResult({ successCount: 0, failureCount: 1, errors: ['Import failed. Please check the file and try again.'] })
        } finally {
            setImporting(false)
        }
    }

    const hasPending = Object.keys(pending).length > 0

    const handleSaveAll = async () => {
        if (!hasPending) return
        setSaving(true)
        setSaveError('')
        try {
            await Promise.all(
                Object.entries(pending).map(([deviceId, state]) =>
                    inventoryApi.saveCheck({
                        deviceId: Number(deviceId),
                        fiscalYear: year,
                        present: !!state.present,
                        working: !!state.working,
                    })
                )
            )
            setPending({})
        } catch {
            setSaveError('Some changes failed to save. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const totalPages = Math.ceil(rows.length / PAGE_SIZE)
    const paginated = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const branchName = branches.find(b => b.id === Number(branchId))?.name ?? ''

    return (
        <div>
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="grid gap-4 lg:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                        <ComboBox
                            value={branchId}
                            onChange={setBranchId}
                            options={branches.map(b => ({ value: b.id, label: b.name }))}
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
                            {fiscalYears.map(y => (
                                <option key={y} value={y}>{fiscalYearLabel(y)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={!branchId || loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Load Inventory'}
                        </button>
                    </div>
                </div>
                {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            </div>

            {/* Bulk Import */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Bulk Import</span>
                <button
                    onClick={handleDownloadTemplate}
                    disabled={!branchId}
                    className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition disabled:opacity-40"
                >
                    ⬇ Download Template
                </button>
                <label className={`text-sm px-4 py-2 rounded-lg border transition cursor-pointer ${
                    !branchId || importing
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                }`}>
                    {importing ? 'Importing...' : '⬆ Upload Excel'}
                    <input type="file" accept=".xlsx,.xls" className="hidden" disabled={!branchId || importing} onChange={handleImport} />
                </label>
                {importResult && (
                    <span className={`text-xs px-3 py-1.5 rounded-lg border ${
                        importResult.failureCount === 0
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        {importResult.successCount} imported{importResult.failureCount > 0 ? `, ${importResult.failureCount} failed` : ''}
                    </span>
                )}
                {importResult?.errors?.length > 0 && (
                    <div className="w-full mt-1 text-xs text-red-500 space-y-0.5">
                        {importResult.errors.map((e, i) => <div key={i}>{e}</div>)}
                    </div>
                )}
            </div>

            {/* Summary + Save All */}
            {hasGenerated && !loading && rows.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">{rows.length}</span> devices — {branchName} · {fiscalYearLabel(year)}
                    </span>
                    <span className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700">
                        <span className="font-semibold">{rows.filter(r => r.present).length}</span> present
                    </span>
                    <span className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700">
                        <span className="font-semibold">{rows.filter(r => r.working).length}</span> working
                    </span>
                    <div className="ml-auto flex items-center gap-3">
                        {saveError && <span className="text-sm text-red-500">{saveError}</span>}
                        {hasPending && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                                {Object.keys(pending).length} unsaved change{Object.keys(pending).length > 1 ? 's' : ''}
                            </span>
                        )}
                        <button
                            onClick={handleSaveAll}
                            disabled={!hasPending || saving}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-40"
                        >
                            {saving ? 'Saving...' : 'Save All'}
                        </button>
                    </div>
                </div>
            )}

            {hasGenerated && !loading && rows.length === 0 && !error && (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                    No devices found for this branch and fiscal year.
                </div>
            )}

            {/* Table */}
            {rows.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Tag No.</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Model</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Serial No.</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Current Branch</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Assigned To</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Employee ID</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Assigned At</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Assigned By</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Note</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Repair Status</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Requested By</th>
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Handled By</th>
                                    <th className="text-center px-4 py-3 text-gray-500 font-medium">Present</th>
                                    <th className="text-center px-4 py-3 text-gray-500 font-medium">Working</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginated.map((row, i) => {
                                    const isDirty = !!pending[row.deviceId]
                                    return (
                                        <tr key={row.deviceId} className={`hover:bg-gray-50 transition ${isDirty ? 'bg-amber-50' : ''}`}>
                                            <td className="px-4 py-3 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                            <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">{row.tagNumber}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.model}</td>
                                            <td className="px-4 py-3 font-mono text-gray-500 text-xs whitespace-nowrap">{row.serialNumber}</td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.deviceType}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge[row.currentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {row.currentStatus.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${row.currentStatus === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>
                                                    {row.currentBranchName ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.assignedEmployeeName ?? '—'}</td>
                                            <td className="px-4 py-3 font-mono text-gray-500 text-xs whitespace-nowrap">{row.assignedEmployeeId ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                                {row.assignedAt ? new Date(row.assignedAt).toLocaleString() : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.assignedByName ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">{row.assignmentNote ?? '—'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {row.repairStatus
                                                    ? <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${repairStatusBadge[row.repairStatus] ?? 'bg-gray-100 text-gray-600'}`}>{row.repairStatus.replace('_', ' ')}</span>
                                                    : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.repairRequestedBy ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.repairHandledBy ?? '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!row.present}
                                                    onChange={e => handleCheck(row.deviceId, 'present', e.target.checked)}
                                                    className="w-4 h-4 accent-green-600 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!row.working}
                                                    onChange={e => handleCheck(row.deviceId, 'working', e.target.checked)}
                                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </div>
            )}
        </div>
    )
}
