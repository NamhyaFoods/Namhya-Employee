import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import Input from '../../components/shared/Forms/Input'
import TextArea from '../../components/shared/Forms/TextArea'
import Select from '../../components/shared/Forms/Select'
import { tasksApi } from '../../api/tasks'
import { usersApi } from '../../api/users'
import toast from 'react-hot-toast'

const CreateTask: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    allocated_hours: 1,
    priority: 'medium',
    due_date: '',
  })

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
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
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
          <Input
            label="Assigned To (user id)"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            required
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