import React, { useState, useEffect } from 'react'
// Remove useNavigate - not used
// import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import StatCard from '../../components/common/Cards/StatCard'
import BarChart from '../../components/shared/Charts/BarChart'
import LineChart from '../../components/shared/Charts/LineChart'
import Spinner from '../../components/common/Loading/Spinner'
import { performanceApi } from '../../api/performance'
import { usersApi } from '../../api/users'
import { FaChartBar, FaUserCheck, FaAward, FaArrowUp } from 'react-icons/fa'
import toast from 'react-hot-toast'

const Performance: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [stats, setStats] = useState({
    avgScore: 0,
    topPerformer: '',
    totalReviews: 0,
    improvement: 0,
  })

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      const [leaderboardData, users] = await Promise.all([
        performanceApi.getLeaderboard(10),
        usersApi.getAll(),
      ])

      setLeaderboard(leaderboardData)

      const scores = leaderboardData.map((p: any) => p.score)
      const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length || 0
      const topPerformer = leaderboardData.length > 0 ? leaderboardData[0].full_name : 'N/A'

      setStats({
        avgScore: Math.round(avgScore * 10) / 10,
        topPerformer,
        totalReviews: leaderboardData.length,
        improvement: 8.5,
      })

      const chartData = users
        .filter(u => u.role === 'employee')
        .slice(0, 15)
        .map(u => ({
          name: u.full_name,
          score: Math.floor(Math.random() * 30 + 20) / 10,
          efficiency: Math.floor(Math.random() * 40 + 60),
          completion: Math.floor(Math.random() * 30 + 70),
        }))
      setPerformanceData(chartData)
    } catch (error) {
      toast.error('Failed to load performance data')
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Overview</h1>
          <p className="text-gray-500">Track employee performance metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Average Score"
            value={`${stats.avgScore}/5.0`}
            icon={FaChartBar}
            color="bg-blue-500"
          />
          <StatCard
            title="Top Performer"
            value={stats.topPerformer}
            icon={FaAward}
            color="bg-yellow-500"
            subtitle="Highest score"
          />
          <StatCard
            title="Total Reviews"
            value={stats.totalReviews}
            icon={FaUserCheck}
            color="bg-green-500"
          />
          <StatCard
            title="Improvement"
            value={`${stats.improvement}%`}
            icon={FaArrowUp}
            color="bg-purple-500"
            subtitle="vs last month"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Employee Scores</h3>
            <BarChart
              data={performanceData}
              xKey="name"
              bars={[
                { key: 'score', color: '#3b82f6' },
                { key: 'efficiency', color: '#10b981' },
              ]}
              height={300}
            />
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
            <LineChart
              data={[
                { month: 'Jan', score: 3.2, efficiency: 65 },
                { month: 'Feb', score: 3.5, efficiency: 68 },
                { month: 'Mar', score: 3.8, efficiency: 72 },
                { month: 'Apr', score: 4.0, efficiency: 75 },
                { month: 'May', score: 4.2, efficiency: 78 },
                { month: 'Jun', score: 4.5, efficiency: 82 },
              ]}
              xKey="month"
              lines={[
                { key: 'score', color: '#3b82f6' },
                { key: 'efficiency', color: '#10b981' },
              ]}
              height={300}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🏆 Top Performers</h3>
          <div className="space-y-3">
            {leaderboard.map((item, index) => (
              <div
                key={item.user_id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-medium">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{item.full_name}</div>
                    <div className="text-sm text-gray-500">{item.department || 'No Department'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Score</div>
                    <div className="font-medium">{item.score}/5.0</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Efficiency</div>
                    <div className="font-medium">{item.avg_efficiency?.toFixed(1) || 0}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Completion</div>
                    <div className="font-medium">{item.completion_rate?.toFixed(1) || 0}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Performance