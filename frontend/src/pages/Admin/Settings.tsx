import React from 'react'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { getInitials } from '../../utils/helpers'
import { FaMoon, FaSun } from 'react-icons/fa'

const Settings: React.FC = () => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl space-y-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Settings</h1>

        <div className="card">
          <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">Account</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-signature text-white flex items-center justify-center text-lg font-semibold shadow-glow">
              {user ? getInitials(user.full_name) : 'A'}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="label mb-0">Role</p>
              <p className="text-gray-900 capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="label mb-0">Status</p>
              <p className="text-success">Active</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Theme</p>
              <p className="text-sm text-gray-500">Switch between light and dark mode</p>
            </div>
            <button onClick={toggleTheme} className="btn-secondary flex items-center gap-2">
              {theme === 'light' ? <FaMoon /> : <FaSun className="text-warning" />}
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Settings