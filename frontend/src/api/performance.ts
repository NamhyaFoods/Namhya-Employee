import { api } from './client'
import { PerformanceData, ScoreCalculation, ScoreResult } from '../types/performance'

export const performanceApi = {
  getMyPerformance: async (): Promise<PerformanceData> => {
    const response = await api.get('/performance/my-performance')
    return response.data
  },

  getUserPerformance: async (userId: string): Promise<PerformanceData> => {
    const response = await api.get(`/performance/user/${userId}`)
    return response.data
  },

  getTaskEfficiency: async (taskId: string): Promise<any> => {
    const response = await api.get(`/performance/efficiency/task/${taskId}`)
    return response.data
  },

  getTrend: async (userId: string, months: number = 6): Promise<any[]> => {
    const response = await api.get(`/performance/trend/${userId}`, {
      params: { months },
    })
    return response.data
  },

  getAdminDashboard: async (): Promise<any> => {
    const response = await api.get('/performance/dashboard/admin')
    return response.data
  },

  calculateScore: async (data: ScoreCalculation): Promise<ScoreResult> => {
    const response = await api.post('/performance/calculate-score', data)
    return response.data
  },

  getLeaderboard: async (limit: number = 10): Promise<any[]> => {
    const response = await api.get('/performance/leaderboard', {
      params: { limit },
    })
    return response.data
  },
}