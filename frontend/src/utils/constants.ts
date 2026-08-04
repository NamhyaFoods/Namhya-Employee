export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'review', label: 'In Review', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-orange-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
]

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
]

export const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
]

export const SCORE_THRESHOLDS = {
  excellent: 4.5,
  good: 3.5,
  average: 2.5,
  below_average: 1.5,
}

export const SCORE_CATEGORIES = [
  { min: 4.5, label: 'Excellent', color: 'text-green-600' },
  { min: 3.5, label: 'Good', color: 'text-blue-600' },
  { min: 2.5, label: 'Average', color: 'text-yellow-600' },
  { min: 1.5, label: 'Below Average', color: 'text-orange-600' },
  { min: 0, label: 'Needs Improvement', color: 'text-red-600' },
]