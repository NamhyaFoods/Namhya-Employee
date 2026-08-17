import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkingLink, setCheckingLink] = useState(true)
  const [validLink, setValidLink] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    // Supabase's password-reset email links back here with a recovery token
    // in the URL. The client picks that token up automatically and fires a
    // PASSWORD_RECOVERY event once it has established a temporary session -
    // that's what actually lets updatePassword() below succeed. Until that
    // event fires (or an existing session is found), treat the link as
    // unverified so the form doesn't render prematurely.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidLink(true)
        setCheckingLink(false)
      }
    })

    // If the tab already had a valid session (e.g. link opened in a tab
    // that was already signed in), the PASSWORD_RECOVERY event won't fire
    // but the session is still usable for updateUser().
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidLink(true)
      }
      setCheckingLink(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      navigate('/login')
    } catch (error) {
      // Error toast handled in AuthContext
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Set a new password
          </h2>
        </div>

        {checkingLink ? (
          <p className="text-center text-sm text-gray-600">Verifying reset link...</p>
        ) : !validLink ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
              This reset link is invalid or has expired. Please request a new one.
            </div>
            <button
              type="button"
              className="btn-primary w-full flex justify-center py-3"
              onClick={() => navigate('/forgot-password')}
            >
              Request a new link
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="label">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoFocus
                  minLength={8}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center py-3"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword