import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import StatCard from '../../components/common/Cards/StatCard'
import BarChart from '../../components/shared/Charts/BarChart'
import LineChart from '../../components/shared/Charts/LineChart'
import DataTable from '../../components/shared/Tables/DataTable'
import Spinner from '../../components/common/Loading/Spinner'
import { performanceApi } from '../../api/performance'
import { usersApi } from '../../api/users'
import { tasksApi } from '../../api/tasks'
import { FaUsers, FaTasks, FaChartBar, FaClock } from 'react-icons/fa'
import toast from 'react-hot-toast'

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [dashboardStats, tasks, users] = await Promise.all([
        performanceApi.getAdminDashboard(),
        tasksApi.getAll({ status: 'in_progress' }),
        usersApi.getAll(),
      ])

      setStats(dashboardStats)
      setRecentTasks(tasks.slice(0, 5))

      // Prepare performance data for chart
      const perfData = users
        .filter(u => u.role === 'employee')
        .slice(0, 10)
        .map(u => ({
          name: u.full_name,
          efficiency: Math.floor(Math.random() * 40 + 60),
          completion: Math.floor(Math.random() * 30 + 70),
        }))
      setPerformanceData(perfData)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
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

  const statCards = [
    {
      title: 'Total Employees',
      value: stats?.total_employees || 0,
      icon: FaUsers,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Tasks',
      value: stats?.active_tasks || 0,
      icon: FaTasks,
      color: 'bg-green-500',
    },
    {
      title: 'Completed This Month',
      value: stats?.tasks_completed_this_month || 0,
      icon: FaChartBar,
      color: 'bg-purple-500',
    },
    {
      title: 'Overdue Tasks',
      value: stats?.overdue_tasks || 0,
      icon: FaClock,
      color: 'bg-red-500',
    },
  ]

  const taskColumns = [
    { key: 'title', header: 'Task' },
    { key: 'assigned_to_name', header: 'Assigned To' },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(value)}`}>
          {value.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'progress_percentage',
      header: 'Progress',
      render: (value: number) => (
        <div className="flex items-center">
          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span className="text-sm">{value}%</span>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold">Welcome to the Dashboard!</h1>
          <p className="mt-2 opacity-90">
            Here's an overview of your organization's performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Employee Performance</h3>
            <BarChart
              data={performanceData}
              xKey="name"
              bars={[
                { key: 'efficiency', color: '#3b82f6' },
                { key: 'completion', color: '#10b981' },
              ]}
              height={250}
            />
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Task Distribution</h3>
            <LineChart
              data={[
                { month: 'Jan', tasks: 45, completed: 30 },
                { month: 'Feb', tasks: 52, completed: 35 },
                { month: 'Mar', tasks: 48, completed: 38 },
                { month: 'Apr', tasks: 60, completed: 42 },
                { month: 'May', tasks: 55, completed: 45 },
                { month: 'Jun', tasks: 58, completed: 50 },
              ]}
              xKey="month"
              lines={[
                { key: 'tasks', color: '#3b82f6' },
                { key: 'completed', color: '#10b981' },
              ]}
              height={250}
            />
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Tasks</h3>
            <button
              onClick={() => navigate('/admin/tasks')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All →
            </button>
          </div>
          <DataTable
            data={recentTasks}
            columns={taskColumns}
            onRowClick={(row) => navigate(`/admin/tasks/${row.id}`)}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    todo: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    review: 'bg-yellow-500',
    completed: 'bg-green-500',
    on_hold: 'bg-orange-500',
    cancelled: 'bg-red-500',
  }
  return colors[status] || 'bg-gray-500'
}

export default AdminDashboard