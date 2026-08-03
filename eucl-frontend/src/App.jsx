import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AdminLayout from './layouts/AdminLayout'
import IctLayout from './layouts/IctLayout'
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
import IctDashboardPage from './pages/ict/IctDashboardPage'
import BranchLayout from './layouts/BranchLayout'
import BranchDashboardPage from './pages/branch/BranchDashboardPage'

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
                        <Route path="audit" element={<AuditPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="roles" element={<RolesPage />} />
                    </Route>

                    {/* ICT Staff routes */}
                    <Route
                        path="/ict"
                        element={
                            <ProtectedRoute allowedRoles={['ICT_STAFF']}>
                                <IctLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/ict/dashboard" replace />} />
                        <Route path="dashboard" element={<IctDashboardPage />} />
                        <Route path="devices" element={<DevicesPage />} />
                        <Route path="assignments" element={<AssignmentsPage />} />
                        <Route path="repair-requests" element={<RepairRequestsPage />} />
                        <Route path="employees" element={<EmployeesPage />} />
                    </Route>

                    {/* Branch Manager routes */}
                    <Route
                        path="/branch"
                        element={
                            <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                                <BranchLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/branch/dashboard" replace />} />
                        <Route path="dashboard" element={<BranchDashboardPage />} />
                        <Route path="repair-requests" element={<RepairRequestsPage branchOnly={true} useTagInput={true} />} />
                    </Route>

                    {/* default redirect */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
