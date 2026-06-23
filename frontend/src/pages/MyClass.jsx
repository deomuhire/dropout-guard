import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function MyClass() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [classInfo, setClassInfo] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [classRes, studentsRes] = await Promise.all([
        api.get('/users/me/class').catch(() => null),
        api.get('/users/me/students').catch(() => ({ data: [] }))
      ])
      setClassInfo(classRes?.data || null)
      setStudents(studentsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{padding:40, color:'#64748b'}}>Loading...</div>

  const filteredStudents = searchTerm
    ? students.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.guardian?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.village?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : students

  const totalStudents = students.length
  const atRiskCount = students.filter(s => s.at_risk === true).length
  const safeCount = students.filter(s => s.at_risk === false).length
  const pendingCount = students.filter(s => s.at_risk === null || s.at_risk === undefined).length

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700 }}>My Class — {classInfo?.name || 'No Class Assigned'}</h1>
          <p style={{ color:'#64748b', marginTop:4 }}>Students assigned to you by your DOS.</p>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:600, background: new Date().getDay() === 0 || new Date().getDay() === 6 ? '#fee2e2' : '#dcfce7', color: new Date().getDay() === 0 || new Date().getDay() === 6 ? '#991b1b' : '#166534' }}>
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]}
          </span>
          <button className="btn btn-secondary" onClick={loadData}>Refresh</button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/students/all/form')}
          >
            {new Date().getDay() === 0 || new Date().getDay() === 6 ? 'Attendance Unavailable' : 'Start Attendance'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        <div className="card" style={{ textAlign:'center' }}>
          <div style={{ fontSize:28, fontWeight:700, color:'#2563eb' }}>{totalStudents}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Total Students</div>
        </div>
        <div className="card" style={{ textAlign:'center' }}>
          <div style={{ fontSize:28, fontWeight:700, color:'#dc2626' }}>{atRiskCount}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>At Risk</div>
        </div>
        <div className="card" style={{ textAlign:'center' }}>
          <div style={{ fontSize:28, fontWeight:700, color:'#16a34a' }}>{safeCount}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Safe</div>
        </div>
        <div className="card" style={{ textAlign:'center' }}>
          <div style={{ fontSize:28, fontWeight:700, color:'#f59e0b' }}>{pendingCount}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Pending</div>
        </div>
      </div>

      {/* Student Table */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
          <h3 style={{ fontSize:16 }}>Students</h3>
          <input
            type="text"
            placeholder="Search by name, ID, guardian, village..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding:'8px 14px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, width:280 }}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Village</th>
              <th>Guardian</th>
              <th>Risk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                {searchTerm ? 'No students match your search' : 'No students assigned to your class yet'}
              </td></tr>
            )}
            {filteredStudents.map(s => (
              <tr key={s.id} style={{ background: s.at_risk ? '#fef2f2' : undefined }}>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.student_id}</td>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td>{s.gender || '—'}</td>
                <td>{s.village || '—'}</td>
                <td>{s.guardian || '—'}</td>
                <td style={{ fontWeight: 600, color: s.at_risk === null ? '#94a3b8' : s.at_risk ? '#dc2626' : '#16a34a' }}>
                  {s.at_risk === null || s.at_risk === undefined ? '—' : s.at_risk ? 'At Risk' : 'Safe'}
                </td>
                <td>
                  <span style={{
                    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: s.at_risk === null || s.at_risk === undefined ? '#f3f4f6' : s.at_risk ? '#fee2e2' : '#dcfce7',
                    color: s.at_risk === null || s.at_risk === undefined ? '#6b7280' : s.at_risk ? '#991b1b' : '#166534'
                  }}>
                    {s.at_risk === null || s.at_risk === undefined ? 'Pending' : s.at_risk ? 'At Risk' : 'Safe'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length > 10 && <p style={{ marginTop:12, color:'#64748b', fontSize:13 }}>Showing {filteredStudents.length} of {students.length} students</p>}
      </div>
    </div>
  )
}