import React, { useState, useEffect } from 'react'
// Remove useNavigate - not used
// import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import StatCard from '../../components/common/Cards/StatCard'
import BarChart from '../../components/shared/Charts/BarChart'
import LineChart from '../../components/shared/Charts/LineChart'
import Spinner from '../../components/common/Loading/Spinner'
import { performanceApi } from '../../api/performance'
import { FaChartBar, FaUserCheck, FaAward, FaArrowUp } from 'react-icons/fa'
import toast from 'react-hot-toast'

const Performance: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [trendData, setTrendData] = useState<any[]>([])
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
      // getAdminDashboard() gives us avg_work_score_last_month, which is the
      // real baseline for the "Improvement vs last month" stat. usersApi is
      // no longer needed here - the bar chart now plots the leaderboard
      // (real, review-backed scores) instead of a random score per employee.
      const [leaderboardData, adminStats] = await Promise.all([
        performanceApi.getLeaderboard(10),
        performanceApi.getAdminDashboard(),
      ])

      setLeaderboard(leaderboardData)

      const scores = leaderboardData.map((p: any) => p.score || 0)
      const avgScore = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0
      const topPerformer = leaderboardData.length > 0 ? leaderboardData[0].full_name : 'N/A'

      // Real improvement vs last month: compare this month's average score
      // (from the leaderboard) against avg_work_score_last_month from the
      // admin dashboard view, instead of the hardcoded 8.5 placeholder.
      const lastMonthScore = adminStats?.avg_work_score_last_month || 0
      const improvement = lastMonthScore > 0
        ? Math.round(((avgScore - lastMonthScore) / lastMonthScore) * 1000) / 10
        : 0

      setStats({
        avgScore: Math.round(avgScore * 10) / 10,
        topPerformer,
        totalReviews: leaderboardData.length,
        improvement,
      })

      // Employee Scores chart now uses the actual leaderboard entries
      // (real score/efficiency/completion from performance_reviews) rather
      // than Math.random() values keyed off the full user list.
      const chartData = leaderboardData.map((p: any) => ({
        name: p.full_name,
        score: p.score || 0,
        efficiency: Math.round(p.avg_efficiency || 0),
        completion: Math.round(p.completion_rate || 0),
      }))
      setPerformanceData(chartData)

      // Performance Trends: pull each leaderboard employee's real monthly
      // trend and average them together per month, instead of a hardcoded
      // Jan-Jun fake line. Falls back to an empty array (handled in the
      // render below) if there isn't enough review history yet.
      const trendResults = await Promise.all(
        leaderboardData.map((p: any) =>
          performanceApi.getTrend(p.user_id, 6).catch(() => [])
        )
      )

      const byMonth: Record<string, { scoreSum: number; effSum: number; count: number }> = {}
      trendResults.flat().forEach((entry: any) => {
        if (!entry?.review_month) return
        const key = entry.review_month
        if (!byMonth[key]) byMonth[key] = { scoreSum: 0, effSum: 0, count: 0 }
        byMonth[key].scoreSum += entry.final_work_score || 0
        byMonth[key].effSum += entry.avg_efficiency || 0
        byMonth[key].count += 1
      })

      const trend = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, agg]) => ({
          month: new Date(month + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }),
          score: Math.round((agg.scoreSum / agg.count) * 100) / 100,
          efficiency: Math.round(agg.effSum / agg.count),
        }))
      setTrendData(trend)
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
            value={`${stats.improvement > 0 ? '+' : ''}${stats.improvement}%`}
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
            {trendData.length > 0 ? (
              <LineChart
                data={trendData}
                xKey="month"
                lines={[
                  { key: 'score', color: '#3b82f6' },
                  { key: 'efficiency', color: '#10b981' },
                ]}
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-gray-500 text-center px-6">
                Not enough review history yet to chart a trend. Trends appear once
                employees have performance reviews across more than one month.
              </div>
            )}
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
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500/15 text-primary-300 font-medium">
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