import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import Input from '../../components/shared/Forms/Input'
import TextArea from '../../components/shared/Forms/TextArea'
import Select from '../../components/shared/Forms/Select'
import { tasksApi } from '../../api/tasks'
import { usersApi } from '../../api/users'
import { User } from '../../types/user'
import toast from 'react-hot-toast'

const CreateTask: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<User[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    allocated_hours: 1,
    priority: 'medium',
    due_date: '',
  })

  useEffect(() => {
    // Populate the "Assigned To" dropdown from real users, using each
    // user's actual id (a UUID) as the option value. The field used to be
    // a free-text box asking for a raw UUID, which nobody could realistically
    // fill in correctly - typing the visible Employee ID (e.g. "EMP002")
    // instead caused task creation to fail with a Postgres UUID error.
    const fetchEmployees = async () => {
      try {
        const data = await usersApi.getAll()
        setEmployees(data)
      } catch (error) {
        toast.error('Failed to load employees')
      }
    }
    fetchEmployees()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await tasksApi.create(formData as any)
      toast.success('Task created')
      navigate('/admin/tasks')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Task</h1>
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl shadow-sm p-6 space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Select
            label="Assigned To"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            required
            options={employees.map((emp) => ({
              value: emp.id,
              label: emp.employee_id
                ? `${emp.full_name} (${emp.employee_id})`
                : emp.full_name,
            }))}
          />
          <Input
            label="Allocated Hours"
            type="number"
            value={formData.allocated_hours}
            onChange={(e) =>
              setFormData({ ...formData, allocated_hours: Number(e.target.value) })
            }
            required
          />
          <Input
            label="Due Date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
    </AdminLayout>
  )
}

export default CreateTask