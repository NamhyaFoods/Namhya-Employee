import React from 'react'
import { KPI } from '../../../types/performance'
import { formatScore, getScoreColor } from '../../../utils/formatters'

interface KPIListProps {
  kpis: KPI[]
  emptyMessage?: string
}

// Shared read-only KPI list, used on both the admin ReviewDetail page and
// the employee MyPerformance page so the two stay visually consistent.
const KPIList: React.FC<KPIListProps> = ({ kpis, emptyMessage = 'No KPIs recorded yet.' }) => {
  if (kpis.length === 0) {
    return <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
  }

  return (
    <div className="space-y-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div>
            <div className="font-medium text-gray-900">{kpi.kpi_name}</div>
            <div className="text-sm text-gray-500">
              {kpi.kpi_category && (
                <span className="capitalize">{kpi.kpi_category} · </span>
              )}
              {kpi.target_value != null && kpi.achieved_value != null ? (
                <>
                  {kpi.achieved_value} / {kpi.target_value}
                  {kpi.measurement_unit ? ` ${kpi.measurement_unit}` : ''}
                </>
              ) : (
                'No target set'
              )}
              {kpi.weight_percent ? ` · ${kpi.weight_percent}% weight` : ''}
            </div>
            {kpi.notes && <div className="text-xs text-gray-400 mt-1">{kpi.notes}</div>}
          </div>
          <div className={`kpi-number text-xl font-semibold ${getScoreColor(kpi.score)}`}>
            {formatScore(kpi.score)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default KPIList
