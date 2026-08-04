import { api } from './client'

export interface TimeLog {
  id: string
  task_id: string
  user_id: string
  hours_spent: number
  log_date: string
  description?: string
  is_billable: boolean
  log_type: 'manual' | 'timer' | 'bulk'
  created_at: string
  updated_at: string
}

export interface TimeLogCreate {
  task_id: string
  hours_spent: number
  log_date?: string
  description?: string
  is_billable?: boolean
  log_type?: 'manual' | 'timer' | 'bulk'
}

export const timeLogsApi = {
  create: async (data: TimeLogCreate): Promise<TimeLog> => {
    const response = await api.post('/time-logs', data)
    return response.data
  },

  getByTask: async (taskId: string): Promise<TimeLog[]> => {
    const response = await api.get(`/time-logs/task/${taskId}`)
    return response.data
  },

  getMyLogs: async (startDate?: string, endDate?: string): Promise<TimeLog[]> => {
    const params: Record<string, string> = {}
    if (startDate) params['start_date'] = startDate
    if (endDate) params['end_date'] = endDate
    const response = await api.get('/time-logs/my-logs', { params })
    return response.data
  },

  getByUser: async (userId: string, startDate?: string, endDate?: string): Promise<TimeLog[]> => {
    const params: Record<string, string> = {}
    if (startDate) params['start_date'] = startDate
    if (endDate) params['end_date'] = endDate
    const response = await api.get(`/time-logs/user/${userId}`, { params })
    return response.data
  },

  update: async (id: string, data: Partial<TimeLog>): Promise<TimeLog> => {
    const response = await api.put(`/time-logs/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/time-logs/${id}`)
  },

  getSummary: async (period: string = 'month'): Promise<any> => {
    const response = await api.get('/time-logs/my-logs/summary', {
      params: { period },
    })
    return response.data
  },
}