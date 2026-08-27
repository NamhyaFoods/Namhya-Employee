import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import { usersApi } from '../../api/users'
import { User } from '../../types/user'

const EmployeeProfile: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    usersApi
      .getById(id)
      .then(setUser)
      .finally(() => setLoading(false))
  }, [id])

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Employee Profile</h1>
          {user && (
            <button
              onClick={() => navigate(`/admin/employees/${id}/edit`)}
              className="btn-primary"
            >
              Edit
            </button>
          )}
        </div>
        <div className="bg-surface rounded-xl shadow-sm p-6">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : user ? (
            <div className="space-y-2 text-gray-700">
              <p><span className="font-medium">Name:</span> {user.full_name}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Role:</span> {user.role}</p>
              <p><span className="font-medium">Department:</span> {user.department || '-'}</p>
              <p><span className="font-medium">Designation:</span> {user.designation || '-'}</p>
              <p><span className="font-medium">Phone:</span> {user.phone_number || '-'}</p>
              <p><span className="font-medium">Status:</span> {user.is_active ? 'Active' : 'Inactive'}</p>
            </div>
          ) : (
            <p className="text-gray-500">Employee not found.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default EmployeeProfile
