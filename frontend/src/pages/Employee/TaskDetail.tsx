import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import EmployeeLayout from '../../components/common/Layout/EmployeeLayout'
import Input from '../../components/shared/Forms/Input'
import TextArea from '../../components/shared/Forms/TextArea'
import Spinner from '../../components/common/Loading/Spinner'
import { tasksApi } from '../../api/tasks'
import { timeLogsApi, TimeLog } from '../../api/time-logs'
import { Task } from '../../types/task'
import toast from 'react-hot-toast'

// This page used to just show the task title/status/description with no
// way to actually log time against it (the "Log Time" button on MyTasks
// routed here and there was nothing to do). That's why hours were never
// recorded, and in turn why efficiency/completion-rate/score all showed
// as zero everywhere - those are all calculated from actual_hours, which
// the backend only ever populates from time_logs rows (see
// TimeLogService._update_task_actual_hours). The API client already had
// a working timeLogsApi.create/getByTask - it just wasn't wired to any UI.
const TaskDetail: React.FC = () => {
  const { id } = useParams()
  const [task, setTask] = useState<Task | null>(null)
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [hoursSpent, setHoursSpent] = useState('')
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')

  const fetchData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [taskData, logsData] = await Promise.all([
        tasksApi.getById(id),
        timeLogsApi.getByTask(id),
      ])
      setTask(taskData)
      setLogs(logsData)
    } catch (err) {
      toast.error('Failed to load task')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    const hours = parseFloat(hoursSpent)
    if (!hours || hours <= 0) {
      toast.error('Enter a valid number of hours')
      return
    }

    try {
      setSubmitting(true)
      await timeLogsApi.create({
        task_id: id,
        hours_spent: hours,
        log_date: logDate,
        description: description || undefined,
      })
      toast.success('Time logged')
      setHoursSpent('')
      setDescription('')
      await fetchData()
    } catch (err) {
      toast.error('Failed to log time')
    } finally {
      setSubmitting(false)
    }
  }

  const totalLogged = logs.reduce((sum, log) => sum + log.hours_spent, 0)

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Task Detail</h1>

        <div className="bg-surface rounded-xl shadow-sm p-6">
          {loading ? (
            <Spinner />
          ) : task ? (
            <div className="space-y-2 text-gray-700">
              <p><span className="font-medium">Title:</span> {task.title}</p>
              <p><span className="font-medium">Status:</span> {task.status}</p>
              <p><span className="font-medium">Description:</span> {task.description}</p>
              <p><span className="font-medium">Allocated Hours:</span> {task.allocated_hours}</p>
              <p><span className="font-medium">Actual Hours Logged:</span> {totalLogged}</p>
            </div>
          ) : (
            <p className="text-gray-500">Task not found.</p>
          )}
        </div>

        {task && (
          <div className="bg-surface rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Time</h2>
            <form onSubmit={handleLogTime} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hours Spent"
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(e.target.value)}
                  required
                />
                <Input
                  label="Date"
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  required
                />
              </div>
              <TextArea
                label="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? 'Logging...' : 'Log Time'}
              </button>
            </form>
          </div>
        )}

        {task && (
          <div className="bg-surface rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Time Log History</h2>
            {logs.length === 0 ? (
              <p className="text-gray-500">No time logged yet.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center border-b border-gray-100 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{log.log_date}</span>
                      {log.description && (
                        <span className="text-gray-500 ml-2">{log.description}</span>
                      )}
                    </div>
                    <span className="font-medium">{log.hours_spent}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </EmployeeLayout>
  )
}

export default TaskDetail