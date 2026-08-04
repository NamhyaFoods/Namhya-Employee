import { api } from './client'
import { User, LoginCredentials } from '../types/user'

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  logout: async () => {
    await api.post('/auth/logout')
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh')
    return response.data
  },
}