import { useMemo } from 'react'

const CRITERIA = [
  { key: 'length',    label: 'At least 8 characters' },
  { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
  { key: 'lowercase', label: 'One lowercase letter (a-z)' },
  { key: 'number',    label: 'One number (0-9)' },
  { key: 'special',   label: 'One special character (!@#$...)' },
]

export default function PasswordCriteria({ password }) {
  const checks = useMemo(() => {
    if (!password) return null
    return {
      length:    password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number:    /[0-9]/.test(password),
      special:   /[^A-Za-z0-9]/.test(password),
    }
  }, [password])

  if (!checks) {
    // Show all unchecked criteria when password is empty
    return (
      <div style={{
        marginTop: 8,
        padding: '10px 12px',
        background: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        fontSize: 13,
      }}>
        <div style={{
          fontWeight: 600,
          marginBottom: 6,
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          Password Requirements
        </div>
        {CRITERIA.map(c => (
          <div
            key={c.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '3px 0',
              color: '#94a3b8',
            }}
          >
            <span style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              background: '#f1f5f9',
              color: '#cbd5e1',
              border: '1.5px solid #e2e8f0',
              flexShrink: 0,
            }}>
              •
            </span>
            <span>{c.label}</span>
          </div>
        ))}
        <div style={{
          marginTop: 8,
          height: 4,
          borderRadius: 2,
          background: '#e2e8f0',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            borderRadius: 2,
            width: '0%',
            background: '#e2e8f0',
            transition: 'all 0.3s',
          }} />
        </div>
      </div>
    )
  }

  const allMet = Object.values(checks).every(Boolean)

  return (
    <div style={{
      marginTop: 8,
      padding: '10px 12px',
      background: '#f8fafc',
      borderRadius: 8,
      border: '1px solid #e2e8f0',
      fontSize: 13,
    }}>
      <div style={{
        fontWeight: 600,
        marginBottom: 6,
        color: allMet ? '#16a34a' : '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        {allMet ? (
          <span style={{ fontSize: 16 }}>✅</span>
        ) : (
          <span style={{ fontSize: 16 }}>🔒</span>
        )}
        Password Requirements {allMet && '— All met!'}
      </div>
      {CRITERIA.map(c => {
        const met = checks[c.key]
        return (
          <div
            key={c.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '3px 0',
              color: met ? '#16a34a' : '#94a3b8',
              transition: 'color 0.2s',
            }}
          >
            <span style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              background: met ? '#dcfce7' : '#f1f5f9',
              color: met ? '#16a34a' : '#cbd5e1',
              border: met ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
              flexShrink: 0,
            }}>
              {met ? '✓' : '•'}
            </span>
            <span style={{ textDecoration: met ? 'none' : 'none' }}>
              {c.label}
            </span>
          </div>
        )
      })}
      {/* Strength bar */}
      <div style={{
        marginTop: 8,
        height: 4,
        borderRadius: 2,
        background: '#e2e8f0',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 2,
          width: `${(Object.values(checks).filter(Boolean).length / 5) * 100}%`,
          background: allMet
            ? '#16a34a'
            : Object.values(checks).filter(Boolean).length >= 3
              ? '#eab308'
              : '#ef4444',
          transition: 'all 0.3s',
        }} />
      </div>
    </div>
  )
}
