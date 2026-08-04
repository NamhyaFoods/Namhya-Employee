import { api } from './client'
import { Task, TaskCreate, TaskUpdate, TaskStats } from '../types/task'

export const tasksApi = {
  getAll: async (filters?: {
    status?: string
    assigned_to?: string
    priority?: string
  }): Promise<Task[]> => {
    const response = await api.get('/tasks', { params: filters })
    return response.data
  },

  getMyTasks: async (status?: string): Promise<Task[]> => {
    const params = status ? { status_filter: status } : {}
    const response = await api.get('/tasks/my-tasks', { params })
    return response.data
  },

  getById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  },

  create: async (data: TaskCreate): Promise<Task> => {
    const response = await api.post('/tasks', data)
    return response.data
  },

  update: async (id: string, data: TaskUpdate): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, data)
    return response.data
  },

  updateStatus: async (id: string, status: string, progress?: number): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}/status`, {
      status,
      progress_percentage: progress,
    })
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`)
  },

  getMyStats: async (): Promise<TaskStats> => {
    const response = await api.get('/tasks/my-tasks/stats')
    return response.data
  },
}