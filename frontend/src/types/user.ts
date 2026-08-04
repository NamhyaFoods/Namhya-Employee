export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'employee'
  department?: string
  designation?: string
  employee_id?: string
  phone_number?: string
  profile_picture_url?: string
  is_active: boolean
  date_joined: string
  last_login?: string
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<User | null>
  logout: () => Promise<void>
  hasRole: (roles: string[]) => boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isEmployee: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'manager' | 'employee'
  department?: string
  designation?: string
}