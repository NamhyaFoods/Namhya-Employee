import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import Spinner from '../../components/common/Loading/Spinner'
import { reviewsApi } from '../../api/reviews'
import { Review, KPI } from '../../types/performance'
import { formatDate, formatScore, getScoreCategory, getScoreColor } from '../../utils/formatters'
import { FaArrowLeft, FaPlus } from 'react-icons/fa'
import KPIForm from '../../components/admin/Performance/KPIForm'
import KPIList from '../../components/admin/Performance/KPIList'
import WeightedScoreSummary from '../../components/admin/Performance/WeightedScoreSummary'

const ReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<KPI[]>([])
  const [kpisLoading, setKpisLoading] = useState(true)
  const [showKPIForm, setShowKPIForm] = useState(false)

  useEffect(() => {
    if (!id) return
    reviewsApi
      .getById(id)
      .then((r) => {
        setReview(r)
        // KPIs are fetched by user_id and scoped to this review via
        // review_id so the list only shows targets set for this specific
        // monthly review, not the employee's full KPI history.
        setKpisLoading(true)
        return reviewsApi.getKPI(r.user_id, r.id)
      })
      .then(setKpis)
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        setKpisLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </AdminLayout>
    )
  }

  if (!review) {
    return (
      <AdminLayout>
        <div className="p-6 text-gray-500">Review not found.</div>
      </AdminLayout>
    )
  }

  const metrics = [
    { label: 'Efficiency', value: review.average_efficiency, weight: review.efficiency_weight_percent },
    { label: 'Completion Rate', value: review.completion_rate, weight: review.completion_weight_percent },
    { label: 'Timeliness', value: review.average_timeliness_score, weight: review.timeliness_weight_percent },
    { label: 'Quality', value: review.average_quality_score, weight: review.quality_weight_percent },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <button
          onClick={() => navigate('/admin/reviews')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
        >
          <FaArrowLeft /> Back to Reviews
        </button>

        <div className="card flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-gray-900">
              {review.full_name || 'Employee'}
            </h1>
            <p className="text-sm text-gray-500">{review.review_month}</p>
          </div>
          <div className="text-right">
            <p className={`kpi-number text-3xl font-semibold ${getScoreColor(review.final_work_score)}`}>
              {formatScore(review.final_work_score)}
            </p>
            <p className="text-sm text-gray-500">{getScoreCategory(review.final_work_score)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="card">
              <p className="text-sm text-gray-500">{m.label}</p>
              <p className="kpi-number text-2xl font-semibold text-gray-900 mt-1">
                {formatScore(m.value)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{m.weight}% weight</p>
            </div>
          ))}
        </div>

        <div className="card grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="label mb-0">Tasks Assigned</p>
            <p className="kpi-number text-gray-900">{review.total_tasks_assigned}</p>
          </div>
          <div>
            <p className="label mb-0">Tasks Completed</p>
            <p className="kpi-number text-gray-900">{review.total_tasks_completed}</p>
          </div>
          <div>
            <p className="label mb-0">Reviewed At</p>
            <p className="text-gray-900">{formatDate(review.reviewed_at)}</p>
          </div>
          <div>
            <p className="label mb-0">Created</p>
            <p className="text-gray-900">{formatDate(review.created_at)}</p>
          </div>
        </div>

        {review.reviewer_comments && (
          <div className="card">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-2">Reviewer Comments</h2>
            <p className="text-gray-700 text-sm">{review.reviewer_comments}</p>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-gray-900">KRA / Targets</h2>
            <button
              onClick={() => setShowKPIForm(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FaPlus /> Add KPI
            </button>
          </div>
          {kpisLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <WeightedScoreSummary kpis={kpis} />
              <KPIList kpis={kpis} emptyMessage="No KPIs set for this review yet." />
            </>
          )}
        </div>
      </div>

      {showKPIForm && (
        <KPIForm
          userId={review.user_id}
          reviewId={review.id}
          onClose={() => setShowKPIForm(false)}
          onCreated={(kpi) => setKpis((prev) => [kpi, ...prev])}
        />
      )}
    </AdminLayout>
  )
}

export default ReviewDetail
