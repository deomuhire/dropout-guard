import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentForm from './pages/StudentForm'
import Reports from './pages/Reports'
import ReportDetail from './pages/ReportDetail'
import UserManagement from './pages/UserManagement'
import MyClass from './pages/MyClass'
import RiskFrequency from './pages/RiskFrequency'
import ResetPassword from './pages/ResetPassword'
import Layout from './components/Layout'
import PasswordCriteria from './components/PasswordCriteria'


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{padding:40}}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return (
    <>
      {children}
      {user.must_change_password && <ForcePasswordChange />}
    </>
  )
}

function ForcePasswordChange() {
  const { changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
    if (!form.current_password) {
      setError('Enter your current password.')
      return
    }
    if (!isPasswordStrong(form.new_password)) {
      setError('Password does not meet the strength requirements below.')
      return
    }
    if (form.new_password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      await changePassword(form.current_password, form.new_password)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not change password')
    } finally {
      setSaving(false)
    }
  }

  const passwordMeetsAll = isPasswordStrong(form.new_password)

  const handleClose = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,0.72)', zIndex:500,
      display:'flex', alignItems:'center', justifyContent:'center'
    }}>
      <form onSubmit={submit} className="card" style={{ maxWidth: 460, width: 'calc(100% - 32px)', position:'relative', margin: '0 auto' }}>
        <button
          type="button"
          onClick={handleClose}
          style={{
            position:'absolute', top:16, right:16,
            border:'none', background:'transparent', color:'#475569', cursor:'pointer', fontSize:14
          }}
        >
          Close
        </button>
        <h2 style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Change Password</h2>
        <p style={{ color:'#64748b', fontSize:14, marginBottom:20 }}>
          For security, change the temporary password before using the system.
        </p>
        <label>Current Password</label>
        <input type="password" value={form.current_password}
          onChange={e => setForm(p => ({ ...p, current_password:e.target.value }))} required />
        <div style={{ height:12 }} />
        <label>New Password</label>
        <input type="password" value={form.new_password}
          onChange={e => setForm(p => ({ ...p, new_password:e.target.value }))} required />
        {form.new_password && <PasswordCriteria password={form.new_password} />}
        <div style={{ height:12 }} />
        <label>Confirm New Password</label>
        <input type="password" value={form.confirm}
          onChange={e => setForm(p => ({ ...p, confirm:e.target.value }))} required />
        {error && <div style={{ color:'#991b1b', background:'#fee2e2', padding:10, borderRadius:8, marginTop:14 }}>{error}</div>}
        <button type="submit" className="btn btn-primary" style={{ width:'100%', marginTop:18 }} disabled={saving}>
          {saving ? 'Saving...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>

            <Route index element={<Dashboard />} />
            <Route path="students/:id/form" element={<StudentForm />} />
            <Route path="my-class" element={<MyClass />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/school/:schoolId" element={<ReportDetail />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="risk-frequency" element={<RiskFrequency />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
