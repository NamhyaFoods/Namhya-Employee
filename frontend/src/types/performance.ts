export interface PerformanceData {
  user_id: string
  full_name: string
  total_tasks: number
  completed_tasks: number
  completion_rate: number
  avg_efficiency: number
  avg_timeliness_score: number
  work_score: number
  performance_category: string
  review_month?: string
}

export interface Review {
  id: string
  user_id: string
  full_name?: string
  review_month: string
  total_tasks_assigned: number
  total_tasks_completed: number
  completion_rate: number
  average_efficiency: number
  average_timeliness_score: number
  average_quality_score: number
  final_work_score: number
  efficiency_weight_percent: number
  completion_weight_percent: number
  timeliness_weight_percent: number
  quality_weight_percent: number
  reviewer_comments?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export interface KPI {
  id: string
  user_id: string
  review_id?: string
  kpi_name: string
  kpi_category?: string
  target_value?: number
  achieved_value?: number
  score: number
  weight_percent: number
  measurement_unit?: string
  notes?: string
}

export interface ScoreCalculation {
  efficiency: number
  completion_rate: number
  timeliness_score: number
  quality_score: number
  efficiency_weight?: number
  completion_weight?: number
  timeliness_weight?: number
  quality_weight?: number
}

export interface ScoreResult {
  score: number
  score_category: string
  breakdown: {
    efficiency: { value: number; weight: number; contribution: number }
    completion_rate: { value: number; weight: number; contribution: number }
    timeliness: { value: number; weight: number; contribution: number }
    quality: { value: number; weight: number; contribution: number }
  }
  weights_used: {
    efficiency: number
    completion_rate: number
    timeliness: number
    quality: number
  }
}