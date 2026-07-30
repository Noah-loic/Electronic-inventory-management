export default function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null
    return (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
                <button
                    onClick={() => onChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                            p === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => onChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    Next
                </button>
            </div>
        </div>
    )
}
