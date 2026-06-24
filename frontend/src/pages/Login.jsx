import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ username: '', password: '' })
  const [forgot, setForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [error, setError]   = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      console.error('Login error', err)
      setError(err.response?.data?.error || err.message || JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email: resetEmail })
      setMessage(res.data.message)
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
    }}>
      <div className="card" style={{ maxWidth: 380, width: 'calc(100% - 32px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>DropoutGuard</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            Student Dropout Risk Determination System
          </p>
        </div>

        {forgot ? (
          <form onSubmit={handleForgot}>
            <div style={{ marginBottom: 16 }}>
              <label>Email Address</label>
              <input
                type="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="Enter the email used during account creation"
                required
              />
            </div>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
              Enter the email address associated with your account. If it exists, a password reset link will be sent to your email.
            </p>
            {message && <div style={{ background:'#dcfce7', color:'#166534', padding:10, borderRadius:8, fontSize:14, marginBottom:16 }}>{message}</div>}
            {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:10, borderRadius:8, fontSize:14, marginBottom:16 }}>{error}</div>}
            <button className="btn btn-primary" style={{ width:'100%', padding:12 }} disabled={loading}>
              {loading ? 'Sending...' : 'Request Reset Link'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ width:'100%', padding:12, marginTop:10 }} onClick={() => { setForgot(false); setMessage(''); setResetEmail('') }}>
              Back to Login
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Enter your username"
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fee2e2', color: '#991b1b',
              padding: '10px 12px', borderRadius: 8,
              fontSize: 14, marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <button type="button" onClick={() => setForgot(true)} style={{
            border:0, background:'transparent', color:'#2563eb', width:'100%', marginTop:14, cursor:'pointer', fontWeight:600
          }}>
            Forgot password?
          </button>
        </form>
        )}
      </div>
    </div>
  )
}
