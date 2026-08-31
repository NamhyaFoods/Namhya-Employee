import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import Input from '../../components/shared/Forms/Input'
import Spinner from '../../components/common/Loading/Spinner'
import { usersApi } from '../../api/users'
import { User } from '../../types/user'
import toast from 'react-hot-toast'

type EditableFields = {
  full_name: string
  department: string
  designation: string
  phone_number: string
  role: 'admin' | 'manager' | 'employee'
  is_active: boolean
}

const EditEmployee: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employee, setEmployee] = useState<User | null>(null)
  const [formData, setFormData] = useState<EditableFields>({
    full_name: '',
    department: '',
    designation: '',
    phone_number: '',
    role: 'employee',
    is_active: true,
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!id) return
    usersApi
      .getById(id)
      .then((user) => {
        setEmployee(user)
        setFormData({
          full_name: user.full_name || '',
          department: user.department || '',
          designation: user.designation || '',
          phone_number: user.phone_number || '',
          role: user.role,
          is_active: user.is_active,
        })
      })
      .catch(() => toast.error('Failed to load employee'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (field: keyof EditableFields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value =
      field === 'is_active' ? (e.target as HTMLInputElement).value === 'true' : e.target.value
    setFormData({ ...formData, [field]: value as never })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    // Password fields are optional here - only validate/send if mam
    // actually typed something into them.
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters')
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
    }

    setSaving(true)
    try {
      await usersApi.update(id, formData)
      if (newPassword) {
        await usersApi.updatePassword(id, newPassword)
      }
      toast.success('Employee updated')
      navigate(`/admin/employees/${id}`)
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to update employee')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  if (!employee) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-gray-500">Employee not found.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Employee</h1>
        <p className="text-gray-500 mb-6">{employee.email}</p>
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl shadow-sm p-6 space-y-4">
          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={handleChange('full_name')}
            required
          />
          <div>
            <label className="label">Role</label>
            <select
              className="input-field"
              value={formData.role}
              onChange={handleChange('role') as any}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Input
            label="Department"
            value={formData.department}
            onChange={handleChange('department')}
          />
          <Input
            label="Designation"
            value={formData.designation}
            onChange={handleChange('designation')}
          />
          <Input
            label="Phone Number"
            value={formData.phone_number}
            onChange={handleChange('phone_number')}
          />
          <div className="border-t pt-4">
            <p className="label mb-2">Reset Password (optional)</p>
            <div className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helper="Leave blank to keep the employee's current password."
                placeholder="Leave blank to keep current password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input-field"
              value={String(formData.is_active)}
              onChange={handleChange('is_active') as any}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex space-x-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/admin/employees/${id}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

export default EditEmployee
