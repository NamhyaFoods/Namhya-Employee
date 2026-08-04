import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const formatDate = (date: string | null | undefined): string => {
  if (!date) return 'N/A'
  try {
    return format(parseISO(date), 'MMM dd, yyyy')
  } catch {
    return 'Invalid Date'
  }
}

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return 'N/A'
  try {
    return format(parseISO(date), 'MMM dd, yyyy HH:mm')
  } catch {
    return 'Invalid Date'
  }
}

export const formatTimeAgo = (date: string | null | undefined): string => {
  if (!date) return 'N/A'
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true })
  } catch {
    return 'Invalid Date'
  }
}

export const formatHours = (hours: number): string => {
  return hours.toFixed(1) + 'h'
}

export const formatPercentage = (value: number): string => {
  return value.toFixed(1) + '%'
}

export const formatScore = (score: number): string => {
  return score.toFixed(1) + '/5.0'
}

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    todo: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    review: 'bg-yellow-500',
    completed: 'bg-green-500',
    on_hold: 'bg-orange-500',
    cancelled: 'bg-red-500',
  }
  return colors[status] || 'bg-gray-500'
}

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  }
  return colors[priority] || 'text-gray-500'
}

export const getScoreCategory = (score: number): string => {
  if (score >= 4.5) return 'Excellent'
  if (score >= 3.5) return 'Good'
  if (score >= 2.5) return 'Average'
  if (score >= 1.5) return 'Below Average'
  return 'Needs Improvement'
}

export const getScoreColor = (score: number): string => {
  if (score >= 4.5) return 'text-green-600'
  if (score >= 3.5) return 'text-blue-600'
  if (score >= 2.5) return 'text-yellow-600'
  if (score >= 1.5) return 'text-orange-600'
  return 'text-red-600'
}

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}