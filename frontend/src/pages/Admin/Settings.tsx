import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import Input from '../../components/shared/Forms/Input'
import Select from '../../components/shared/Forms/Select'
import { usersApi, CreateEmployeePayload } from '../../api/users'
import toast from 'react-hot-toast'

const AddEmployee: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateEmployeePayload>({
    email: '',
    full_name: '',
    role: 'employee',
    department: '',
    designation: '',
    employee_id: '',
    phone_number: '',
    password: '',
    confirm_password: '',
  })

  const handleChange = (field: keyof CreateEmployeePayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await usersApi.create(formData)
      toast.success('Employee added')
      navigate('/admin/employees')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to add employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Employee</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={handleChange('full_name')}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
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
            label="Employee ID"
            value={formData.employee_id}
            onChange={handleChange('employee_id')}
          />
          <Input
            label="Phone Number"
            value={formData.phone_number}
            onChange={handleChange('phone_number')}
          />
          <Input
            label="Temporary Password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirm_password}
            onChange={handleChange('confirm_password')}
            required
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add Employee'}
          </button>
        </form>
      </div>
    </AdminLayout>
  )
}

export default AddEmployee