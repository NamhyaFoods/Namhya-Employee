import React from 'react'
import EmployeeLayout from '../../components/common/Layout/EmployeeLayout'
import { useAuth } from '../../contexts/AuthContext'

const Profile: React.FC = () => {
  const { user } = useAuth()
  return (
    <EmployeeLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Profile</h1>
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-2 text-gray-700">
          <p><span className="font-medium">Name:</span> {user?.full_name}</p>
          <p><span className="font-medium">Email:</span> {user?.email}</p>
          <p><span className="font-medium">Role:</span> {user?.role}</p>
        </div>
      </div>
    </EmployeeLayout>
  )
}

export default Profile