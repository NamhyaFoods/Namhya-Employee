import React from 'react'
import { KPI } from '../../../types/performance'
import { computeWeightedSummary } from '../../../utils/kpiScoring'
import { FaExclamationTriangle } from 'react-icons/fa'

interface WeightedScoreSummaryProps {
  kpis: KPI[]
}

// Shows the confirmed 60/20/20 (RTO / COD-Recovery / Task-Handling) overall
// score once all three KPIs exist for a review. Only renders once at least
// one of the three is present, so it stays invisible for reviews that
// aren't using this scheme at all.
const WeightedScoreSummary: React.FC<WeightedScoreSummaryProps> = ({ kpis }) => {
  const summary = computeWeightedSummary(kpis)

  if (!summary.rto && !summary.codRecovery && !summary.taskHandling) {
    return null
  }

  return (
    <div className="bg-primary-50 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">RTO / COD / Task-Handling Score</span>
        {summary.hasAllThree ? (
          <span className="kpi-number text-xl font-bold text-primary-700">{summary.overall}</span>
        ) : (
          <span className="text-xs text-gray-500">Waiting on all 3 KPIs</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
        <div>RTO (60%): {summary.rto ? summary.rto.score : '—'}</div>
        <div>COD & Reco (20%): {summary.codRecovery ? summary.codRecovery.score : '—'}</div>
        <div>Task Handling (20%): {summary.taskHandling ? summary.taskHandling.score : '—'}</div>
      </div>
      <div className="flex items-start gap-2 mt-3 text-xs text-amber-700">
        <FaExclamationTriangle className="mt-0.5 shrink-0" />
        <span>
          Increment eligibility (score ≥ 3.5 for 6 consecutive months) isn't tracked automatically yet —
          it needs review history across months, which isn't wired up here.
        </span>
      </div>
    </div>
  )
}

export default WeightedScoreSummary
