import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeLayout from '../../components/common/Layout/EmployeeLayout'
import StatCard from '../../components/common/Cards/StatCard'
import TaskCard from '../../components/common/Cards/TaskCard'
import Spinner from '../../components/common/Loading/Spinner'
import { tasksApi } from '../../api/tasks'
import { performanceApi } from '../../api/performance'
import { Task } from '../../types/task'
import { FaTasks, FaCheckCircle, FaClock, FaChartBar } from 'react-icons/fa'
import toast from 'react-hot-toast'

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<any>(null)
  const [performance, setPerformance] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [taskStats, myTasks, perfData] = await Promise.all([
        tasksApi.getMyStats(),
        tasksApi.getMyTasks(),
        performanceApi.getMyPerformance(),
      ])

      setStats(taskStats)
      setTasks(myTasks.slice(0, 5))
      setPerformance(perfData)
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

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
        {/* Welcome Section */}
        <div className="bg-gradient-signature rounded-2xl p-6 text-white shadow-glow relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="mt-2 opacity-90">
            Here's your task and performance overview
          </p>
          {performance && (
            <div className="mt-4 flex items-center space-x-6">
              <div>
                <div className="text-sm opacity-75">Your Score</div>
                <div className="text-3xl font-bold">{performance.work_score?.toFixed(1) || '0.0'}/5.0</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Completion Rate</div>
                <div className="text-2xl font-bold">{performance.completion_rate?.toFixed(1) || 0}%</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Avg Efficiency</div>
                <div className="text-2xl font-bold">{performance.avg_efficiency?.toFixed(1) || 0}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Tasks"
            value={stats?.total_tasks || 0}
            icon={FaTasks}
            color="bg-blue-500"
          />
          <StatCard
            title="Completed"
            value={stats?.completed_tasks || 0}
            icon={FaCheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="In Progress"
            value={stats?.in_progress_tasks || 0}
            icon={FaClock}
            color="bg-yellow-500"
          />
          <StatCard
            title="Efficiency"
            value={`${stats?.avg_efficiency?.toFixed(1) || 0}%`}
            icon={FaChartBar}
            color="bg-purple-500"
          />
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Tasks</h3>
            <button
              onClick={() => navigate('/employee/tasks')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks assigned yet</p>
            ) : (
              tasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/employee/tasks')}
            className="p-4 bg-primary-500/10 text-primary-300 border border-primary-500/20 rounded-lg hover:bg-primary-500/20 transition-colors"
          >
            <FaTasks className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">My Tasks</span>
          </button>
          <button
            onClick={() => navigate('/employee/performance')}
            className="p-4 bg-success/10 text-green-400 border border-success/20 rounded-lg hover:bg-success/20 transition-colors"
          >
            <FaChartBar className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">My Performance</span>
          </button>
          <button
            onClick={() => navigate('/employee/profile')}
            className="p-4 bg-accent-500/10 text-accent-300 border border-accent-500/20 rounded-lg hover:bg-accent-500/20 transition-colors"
          >
            <FaCheckCircle className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Profile</span>
          </button>
        </div>
      </div>
    </EmployeeLayout>
  )
}

export default EmployeeDashboard