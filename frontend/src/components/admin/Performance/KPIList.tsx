import React from 'react'
import { FaPen, FaTrash } from 'react-icons/fa'
import { KPI } from '../../../types/performance'
import { formatScore, getScoreColor } from '../../../utils/formatters'

interface KPIListProps {
  kpis: KPI[]
  emptyMessage?: string
  // Optional - only pass these where editing/deleting makes sense (admin
  // views). Left undefined, no controls render, so this stays out of the
  // employee's own read-only KPI list without needing a role check here.
  onEdit?: (kpi: KPI) => void
  onDelete?: (kpi: KPI) => void
}

// Shared KPI list, used on both the admin ReviewDetail page and the
// employee MyPerformance page so the two stay visually consistent. Edit/
// delete controls only show up where a handler is actually passed in.
const KPIList: React.FC<KPIListProps> = ({ kpis, emptyMessage = 'No KPIs recorded yet.', onEdit, onDelete }) => {
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
          <div className="flex items-center gap-4">
            <div className={`kpi-number text-xl font-semibold ${getScoreColor(kpi.score)}`}>
              {formatScore(kpi.score)}
            </div>
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(kpi)}
                    title="Edit KPI"
                    className="text-gray-400 hover:text-primary-600 p-1"
                  >
                    <FaPen size={13} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(kpi)}
                    title="Delete KPI"
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <FaTrash size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default KPIList
