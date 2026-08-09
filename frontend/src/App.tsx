import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Pages
import Login from './pages/Login'
import AdminDashboard from './pages/Admin/Dashboard'
import AdminEmployees from './pages/Admin/Employees'
import AdminAddEmployee from './pages/Admin/AddEmployee'
import AdminEmployeeProfile from './pages/Admin/EmployeeProfile'
import AdminBulkImport from './pages/Admin/BulkImport'
import AdminTasks from './pages/Admin/Tasks'
import AdminCreateTask from './pages/Admin/CreateTask'
import AdminPerformance from './pages/Admin/Performance'
import AdminMonthlyReview from './pages/Admin/MonthlyReview'
import AdminReviewDetail from './pages/Admin/ReviewDetail'
import AdminSettings from './pages/Admin/Settings'
import EmployeeDashboard from './pages/Employee/Dashboard'
import EmployeeMyTasks from './pages/Employee/MyTasks'
import EmployeeTaskDetail from './pages/Employee/TaskDetail'
import EmployeeMyPerformance from './pages/Employee/MyPerformance'
import EmployeeProfile from './pages/Employee/Profile'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" />} />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/employees"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminEmployees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/employees/new"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminAddEmployee />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/employees/bulk-import"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminBulkImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/employees/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminEmployeeProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tasks"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminTasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tasks/new"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminCreateTask />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tasks/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminCreateTask />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tasks/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminCreateTask />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/performance"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminPerformance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminMonthlyReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reviews/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminReviewDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />

              {/* Employee Routes */}
              <Route
                path="/employee/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/tasks"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeMyTasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/tasks/:id"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeTaskDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/performance"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeMyPerformance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/profile"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeProfile />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App