import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const session = localStorage.getItem('session')
  if (session) {
    try {
      const { token } = JSON.parse(session)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error parsing session:', error)
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('session')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)