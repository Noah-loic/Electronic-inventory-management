import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
    { to: '/admin/dashboard',        label: 'Dashboard' },
    { to: '/admin/branches',         label: 'Branches' },
    { to: '/admin/departments',      label: 'Departments' },
    { to: '/admin/employees',        label: 'Employees' },
    { to: '/admin/devices',          label: 'Devices' },
    { to: '/admin/assignments',      label: 'Assignments' },
    { to: '/admin/repair-requests',  label: 'Repair Requests' },
    { to: '/admin/audit',            label: 'Audit Report' },
    { to: '/admin/users',            label: 'Users & Permissions' },
]

export default function AdminLayout() {
    const { auth, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">

            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-gray-900 text-white flex flex-col transition-all duration-200 shrink-0`}>

                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg shrink-0 flex items-center justify-center font-bold text-sm">E</div>
                    {sidebarOpen && <span className="font-semibold text-sm tracking-wide">EUCL Inventory</span>}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
                    {navLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`
                            }
                        >
                            <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                            {sidebarOpen && <span>{link.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Collapse toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="px-4 py-3 text-gray-400 hover:text-white text-xs border-t border-gray-700 text-left"
                >
                    {sidebarOpen ? '← Collapse' : '→'}
                </button>
            </aside>

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Topbar */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-sm text-gray-500">
                        Admin Portal
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700 font-medium">{auth?.username}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">{auth?.role}</span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-500 hover:text-red-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
