import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminNav from '../Navigation/AdminNav'
import TopBar from '../Navigation/TopBar'

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-radial-glow bg-no-repeat">
      <AdminNav />
      <div className="ml-64">
        <TopBar />
        <main className="p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout