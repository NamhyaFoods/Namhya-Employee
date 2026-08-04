import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../api/client'
import { User, AuthContextType } from '../types/user'
import toast from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('session')
    if (session) {
      try {
        const parsed = JSON.parse(session)
        setUser(parsed.user)
        setToken(parsed.token)
      } catch (error) {
        localStorage.removeItem('session')
      }
    }
    setLoading(false)

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const user = await getUserProfile(session.user.id)
          if (user) {
            setUser(user)
            setToken(session.access_token)
            localStorage.setItem('session', JSON.stringify({ user, token: session.access_token }))
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setToken(null)
          localStorage.removeItem('session')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      if (error) throw error
      return data as User
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const userProfile = await getUserProfile(data.user.id)
        if (userProfile) {
          setUser(userProfile)
          setToken(data.session?.access_token || null)
          localStorage.setItem(
            'session',
            JSON.stringify({ user: userProfile, token: data.session?.access_token })
          )
          toast.success('Welcome back! 🎉')
          return userProfile
        }
      }
      return null
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      throw error
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setToken(null)
      localStorage.removeItem('session')
      toast.success('Logged out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Logout failed')
    }
  }

  const hasRole = (roles: string[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'manager',
    isEmployee: user?.role === 'employee',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}