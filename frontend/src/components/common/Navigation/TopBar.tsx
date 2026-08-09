import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { FaMoon, FaSun, FaBell, FaUserCircle, FaSignOutAlt } from 'react-icons/fa'
import { getInitials } from '../../../utils/helpers'

const TopBar: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showDropdown, setShowDropdown] = React.useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-surface/80 backdrop-blur border-b border-gray-200/60 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-semibold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-sm text-gray-500">
            {user?.role === 'admin' ? 'Administrator' : 
             user?.role === 'manager' ? 'Manager' : 'Employee'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {theme === 'light' ? <FaMoon className="w-5 h-5 text-gray-600" /> : <FaSun className="w-5 h-5 text-warning" />}
          </button>

          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <FaBell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-surface"></span>
          </button>

          <div className="relative ml-2">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-signature text-white flex items-center justify-center text-sm font-semibold shadow-glow">
                {user ? getInitials(user.full_name) : 'U'}
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-elevated rounded-lg shadow-card border border-gray-200/60 py-1 z-50">
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    // '/profile' isn't a real route — only '/employee/profile'
                    // and '/admin/settings' exist, so this used to fall
                    // through to the catch-all and bounce to /login.
                    navigate(user?.role === 'employee' ? '/employee/profile' : '/admin/settings')
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaUserCircle className="w-4 h-4 mr-2" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-danger hover:bg-danger/10"
                >
                  <FaSignOutAlt className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar