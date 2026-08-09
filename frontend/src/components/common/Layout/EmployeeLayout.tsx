import React from 'react'
import { Outlet } from 'react-router-dom'
import EmployeeNav from '../Navigation/EmployeeNav'
import TopBar from '../Navigation/TopBar'

const EmployeeLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-radial-glow bg-no-repeat">
      <EmployeeNav />
      <div className="ml-64">
        <TopBar />
        <main className="p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default EmployeeLayout