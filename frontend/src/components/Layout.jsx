import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'

const roleLabel = {
  superadmin:    'Super Admin',
  sector_leader: 'Sector Leader',
  headmaster:    'Headmaster',
  dos:           'DOS',
  teacher:       'Teacher'
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#1e293b', color: 'white',
        display: 'flex', flexDirection: 'column', padding: '24px 0'
      }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>
            🎓 DropoutGuard
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div style={{
            fontSize: 11, background: '#334155', borderRadius: 20,
            padding: '2px 8px', display: 'inline-block', marginTop: 4, color: '#93c5fd'
          }}>
            {roleLabel[user?.role]}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {[
            { to: '/',       label: '📊 Dashboard' },
            { to: '/my-class', label: '👨‍🎓 My Class', hide: user?.role !== 'teacher' },
            { to: '/reports',label: '📄 Reports', hide: user?.role === 'superadmin' },
            { to: '/users',  label: user?.role === 'superadmin' ? '👥 Sector Leaders' : user?.role === 'sector_leader' ? '👥 Headmasters/Schools' : user?.role === 'headmaster' ? '👥 DOS' : '👥 Class Teachers', hide: user?.role === 'teacher' },
            { to: '/risk-frequency', label: '⚠️ Risk Frequency', hide: user?.role === 'superadmin' },
          ].filter(l => !l.hide).map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                display: 'block', padding: '10px 24px',
                color: isActive ? '#60a5fa' : '#cbd5e1',
                background: isActive ? '#334155' : 'transparent',
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent'
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #334155' }}>
          <button className="btn btn-secondary" onClick={handleLogout}
            style={{ width: '100%', background: '#334155', color: '#cbd5e1' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
