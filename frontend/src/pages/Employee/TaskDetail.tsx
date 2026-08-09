import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import EmployeeLayout from '../../components/common/Layout/EmployeeLayout'
import { tasksApi } from '../../api/tasks'

const TaskDetail: React.FC = () => {
  const { id } = useParams()
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    tasksApi
      .getById(id)
      .then(setTask)
      .finally(() => setLoading(false))
  }, [id])

  return (
    <EmployeeLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Task Detail</h1>
        <div className="bg-surface rounded-xl shadow-sm p-6">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : task ? (
            <div className="space-y-2 text-gray-700">
              <p><span className="font-medium">Title:</span> {task.title}</p>
              <p><span className="font-medium">Status:</span> {task.status}</p>
              <p><span className="font-medium">Description:</span> {task.description}</p>
            </div>
          ) : (
            <p className="text-gray-500">Task not found.</p>
          )}
        </div>
      </div>
    </EmployeeLayout>
  )
}

export default TaskDetail