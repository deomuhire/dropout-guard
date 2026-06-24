import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/axios'

function useQueryParam(key) {
  const location = useLocation()
  return useMemo(() => {
    const sp = new URLSearchParams(location.search)
    return sp.get(key)
  }, [key, location.search])
}

export default function ResetPassword() {
  const token = useQueryParam('token')
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const isPasswordStrong = (password) => {
    if (!password) return false
    return password.length >= 8
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /[0-9]/.test(password)
      && /[^A-Za-z0-9]/.test(password)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('Missing reset token in the URL.')
      return
    }
    if (!isPasswordStrong(newPassword)) {
      setError('Password does not meet the strength requirements.')
      return
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: newPassword })
      setMessage('Password reset successful. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
      }}
    >
      <div className="card" style={{ maxWidth: 420, width: 'calc(100% - 32px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Reset Password</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>
            Set a new password for your account.
          </p>
        </div>

        <form onSubmit={submit}>
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Enter a strong new password"
            style={{ marginBottom: 14 }}
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Confirm your new password"
            style={{ marginBottom: 14 }}
          />

          {message && (
            <div style={{ background: '#dcfce7', color: '#166534', padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', padding: 12, marginTop: 10 }}
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  )
}

