import React, { useState } from 'react'
import Input from '../../shared/Forms/Input'
import Select from '../../shared/Forms/Select'
import TextArea from '../../shared/Forms/TextArea'
import { reviewsApi } from '../../../api/reviews'
import { KPI } from '../../../types/performance'
import { KPI_CATEGORIES, getCategoryDef, computeGenericScore, computeRTOTier } from '../../../utils/kpiScoring'
import toast from 'react-hot-toast'
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa'

interface KPIFormProps {
  userId: string
  reviewId?: string
  onClose: () => void
  onCreated: (kpi: KPI) => void
}

const KPIForm: React.FC<KPIFormProps> = ({ userId, reviewId, onClose, onCreated }) => {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    kpi_name: '',
    kpi_category: '',
    target_value: '',
    achieved_value: '',
    rto_percent: '',
    weight_percent: '25',
    measurement_unit: '',
    notes: '',
  })

  const categoryDef = getCategoryDef(form.kpi_category)
  const isRTO = !!categoryDef?.isRTO

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [field]: e.target.value })
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const def = getCategoryDef(value)
    setForm({
      ...form,
      kpi_category: value,
      // Fixed-weight categories (RTO/COD-Recovery/Task-Handling) auto-fill
      // their confirmed weight; admin can still override it if needed.
      weight_percent: def?.fixedWeight != null ? String(def.fixedWeight) : form.weight_percent,
    })
  }

  const rtoTier = isRTO ? computeRTOTier(form.rto_percent) : null
  const score = isRTO ? (rtoTier?.score ?? 0) : computeGenericScore(form.target_value, form.achieved_value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.kpi_name.trim()) {
      toast.error('KPI name is required')
      return
    }
    if (isRTO && !form.rto_percent) {
      toast.error('Enter the actual RTO %')
      return
    }

    setSubmitting(true)
    try {
      const autoNote = isRTO && rtoTier
        ? `Tier: ${rtoTier.tierLabel} → ${rtoTier.variablePercent}% variable${rtoTier.isPenaltyTBD ? ' (TODO: confirm penalty with manager)' : ''}`
        : undefined
      const combinedNotes = [autoNote, form.notes || undefined].filter(Boolean).join(' — ')

      const payload: Record<string, any> = {
        user_id: userId,
        review_id: reviewId || undefined,
        kpi_name: form.kpi_name.trim(),
        kpi_category: form.kpi_category || undefined,
        target_value: isRTO ? undefined : (form.target_value ? parseFloat(form.target_value) : undefined),
        achieved_value: isRTO
          ? parseFloat(form.rto_percent)
          : (form.achieved_value ? parseFloat(form.achieved_value) : undefined),
        score,
        weight_percent: parseInt(form.weight_percent, 10) || 0,
        measurement_unit: isRTO ? '%' : (form.measurement_unit || undefined),
        notes: combinedNotes || undefined,
      }
      const created = await reviewsApi.createKPI(payload)
      toast.success('KPI added')
      onCreated(created)
      onClose()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to add KPI')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-gray-900">Add KPI / Target</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="kpi_name"
            label="KPI Name"
            placeholder="e.g. RTO % — September"
            value={form.kpi_name}
            onChange={handleChange('kpi_name')}
            required
          />

          <Select
            id="kpi_category"
            label="Category"
            options={KPI_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            value={form.kpi_category}
            onChange={handleCategoryChange}
          />

          {isRTO ? (
            <>
              <Input
                id="rto_percent"
                label="Actual RTO %"
                type="number"
                step="any"
                placeholder="e.g. 2.8"
                value={form.rto_percent}
                onChange={handleChange('rto_percent')}
                required
              />
              {rtoTier && form.rto_percent && (
                <div
                  className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
                    rtoTier.isPenaltyTBD ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  {rtoTier.isPenaltyTBD && <FaExclamationTriangle className="mt-0.5 shrink-0" />}
                  <span>
                    {rtoTier.tierLabel} → <strong>{rtoTier.variablePercent}% variable pay</strong>
                    {rtoTier.isPenaltyTBD && ' — penalty rule not yet confirmed, currently scored as 0'}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="target_value"
                label="Target Value"
                type="number"
                step="any"
                placeholder="e.g. 50"
                value={form.target_value}
                onChange={handleChange('target_value')}
              />
              <Input
                id="achieved_value"
                label="Achieved Value"
                type="number"
                step="any"
                placeholder="e.g. 45"
                value={form.achieved_value}
                onChange={handleChange('achieved_value')}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="measurement_unit"
              label="Unit"
              placeholder="e.g. tickets, %, hrs"
              value={isRTO ? '%' : form.measurement_unit}
              onChange={handleChange('measurement_unit')}
              disabled={isRTO}
            />
            <Input
              id="weight_percent"
              label="Weight %"
              type="number"
              min={0}
              max={100}
              value={form.weight_percent}
              onChange={handleChange('weight_percent')}
              disabled={categoryDef?.fixedWeight != null}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {isRTO ? 'Computed score (tier-based)' : 'Computed score (achieved / target)'}
            </span>
            <span className="kpi-number text-lg font-semibold text-gray-900">{score}</span>
          </div>

          <TextArea
            id="notes"
            label="Notes"
            placeholder="Optional context"
            value={form.notes}
            onChange={handleChange('notes')}
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : 'Add KPI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default KPIForm
