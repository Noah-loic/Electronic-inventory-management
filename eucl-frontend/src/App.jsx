import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RequirePermission from './components/RequirePermission'
import LoginPage from './pages/LoginPage'
import AdminLayout from './layouts/AdminLayout'
import PortalLayout from './layouts/PortalLayout'
import DashboardPage from './pages/admin/DashboardPage'
import BranchesPage from './pages/admin/BranchesPage'
import DepartmentsPage from './pages/admin/DepartmentsPage'
import EmployeesPage from './pages/admin/EmployeesPage'
import UsersPage from './pages/admin/UsersPage'
import RolesPage from './pages/admin/RolesPage'
import DevicesPage from './pages/admin/DevicesPage'
import AssignmentsPage from './pages/admin/AssignmentsPage'
import RepairRequestsPage from './pages/admin/RepairRequestsPage'
import AuditPage from './pages/admin/AuditPage'
import InventoryPage from './pages/admin/InventoryPage'
import ReportsPage from './pages/admin/ReportsPage'
import PortalDashboardPage from './pages/portal/PortalDashboardPage'

function Unauthorized() {
    return <div className="p-8 text-red-500">403 — You are not authorized to view this page.</div>
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Admin routes */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="branches" element={<BranchesPage />} />
                        <Route path="departments" element={<DepartmentsPage />} />
                        <Route path="employees" element={<EmployeesPage />} />
                        <Route path="devices" element={<DevicesPage />} />
                        <Route path="assignments" element={<AssignmentsPage />} />
                        <Route path="repair-requests" element={<RepairRequestsPage />} />
                        <Route path="reports" element={<ReportsPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="roles" element={<RolesPage />} />
                    </Route>

                    {/* Generic portal routes */}
                    <Route
                        path="/portal"
                        element={
                            <ProtectedRoute>
                                <PortalLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/portal/dashboard" replace />} />
                        <Route path="dashboard" element={<PortalDashboardPage />} />
                        <Route path="branches" element={<RequirePermission permission="BRANCH_READ"><BranchesPage /></RequirePermission>} />
                        <Route path="departments" element={<RequirePermission permission="DEPARTMENT_READ"><DepartmentsPage /></RequirePermission>} />
                        <Route path="employees" element={<RequirePermission permission="EMPLOYEE_READ"><EmployeesPage /></RequirePermission>} />
                        <Route path="devices" element={<RequirePermission permission="DEVICE_READ"><DevicesPage /></RequirePermission>} />
                        <Route path="assignments" element={<RequirePermission permission="ASSIGNMENT_READ"><AssignmentsPage /></RequirePermission>} />
                        <Route path="repair-requests" element={<RequirePermission permission="REPAIR_REQUEST_READ"><RepairRequestsPage /></RequirePermission>} />
                        <Route path="reports" element={<RequirePermission permission="REPORT_READ"><ReportsPage /></RequirePermission>} />
                        <Route path="users" element={<RequirePermission permission="USER_READ"><UsersPage /></RequirePermission>} />
                        <Route path="roles" element={<RequirePermission permission="ROLE_READ"><RolesPage /></RequirePermission>} />
                    </Route>

                    {/* default redirect */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
