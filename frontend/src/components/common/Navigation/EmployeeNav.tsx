import React from 'react'
import { NavLink } from 'react-router-dom'
import { FaHome, FaTasks, FaChartBar, FaUser } from 'react-icons/fa'

const EmployeeNav: React.FC = () => {
  const navItems = [
    { to: '/employee/dashboard', icon: FaHome, label: 'Dashboard' },
    { to: '/employee/tasks', icon: FaTasks, label: 'My Tasks' },
    { to: '/employee/performance', icon: FaChartBar, label: 'My Performance' },
    { to: '/employee/profile', icon: FaUser, label: 'Profile' },
  ]

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">Performance</h1>
        <p className="text-sm text-gray-500">Employee Dashboard</p>
      </div>

      <div className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default EmployeeNav