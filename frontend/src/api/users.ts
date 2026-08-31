import { api } from './client'
import { User } from '../types/user'

export interface CreateEmployeePayload {
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'employee'
  department?: string
  designation?: string
  employee_id?: string
  phone_number?: string
  password: string
  confirm_password: string
}

export const usersApi = {
  getAll: async (role?: string): Promise<User[]> => {
    const params = role ? { role } : {}
    // Trailing slash matters here: the backend route is defined as
    // `/users/` (via `@router.get("/")` under the `/users` prefix). Calling
    // `/users` without it triggers FastAPI's automatic redirect to add the
    // slash, and that redirect round-trip was dropping the Authorization
    // header, causing every employee-list request to fail with 401
    // regardless of whether the token itself was valid.
    const response = await api.get('/users/', { params })
    return response.data
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Creating a user is handled by the backend's admin-only
  // /auth/register endpoint (not /users), since it also has to create
  // the Supabase Auth account alongside the profile row.
  create: async (data: CreateEmployeePayload): Promise<User> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  activate: async (id: string): Promise<void> => {
    await api.post(`/users/${id}/activate`)
  },

  getStats: async (id: string): Promise<any> => {
    const response = await api.get(`/users/${id}/stats`)
    return response.data
  },

  bulkImport: async (file: File): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/users/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
