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
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-sm text-gray-500">
            {user?.role === 'admin' ? 'Administrator' : 
             user?.role === 'manager' ? 'Manager' : 'Employee'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {theme === 'light' ? <FaMoon className="w-5 h-5 text-gray-600" /> : <FaSun className="w-5 h-5 text-yellow-500" />}
          </button>

          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <FaBell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium">
                {user ? getInitials(user.full_name) : 'U'}
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    navigate('/profile')
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FaUserCircle className="w-4 h-4 mr-2" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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