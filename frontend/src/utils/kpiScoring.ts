// KPI category definitions and scoring logic for the RTO / COD-Recovery /
// Task-Handling variable-pay scheme (confirmed by Ridhima Arora, Sep 2026):
//
//   Overall score  = RTO (60%) + COD & Recovery (20%) + Task Handling (20%)
//   RTO variable   = < 3% RTO  -> 20% variable pay
//                   = 3-5% RTO -> 5% variable pay
//                   = > 5% RTO -> UNCONFIRMED. Needs sign-off from manager
//                     before this is treated as final. Defaults to 0 with
//                     the TODO below rather than guessing a deduction.
//   Increment eligibility = overall score >= 3.5, sustained for 6 straight
//     months. Not automated yet - needs multi-month review history, which
//     the current single-review KPI view doesn't have. TODO if this is
//     needed: query the last 6 performance_reviews for a user and check
//     each month's weighted KPI score against the 3.5 threshold.

export interface KPICategoryDef {
  value: string
  label: string
  /** Fixed weight for the confirmed scheme; null means admin sets it manually. */
  fixedWeight: number | null
  /** RTO is scored specially (lower is better, tiered) rather than achieved/target. */
  isRTO?: boolean
}

export const KPI_CATEGORIES: KPICategoryDef[] = [
  { value: 'rto', label: 'RTO %', fixedWeight: 60, isRTO: true },
  { value: 'cod_recovery', label: 'COD & Recovery', fixedWeight: 20 },
  { value: 'task_handling', label: 'Task Handling', fixedWeight: 20 },
  { value: 'productivity', label: 'Productivity', fixedWeight: null },
  { value: 'quality', label: 'Quality', fixedWeight: null },
  { value: 'attendance', label: 'Attendance', fixedWeight: null },
  { value: 'collaboration', label: 'Collaboration', fixedWeight: null },
  { value: 'other', label: 'Other', fixedWeight: null },
]

export const getCategoryDef = (category?: string): KPICategoryDef | undefined =>
  KPI_CATEGORIES.find((c) => c.value === category)

// Generic higher-is-better scoring: achieved / target, capped at 100.
export const computeGenericScore = (target?: string | number, achieved?: string | number): number => {
  const t = typeof target === 'number' ? target : parseFloat(target || '')
  const a = typeof achieved === 'number' ? achieved : parseFloat(achieved || '')
  if (!t || isNaN(t) || isNaN(a)) return 0
  return Math.min(100, Math.round((a / t) * 100 * 10) / 10)
}

export interface RTOTierResult {
  score: number
  variablePercent: number
  tierLabel: string
  isPenaltyTBD: boolean
}

// RTO is lower-is-better and tiered, not a ratio - a 2% RTO isn't "twice as
// good" as 4%, it just clears a different threshold entirely.
export const computeRTOTier = (actualRTOPercent?: string | number): RTOTierResult => {
  const rto = typeof actualRTOPercent === 'number' ? actualRTOPercent : parseFloat(actualRTOPercent || '')
  if (isNaN(rto)) {
    return { score: 0, variablePercent: 0, tierLabel: 'No RTO % entered', isPenaltyTBD: false }
  }
  if (rto < 3) {
    return { score: 100, variablePercent: 20, tierLabel: '< 3% RTO', isPenaltyTBD: false }
  }
  if (rto < 5) {
    return { score: 60, variablePercent: 5, tierLabel: '3–5% RTO', isPenaltyTBD: false }
  }
  // TODO: confirm the actual penalty/deduction rule for RTO > 5% with
  // manager. Until then this is 0, not a guessed negative number.
  return { score: 0, variablePercent: 0, tierLabel: '> 5% RTO (penalty rule unconfirmed)', isPenaltyTBD: true }
}

export interface WeightedSummary {
  overall: number | null
  hasAllThree: boolean
  rto?: { score: number; weight: number }
  codRecovery?: { score: number; weight: number }
  taskHandling?: { score: number; weight: number }
}

// Combines RTO/COD-Recovery/Task-Handling KPIs from a single review into
// the confirmed 60/20/20 weighted overall score. Returns null overall if
// not all three are present yet, rather than silently averaging whatever
// subset exists (which would misrepresent the score).
export const computeWeightedSummary = (kpis: { kpi_category?: string; score: number; weight_percent: number }[]): WeightedSummary => {
  const rto = kpis.find((k) => k.kpi_category === 'rto')
  const cod = kpis.find((k) => k.kpi_category === 'cod_recovery')
  const task = kpis.find((k) => k.kpi_category === 'task_handling')

  const hasAllThree = !!rto && !!cod && !!task
  const overall = hasAllThree
    ? Math.round((rto!.score * 0.6 + cod!.score * 0.2 + task!.score * 0.2) * 10) / 10
    : null

  return {
    overall,
    hasAllThree,
    rto: rto ? { score: rto.score, weight: rto.weight_percent } : undefined,
    codRecovery: cod ? { score: cod.score, weight: cod.weight_percent } : undefined,
    taskHandling: task ? { score: task.score, weight: task.weight_percent } : undefined,
  }
}
