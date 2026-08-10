import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeLayout from '../../components/common/Layout/EmployeeLayout'
import TaskCard from '../../components/common/Cards/TaskCard'
import Input from '../../components/shared/Forms/Input'
import Select from '../../components/shared/Forms/Select'
import Spinner from '../../components/common/Loading/Spinner'
import { tasksApi } from '../../api/tasks'
import { Task } from '../../types/task'
import { TASK_STATUSES } from '../../utils/constants'
import { FaSearch } from 'react-icons/fa'
import toast from 'react-hot-toast'

const MyTasks: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    filterTasks()
  }, [tasks, searchTerm, statusFilter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await tasksApi.getMyTasks()
      setTasks(data)
      setFilteredTasks(data)
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

    setFilteredTasks(filtered)
  }

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      setUpdating(taskId)
      await tasksApi.updateStatus(taskId, status)
      toast.success('Task status updated')
      fetchTasks()
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...TASK_STATUSES.map(s => ({ value: s.value, label: s.label })),
  ]

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-500">Manage your assigned tasks</p>
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
            <div className="flex items-center">
              <span className="text-sm text-gray-500">
                {filteredTasks.length} tasks found
              </span>
            </div>
          </div>
        </div>

        {/* Task Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.length === 0 ? (
            <div className="col-span-2 card text-center py-12">
              <p className="text-gray-500">No tasks found</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="space-y-2">
                <TaskCard task={task} />
                <div className="flex space-x-2">
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                        disabled={updating === task.id}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'review')}
                        disabled={updating === task.id}
                        className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Mark this task as completed?')) {
                            handleUpdateStatus(task.id, 'completed')
                          }
                        }}
                        disabled={updating === task.id}
                        className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => navigate(`/employee/tasks/${task.id}`)}
                        className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      >
                        Log Time
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </EmployeeLayout>
  )
}

export default MyTasks