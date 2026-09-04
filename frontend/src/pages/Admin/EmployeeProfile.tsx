import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import Input from '../../components/shared/Forms/Input'
import TextArea from '../../components/shared/Forms/TextArea'
import Select from '../../components/shared/Forms/Select'
import TaskCard from '../../components/common/Cards/TaskCard'
import { usersApi } from '../../api/users'
import { tasksApi } from '../../api/tasks'
import { User } from '../../types/user'
import { Task, TaskCreate } from '../../types/task'
import toast from 'react-hot-toast'

const EMPTY_TASK_FORM = {
  title: '',
  description: '',
  allocated_hours: 1,
  priority: 'medium' as const,
  due_date: '',
}

const EmployeeProfile: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Tasks assigned to this employee, shown right here on the profile page.
  // This is separate from (and in addition to) the standalone /admin/tasks
  // list/create flow - that flow still exists unchanged, this just adds a
  // quicker path for "I'm already looking at this employee, let me assign
  // them something" without navigating away and re-picking them from a
  // dropdown.
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)

  const [showAddTask, setShowAddTask] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM)

  useEffect(() => {
    if (!id) return
    usersApi
      .getById(id)
      .then(setUser)
      .finally(() => setLoading(false))
  }, [id])

  const loadTasks = () => {
    if (!id) return
    setTasksLoading(true)
    tasksApi
      .getAll({ assigned_to: id })
      .then(setTasks)
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setTasksLoading(false))
  }

  useEffect(() => {
    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      await tasksApi.delete(taskId)
      toast.success('Task deleted')
      loadTasks()
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setCreatingTask(true)
    try {
      const payload: TaskCreate = {
        title: taskForm.title,
        description: taskForm.description || undefined,
        assigned_to: id,
        allocated_hours: taskForm.allocated_hours,
        priority: taskForm.priority,
        due_date: taskForm.due_date || undefined,
      }
      await tasksApi.create(payload)
      toast.success('Task assigned')
      setTaskForm(EMPTY_TASK_FORM)
      setShowAddTask(false)
      loadTasks()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to create task')
    } finally {
      setCreatingTask(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Employee Profile</h1>
          {user && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/admin/employees/${id}/edit`)}
                className="btn-primary"
              >
                Edit
              </button>
            </div>
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

        {user && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/tasks?assigned_to=${id}`)}
                  className="btn-secondary"
                >
                  View in Tasks
                </button>
                <button
                  onClick={() => setShowAddTask((v) => !v)}
                  className="btn-primary"
                >
                  {showAddTask ? 'Cancel' : '+ Add Task'}
                </button>
              </div>
            </div>

            {showAddTask && (
              <form
                onSubmit={handleCreateTask}
                className="bg-surface rounded-xl shadow-sm p-6 space-y-4 mb-4"
              >
                <Input
                  label="Title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
                <TextArea
                  label="Description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
                <Input
                  label="Allocated Hours"
                  type="number"
                  value={taskForm.allocated_hours}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, allocated_hours: Number(e.target.value) })
                  }
                  required
                />
                <Select
                  label="Priority"
                  value={taskForm.priority}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, priority: e.target.value as typeof taskForm.priority })
                  }
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ]}
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                />
                <button type="submit" disabled={creatingTask} className="btn-primary">
                  {creatingTask ? 'Assigning...' : 'Assign Task'}
                </button>
              </form>
            )}

            {tasksLoading ? (
              <p className="text-gray-500">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-gray-500">No tasks assigned to this employee yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => navigate(`/admin/tasks/${task.id}/edit`)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default EmployeeProfile
