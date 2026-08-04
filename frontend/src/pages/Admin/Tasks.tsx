import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import DataTable from '../../components/shared/Tables/DataTable'
import Input from '../../components/shared/Forms/Input'
import Select from '../../components/shared/Forms/Select'
import Spinner from '../../components/common/Loading/Spinner'
import StatCard from '../../components/common/Cards/StatCard'
import { tasksApi } from '../../api/tasks'
// Remove usersApi - not used
// import { usersApi } from '../../api/users'
import { Task } from '../../types/task'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/formatters'
import { FaPlus, FaSearch, FaTasks } from 'react-icons/fa'
import toast from 'react-hot-toast'

const Tasks: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    filterTasks()
  }, [tasks, searchTerm, statusFilter, priorityFilter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await tasksApi.getAll()
      setTasks(data)
      setFilteredTasks(data)

      // Calculate stats
      const total = data.length
      const completed = data.filter(t => t.status === 'completed').length
      const inProgress = data.filter(t => t.status === 'in_progress').length
      const overdue = data.filter(t => t.is_overdue).length
      setStats({ total, completed, inProgress, overdue })
    } catch (error) {
      toast.error('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = [...tasks]

    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    if (priorityFilter) {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    setFilteredTasks(filtered)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksApi.delete(id)
        toast.success('Task deleted successfully')
        fetchTasks()
      } catch (error) {
        toast.error('Failed to delete task')
      }
    }
  }

  const columns = [
    {
      key: 'title' as keyof Task,
      header: 'Task',
      render: (value: string, row: Task) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {row.description || 'No description'}
          </div>
        </div>
      ),
    },
    {
      key: 'assigned_to_name' as keyof Task,
      header: 'Assigned To',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'priority' as keyof Task,
      header: 'Priority',
      render: (value: string) => (
        <span className={`text-sm font-medium ${getPriorityColor(value)}`}>
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'status' as keyof Task,
      header: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(value)}`}>
          {value.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'progress_percentage' as keyof Task,
      header: 'Progress',
      render: (value: number) => (
        <div className="flex items-center">
          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span className="text-sm">{value}%</span>
        </div>
      ),
    },
    {
      key: 'allocated_hours' as keyof Task,
      header: 'Hours',
      render: (value: number, row: Task) => (
        <span className="text-sm">
          {row.actual_hours}/{value}h
        </span>
      ),
    },
    {
      key: 'due_date' as keyof Task,
      header: 'Due Date',
      render: (value: string, row: Task) => (
        <div>
          <div className="text-sm">{formatDate(value)}</div>
          {row.is_overdue && row.status !== 'completed' && (
            <span className="text-xs text-red-600">Overdue!</span>
          )}
        </div>
      ),
    },
    {
      key: 'id' as keyof Task,
      header: 'Actions',
      render: (value: string) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/admin/tasks/${value}`)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View
          </button>
          <button
            onClick={() => navigate(`/admin/tasks/${value}/edit`)}
            className="text-yellow-600 hover:text-yellow-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(value)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...TASK_STATUSES.map(s => ({ value: s.value, label: s.label })),
  ]

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    ...TASK_PRIORITIES.map(p => ({ value: p.value, label: p.label })),
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-500">Manage all tasks in the system</p>
          </div>
          <button
            onClick={() => navigate('/admin/tasks/new')}
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Tasks" value={stats.total} icon={FaTasks} color="bg-blue-500" />
          <StatCard title="Completed" value={stats.completed} icon={FaTasks} color="bg-green-500" />
          <StatCard title="In Progress" value={stats.inProgress} icon={FaTasks} color="bg-yellow-500" />
          <StatCard title="Overdue" value={stats.overdue} icon={FaTasks} color="bg-red-500" />
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<FaSearch />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={priorityOptions}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">
                {filteredTasks.length} tasks found
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <DataTable
            data={filteredTasks}
            columns={columns}
            onRowClick={(row) => navigate(`/admin/tasks/${row.id}`)}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export default Tasks