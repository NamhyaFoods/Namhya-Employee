import React from 'react'
import AdminLayout from '../../components/common/Layout/AdminLayout'

const BulkImport: React.FC = () => {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Bulk Import Employees</h1>
        <div className="bg-surface rounded-xl shadow-sm p-6 text-gray-600">
          Bulk import UI is not built yet. This is a placeholder so the route
          resolves instead of redirecting to login.
        </div>
      </div>
    </AdminLayout>
  )
}

export default BulkImport