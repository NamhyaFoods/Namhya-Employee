import React, { useState, useEffect } from 'react'
// Remove useNavigate - not used
// import { useNavigate } from 'react-router-dom'
import EmployeeLayout from '../../components/common/Layout/EmployeeLayout'
import StatCard from '../../components/common/Cards/StatCard'
import LineChart from '../../components/shared/Charts/LineChart'
import Spinner from '../../components/common/Loading/Spinner'
import { performanceApi } from '../../api/performance'
import { reviewsApi } from '../../api/reviews'
import { formatScore, getScoreCategory, getScoreColor } from '../../utils/formatters'
import { FaChartBar, FaCalendar, FaStar, FaTrophy } from 'react-icons/fa'
import toast from 'react-hot-toast'

const MyPerformance: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [performance, setPerformance] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [trendData, setTrendData] = useState<any[]>([])

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      const [perfData, reviewsData] = await Promise.all([
        performanceApi.getMyPerformance(),
        reviewsApi.getMyReviews(12),
      ])

      setPerformance(perfData)
      setReviews(reviewsData)

      // Prepare trend data
      const trend = reviewsData.map((r) => ({
        month: new Date(r.review_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        score: r.final_work_score,
        efficiency: r.average_efficiency,
        completion: r.completion_rate,
      }))
      setTrendData(trend.reverse())
    } catch (error) {
      toast.error('Failed to load performance data')
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
          <p className="text-gray-500">Track your performance and growth</p>
        </div>

        {/* Current Score */}
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm opacity-75">Current Performance Score</p>
              <p className="text-5xl font-bold mt-2">
                {performance?.work_score ? formatScore(performance.work_score) : 'N/A'}
              </p>
              <p className="text-lg mt-1">
                {performance?.performance_category || 'Not Rated'}
              </p>
            </div>
            <div className="flex space-x-8 mt-4 md:mt-0">
              <div className="text-center">
                <p className="text-sm opacity-75">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {performance?.completion_rate?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-75">Avg Efficiency</p>
                <p className="text-2xl font-bold">
                  {performance?.avg_efficiency?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-75">Tasks Completed</p>
                <p className="text-2xl font-bold">
                  {performance?.completed_tasks || 0}/{performance?.total_tasks || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Tasks"
            value={performance?.total_tasks || 0}
            icon={FaChartBar}
            color="bg-blue-500"
          />
          <StatCard
            title="Completed"
            value={performance?.completed_tasks || 0}
            icon={FaCalendar}
            color="bg-green-500"
          />
          <StatCard
            title="Efficiency"
            value={`${performance?.avg_efficiency?.toFixed(1) || 0}%`}
            icon={FaStar}
            color="bg-yellow-500"
          />
          <StatCard
            title="Best Score"
            value={reviews.length > 0 ? formatScore(Math.max(...reviews.map(r => r.final_work_score))) : 'N/A'}
            icon={FaTrophy}
            color="bg-purple-500"
          />
        </div>

        {/* Performance Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
          {trendData.length > 0 ? (
            <LineChart
              data={trendData}
              xKey="month"
              lines={[
                { key: 'score', color: '#3b82f6' },
                { key: 'efficiency', color: '#10b981' },
                { key: 'completion', color: '#f59e0b' },
              ]}
              height={300}
            />
          ) : (
            <p className="text-gray-500 text-center py-8">
              No performance data available yet
            </p>
          )}
        </div>

        {/* Review History */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Review History</h3>
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No reviews available yet
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 6).map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {new Date(review.review_month).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {review.total_tasks_completed} tasks completed ·{' '}
                      {review.completion_rate.toFixed(1)}% completion
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-xl ${getScoreColor(review.final_work_score)}`}>
                      {formatScore(review.final_work_score)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getScoreCategory(review.final_work_score)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  )
}

export default MyPerformance