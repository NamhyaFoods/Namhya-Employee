export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description?: string
  assigned_to: string
  assigned_by: string
  allocated_hours: number
  actual_hours: number
  priority: TaskPriority
  status: TaskStatus
  progress_percentage: number
  start_date?: string
  due_date?: string
  completed_at?: string
  is_overdue: boolean
  task_category?: string
  tags?: string[]
  created_at: string
  updated_at: string
  // Joined fields
  assigned_to_name?: string
  assigned_by_name?: string
  efficiency_percentage?: number
}

export interface TaskCreate {
  title: string
  description?: string
  assigned_to: string
  allocated_hours: number
  priority: TaskPriority
  start_date?: string
  due_date?: string
  task_category?: string
  tags?: string[]
}

export interface TaskUpdate {
  title?: string
  description?: string
  status?: TaskStatus
  progress_percentage?: number
  priority?: TaskPriority
  allocated_hours?: number
  start_date?: string
  due_date?: string
  task_category?: string
  tags?: string[]
}

export interface TaskStats {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  overdue_tasks: number
  completion_rate: number
  avg_efficiency: number
  on_time_rate: number
}