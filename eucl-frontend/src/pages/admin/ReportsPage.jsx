import { useState } from 'react'
import AuditPage from './AuditPage'
import InventoryPage from './InventoryPage'

const TABS = [
    { key: 'audit',     label: 'Audit Report' },
    { key: 'inventory', label: 'Inventory Check' },
]

export default function ReportsPage() {
    const [tab, setTab] = useState('audit')

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
                <p className="text-sm text-gray-500 mt-0.5">Audit report and physical inventory check</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                            tab === t.key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'audit'     && <AuditPage />}
            {tab === 'inventory' && <InventoryPage />}
        </div>
    )
}
