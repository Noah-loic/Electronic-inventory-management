import { useRef, useState } from 'react'

export default function BulkImportModal({ open, onClose, title, downloadTemplate, uploadFile, onImported }) {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const inputRef = useRef()

    if (!open) return null

    const handleClose = () => {
        setFile(null)
        setResult(null)
        setError('')
        onClose()
    }

    const handleDownload = async () => {
        try {
            const res = await downloadTemplate()
            const disposition = res.headers?.['content-disposition'] ?? ''
            const match = disposition.match(/filename="?([^"]+)"?/)
            const filename = match ? match[1] : 'import_template.xlsx'
            const url = URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            setError(err.message || 'Failed to download template')
        }
    }

    const handleUpload = async (e) => {
        e.preventDefault()
        if (!file) return
        setError('')
        setResult(null)
        setUploading(true)
        try {
            const res = await uploadFile(file)
            setResult(res.data)
        } catch (err) {
            setError(err.message || 'Upload failed. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handleDone = () => {
        if (result?.successCount > 0) onImported()
        handleClose()
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none transition">×</button>
                </div>

                {!result ? (
                    <>
                        {/* Step 1 */}
                        <div className="mb-5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Step 1 — Download Template</p>
                            <button
                                onClick={handleDownload}
                                className="w-full border border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 text-sm font-medium px-4 py-2 rounded-lg transition"
                            >
                                ⬇ Download Template (.xlsx)
                            </button>
                        </div>

                        {/* Step 2 */}
                        <div className="mb-5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Step 2 — Upload Filled File</p>
                            <form onSubmit={handleUpload} className="space-y-3">
                                <div
                                    onClick={() => inputRef.current.click()}
                                    className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg px-4 py-5 text-center cursor-pointer transition"
                                >
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        accept=".xlsx"
                                        className="hidden"
                                        onChange={e => { setFile(e.target.files[0] ?? null); setError('') }}
                                    />
                                    {file
                                        ? <p className="text-sm text-blue-600 font-medium">{file.name}</p>
                                        : <p className="text-sm text-gray-400">Click to select an .xlsx file</p>
                                    }
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <div className="flex justify-end gap-3 pt-1">
                                    <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!file || uploading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        {uploading ? 'Importing...' : 'Upload & Import'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    /* Results */
                    <div className="space-y-4">
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold text-green-600">{result.successCount} of {result.totalRows}</span> rows imported successfully.
                        </p>
                        {result.failureCount > 0 && (
                            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                                <p className="text-sm font-semibold text-amber-700 mb-2">{result.failureCount} row{result.failureCount > 1 ? 's' : ''} failed:</p>
                                <ul className="text-xs text-red-600 space-y-0.5 max-h-36 overflow-y-auto">
                                    {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="flex justify-end pt-1">
                            <button
                                onClick={handleDone}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
