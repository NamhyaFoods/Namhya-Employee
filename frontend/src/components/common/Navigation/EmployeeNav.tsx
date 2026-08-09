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
    <nav className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-gray-200/60 flex flex-col">
      <div className="p-6 border-b border-gray-200/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-signature shadow-glow flex items-center justify-center font-display font-bold text-white text-sm">
          P
        </div>
        <div>
          <h1 className="font-display font-bold text-gray-900 leading-tight">Performance</h1>
          <p className="text-xs text-gray-500">Employee Dashboard</p>
        </div>
      </div>

      <div className="p-4 space-y-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex items-center px-4 py-3 rounded-lg transition-colors duration-150 ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-signature" />
                )}
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium text-sm">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default EmployeeNav