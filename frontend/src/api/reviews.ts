import { api } from './client'
import { Review, KPI } from '../types/performance'

export const reviewsApi = {
  generate: async (userId: string, reviewMonth?: string): Promise<Review> => {
    const params = reviewMonth ? { review_month: reviewMonth } : {}
    const response = await api.post(`/reviews/generate/${userId}`, null, { params })
    return response.data
  },

  generateAll: async (reviewMonth?: string): Promise<any> => {
    const params = reviewMonth ? { review_month: reviewMonth } : {}
    const response = await api.post('/reviews/generate-all', null, { params })
    return response.data
  },

  getMyReviews: async (limit: number = 6): Promise<Review[]> => {
    const response = await api.get('/reviews/my-reviews', {
      params: { limit },
    })
    return response.data
  },

  getUserReviews: async (userId: string, limit: number = 12): Promise<Review[]> => {
    const response = await api.get(`/reviews/user/${userId}`, {
      params: { limit },
    })
    return response.data
  },

  getById: async (id: string): Promise<Review> => {
    const response = await api.get(`/reviews/${id}`)
    return response.data
  },

  update: async (id: string, data: Partial<Review>): Promise<Review> => {
    const response = await api.put(`/reviews/${id}`, data)
    return response.data
  },

  getPending: async (): Promise<any[]> => {
    const response = await api.get('/reviews/pending')
    return response.data
  },

  getKPI: async (userId: string, reviewId?: string): Promise<KPI[]> => {
    const params = reviewId ? { review_id: reviewId } : {}
    const response = await api.get(`/reviews/kpi/${userId}`, { params })
    return response.data
  },

  createKPI: async (data: Partial<KPI>): Promise<KPI> => {
    const response = await api.post('/reviews/kpi', data)
    return response.data
  },
}