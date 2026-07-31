import { useState, useRef, useEffect } from 'react'

/**
 * ComboBox — searchable dropdown
 * Props:
 *   options: [{ value, label }]
 *   value: current selected value
 *   onChange: (value) => void
 *   placeholder: string
 *   required: bool
 *   disabled: bool
 */
export default function ComboBox({ options = [], value, onChange, placeholder = 'Select...', required, disabled }) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    const selected = options.find(o => String(o.value) === String(value))

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filtered = query
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : options

    const handleSelect = (opt) => {
        onChange(opt.value)
        setQuery('')
        setOpen(false)
    }

    const handleInputChange = (e) => {
        setQuery(e.target.value)
        setOpen(true)
        if (!e.target.value) onChange('')
    }

    const displayValue = open ? query : (selected?.label ?? '')

    return (
        <div ref={ref} className="relative">
            <div className="relative">
                <input
                    type="text"
                    required={required && !value}
                    disabled={disabled}
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▾</span>
            </div>
            {open && filtered.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm">
                    {filtered.map(opt => (
                        <li
                            key={opt.value}
                            onMouseDown={() => handleSelect(opt)}
                            className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition ${String(opt.value) === String(value) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
            {open && filtered.length === 0 && query && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-400">
                    No results for "{query}"
                </div>
            )}
        </div>
    )
}
