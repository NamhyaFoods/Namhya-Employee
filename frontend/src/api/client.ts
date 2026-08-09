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

api.interceptors.request.use(async (config) => {
  // Always pull the current session from the Supabase client rather than a
  // manually-cached copy in localStorage. Supabase auto-refreshes the
  // access token in the background as it nears expiry, but that refreshed
  // token was never being written back to localStorage('session'), so
  // requests kept using the original token until it expired and every
  // authenticated call started failing with 401 "Not authenticated".
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
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