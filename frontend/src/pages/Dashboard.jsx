import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AlertTriangle, CheckCircle2, ClipboardCheck, FilePenLine, Search, UsersRound } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#dc2626', '#16a34a']
const ROLE_LABEL = {
  superadmin:    'Sector Leaders',
  sector_leader: 'Headmasters',
  headmaster:    'DOS',
  dos:           'Class Teachers',
  teacher:       'Students'
}

function Header({ today, title }) {
  return (
    <div style={{ marginBottom:24 }}>
      <h1 style={{ fontSize:24, fontWeight:700 }}>{title}</h1>
      <p style={{ color:'#64748b', marginTop:4 }}>{today}</p>
    </div>
  )
}
function KpiCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign:'center' }}>
      <div style={{ fontSize:32, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>{label}</div>
    </div>
  )
}
function StatusBadge({ active }) {
  return (
    <span style={{
      padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:600,
      background: active?'#dcfce7':'#fee2e2', color: active?'#166534':'#991b1b'
    }}>{active?'Active':'Inactive'}</span>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [teacherStudentsModal, setTeacherStudentsModal] = useState({ open:false, teacher:null, students:[], loading:false, error:null })

  const [addStudentForm, setAddStudentForm] = useState({ student_id:'', name:'', gender:'Male', guardian:'', village:'' })
  const [addStudentSubmitting, setAddStudentSubmitting] = useState(false)

  const loadTeacherStudents = async (teacher) => {
    if (!teacher?.id) return
    setTeacherStudentsModal(p => ({ ...p, loading:true, error:null, teacher }))
    try {
      const res = await api.get(`/dos-teachers-students/${teacher.id}/students`)
      setTeacherStudentsModal(p => ({ ...p, loading:false, students: res.data || [] }))
    } catch (err) {
      setTeacherStudentsModal(p => ({ ...p, loading:false, error: err.response?.data?.error || err.message || 'Failed to load students', students: [] }))
    }
  }

  const openTeacherStudentsModal = async (teacher) => {
    if (!teacher?.id) return
    setTeacherStudentsModal({ open:true, teacher, students:[], loading:true, error:null })
    setAddStudentForm({ student_id:'', name:'', gender:'Male', guardian:'', village:'' })
    await loadTeacherStudents(teacher)
  }

  useEffect(() => {
    // keep for future compatibility; no-op
  }, [])


  const submitAddStudent = async () => {
    if (!teacherStudentsModal.teacher?.id) return
    const { student_id, name, gender, guardian, village } = addStudentForm
    if (!student_id.trim() || !name.trim()) {
      alert('student_id and name are required')
      return
    }
    setAddStudentSubmitting(true)
    try {
      await api.post(`/dos-teachers-students/${teacherStudentsModal.teacher.id}/students/add`, {
        student_id: student_id.trim(),
        name: name.trim(),
        gender: gender || '',
        guardian: guardian || '',
        village: village || ''
      })
      await loadTeacherStudents(teacherStudentsModal.teacher)
      setAddStudentForm({ student_id:'', name:'', gender:'Male', guardian:'', village:'' })
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Error adding student')
    } finally {
      setAddStudentSubmitting(false)
    }
  }

  const closeTeacherStudentsModal = () => {
    setTeacherStudentsModal({ open:false, teacher:null, students:[], loading:false, error:null })
  }

  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedClasses, setExpandedClasses] = useState({})
  const [selectedLeader, setSelectedLeader] = useState(null)
  const [leaderData, setLeaderData] = useState(null)
  const [leaderLoading, setLeaderLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadLeaderData = async (leaderId) => {
    setLeaderLoading(true)
    try {
      const usersRes = await api.get(`/users/sector/${leaderId}`)
      setLeaderData({
        hierarchyUsers: usersRes.data.users || []
      })
    } catch (err) {
      console.error(err)
      setLeaderData(null)
    } finally {
      setLeaderLoading(false)
    }
  }

  const handleSelectLeader = (leader) => {
    if (selectedLeader?.id === leader.id) {
      setSelectedLeader(null)
      setLeaderData(null)
    } else {
      setSelectedLeader(leader)
      loadLeaderData(leader.id)
    }
  }

  const toggleLeader = async (leader) => {
    try {
      await api.put(`/users/${leader.id}/toggle`)
      loadData()
      if (selectedLeader?.id === leader.id) {
        setSelectedLeader(null)
        setLeaderData(null)
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error toggling leader')
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)

      if (user.role === 'superadmin') {
        const res = await api.get('/users/')
        setData({ type: 'superadmin', sectorLeaders: res.data, users: res.data })
        return
      }

      if (user.role === 'dos') {
        const [dosTeachersWithStudentsRes, summaryRes] = await Promise.all([
          api.get(`/dos-teachers-students/dos/${user.id}/teachers-with-students`),
          api.get(`/attendance/school/${user.school_id}/summary`),
        ])

        const teachersPayload = dosTeachersWithStudentsRes.data?.teachers || []
        const teachers = teachersPayload.map(x => x.teacher)
        const students = teachersPayload.flatMap(x => x.students || [])
        const summary = summaryRes.data || { gender_counts: { Male: 0, Female: 0, Unknown: 0 } }

        // Keep same shape expected later in DOS section
        setData({ type: 'dos', teachers, students, summary })
        return
      }

      if (user.role === 'headmaster') {
        const [usersRes, hierarchyRes, summaryRes, studentsRes] = await Promise.all([
          api.get('/users/'),
          api.get('/users/hierarchy'),
          api.get(`/attendance/school/${user.school_id}/summary`),
          api.get('/students/')
        ])
        const dosUsers = usersRes.data || []
        const hierarchyUsers = hierarchyRes.data?.users || []
        const hierarchyTeachers = hierarchyUsers.filter(u => u.role === 'teacher')
        setData({ type: 'headmaster', users: dosUsers, hierarchyUsers, hierarchyTeachers, summary: summaryRes.data, students: studentsRes.data })
        return
      }

      if (user.role === 'teacher') {
        const [studentsRes, summaryRes] = await Promise.all([
          api.get('/students/'),
          api.get('/attendance/class/summary').catch(() => null)
        ])
        const classInfo = { name: studentsRes.data[0]?.class_name || 'My Class' }
        const summary = summaryRes?.data || {
          total_students: studentsRes.data.length,
          gender_counts: { Male: 0, Female: 0, Unknown: 0 },
          total_recorded: studentsRes.data.filter(s => s.at_risk !== null).length,
          at_risk_count: studentsRes.data.filter(s => s.at_risk).length,
          safe_count: studentsRes.data.filter(s => s.at_risk !== null && !s.at_risk).length,
          performance_summary: [],
          records: []
        }
        setData({ type: 'teacher', classInfo, students: studentsRes.data, summary })
        return
      }

      const [usersRes, extraRes, studentsRes] = await Promise.all([
        api.get('/users/'),
        user.role === 'sector_leader'
          ? api.get(`/reports/sector/${user.id}`)
          : api.get(`/attendance/school/${user.school_id}/summary`),
        user.role === 'sector_leader'
          ? api.get('/students/')
          : Promise.resolve(null)
      ])

      if (user.role === 'sector_leader') {
        setData({ type: 'sector_leader', schools: extraRes.data, users: usersRes.data, students: studentsRes?.data || [] })
      } else {
        setData({ type: user.role, summary: extraRes.data, users: usersRes.data })
      }
    } catch (err) {
      console.error(err)
      setData({ type: user.role, error: true })
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'#64748b' }}>
      Loading dashboard...
    </div>
  )

  // SUPERADMIN
  if (data?.type === 'superadmin') {
    const usersForLeader = leaderData?.hierarchyUsers || []
    // Ensure teacher assigned_class is always populated on the backend payload
    // (some dashboards previously rendered empty teacher class due to missing class mapping)
    // This block is intentionally left non-invasive; UI reads from hierarchyUsers.

    const leaders = data.sectorLeaders || []
    return (
      <div>
        <Header today={today} title="Superadmin Dashboard" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
          <KpiCard label="Total Sector Leaders" value={leaders.length} color="#2563eb" />
          <KpiCard label="Active"   value={leaders.filter(l=>l.is_active).length}  color="#16a34a" />
          <KpiCard label="Inactive" value={leaders.filter(l=>!l.is_active).length} color="#dc2626" />
        </div>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15 }}>Sector Leaders</h3>
            <button className="btn btn-primary" style={{ fontSize:13 }} onClick={() => navigate('/users')}>
              + Create Sector Leader
            </button>
          </div>
          <table>
            <thead><tr><th>Name</th><th>Username</th><th>Province</th><th>District</th><th>Sector</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {leaders.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>
                  No sector leaders yet — go to Users to create one
                </td></tr>
              )}
              {leaders.map(l => (
                <tr key={l.id} style={{ background: selectedLeader?.id === l.id ? '#eff6ff' : undefined, cursor:'pointer' }}
                    onClick={() => handleSelectLeader(l)}>
                  <td style={{ fontWeight:500 }}>{l.first_name} {l.last_name}</td>
                  <td style={{ fontFamily:'monospace', fontSize:13 }}>{l.username}</td>
                  <td>{l.province}</td><td>{l.district}</td><td>{l.sector}</td>
                  <td><StatusBadge active={l.is_active} /></td>
                  <td>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <button className="btn btn-secondary" style={{ fontSize:12, padding:'4px 10px' }} onClick={(e) => { e.stopPropagation(); navigate('/users', { state: { editUserId: l.id } }) }}>Edit</button>
                      <button className="btn" style={{ fontSize:12, padding:'4px 10px', background: l.is_active ? '#fee2e2' : '#dcfce7', color: l.is_active ? '#991b1b' : '#166534' }} onClick={(e) => { e.stopPropagation(); toggleLeader(l) }}>{l.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn btn-primary" style={{ fontSize:12, padding:'4px 10px' }} onClick={(e) => { e.stopPropagation(); handleSelectLeader(l) }}>
                        {selectedLeader?.id === l.id ? '✕ Close' : 'View More'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedLeader && leaderLoading && (
          <div className="card" style={{ marginTop:16, textAlign:'center', padding:32, color:'#64748b' }}>
            Loading users for {selectedLeader.first_name} {selectedLeader.last_name}...
          </div>
        )}

        {selectedLeader && leaderData && !leaderLoading && (
          <div className="card" style={{ marginTop:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ fontSize:18, fontWeight:600 }}>
                {selectedLeader.first_name} {selectedLeader.last_name} — Users
              </h2>
              <button className="btn btn-secondary" style={{ fontSize:13 }} onClick={() => { setSelectedLeader(null); setLeaderData(null) }}>Close</button>
            </div>
            {(() => {
                const hUsers = leaderData.hierarchyUsers || []
                const headmasters = hUsers.filter(u => u.role === 'headmaster')
                const dosUsers = hUsers.filter(u => u.role === 'dos')
                const teachers = hUsers.filter(u => u.role === 'teacher')
                
                const handleEditUser = (u) => {
                  navigate('/users', { state: { editUserId: u.id } })
                }
                
                const handleToggleUser = async (u) => {
                  try {
                    await api.put(`/users/${u.id}/toggle`)
                    loadLeaderData(selectedLeader.id)
                  } catch (err) {
                    alert(err.response?.data?.error || 'Error toggling user')
                  }
                }
                
                if (hUsers.length === 0) {
                  return <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>No users registered under this sector yet</p>
                }
                
                return (
                  <div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                      <div className="card" style={{ textAlign:'center', padding:'10px 8px' }}>
                        <div style={{ fontSize:22, fontWeight:700, color:'#1e40af' }}>{headmasters.length}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>Headmasters</div>
                      </div>
                      <div className="card" style={{ textAlign:'center', padding:'10px 8px' }}>
                        <div style={{ fontSize:22, fontWeight:700, color:'#92400e' }}>{dosUsers.length}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>DOS Users</div>
                      </div>
                      <div className="card" style={{ textAlign:'center', padding:'10px 8px' }}>
                        <div style={{ fontSize:22, fontWeight:700, color:'#166534' }}>{teachers.length}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>Teachers</div>
                      </div>
                      <div className="card" style={{ textAlign:'center', padding:'10px 8px' }}>
                        <div style={{ fontSize:22, fontWeight:700, color:'#64748b' }}>{hUsers.filter(u => !u.is_active).length}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>Inactive</div>
                      </div>
                    </div>
                    {headmasters.map(hm => {
                  const hmDos = dosUsers.filter(d => d.created_by_id === hm.id)
                  return (
                    <div key={hm.id} style={{ marginBottom: 16, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ background: '#f8fafc', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#dbeafe', color: '#1e40af' }}>Headmaster</span>
                          <span style={{ fontWeight: 500 }}>{hm.first_name} {hm.last_name}</span>
                          <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{hm.username}</span>
                          <span style={{ color: '#64748b', fontSize: 12 }}>{hm.school?.name || ''}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <StatusBadge active={hm.is_active} />
                          <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => handleEditUser(hm)}>Edit</button>
                          <button className="btn" style={{ fontSize: 11, padding: '3px 10px', background: hm.is_active ? '#fee2e2' : '#dcfce7', color: hm.is_active ? '#991b1b' : '#166534' }} onClick={() => handleToggleUser(hm)}>{hm.is_active ? 'Deactivate' : 'Activate'}</button>
                        </div>
                      </div>
                      {hmDos.length > 0 && hmDos.map(dos => {
                        const dosTeachers = teachers.filter(t => t.created_by_id === dos.id)
                        return (
                          <div key={dos.id} style={{ marginLeft: 24, borderLeft: '2px solid #e2e8f0', padding: '8px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>DOS</span>
                                <span style={{ fontWeight: 500 }}>{dos.first_name} {dos.last_name}</span>
                                <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{dos.username}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <StatusBadge active={dos.is_active} />
                                <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => handleEditUser(dos)}>Edit</button>
                                <button className="btn" style={{ fontSize: 11, padding: '3px 10px', background: dos.is_active ? '#fee2e2' : '#dcfce7', color: dos.is_active ? '#991b1b' : '#166534' }} onClick={() => handleToggleUser(dos)}>{dos.is_active ? 'Deactivate' : 'Activate'}</button>
                              </div>
                            </div>
                            {dosTeachers.length > 0 && (
                              <div style={{ marginTop: 8, marginLeft: 24, borderLeft: '2px solid #e2e8f0', paddingLeft: 16 }}>
                                {dosTeachers.map(t => (
                                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#dcfce7', color: '#166534' }}>Teacher</span>
                                      <span style={{ fontWeight: 500 }}>{t.first_name} {t.last_name}</span>
                                      <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{t.username}</span>
                                      <span style={{ color: '#64748b', fontSize: 12 }}>Class: {t.assigned_class?.name || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                      <StatusBadge active={t.is_active} />
                                      <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => handleEditUser(t)}>Edit</button>
                                      <button className="btn" style={{ fontSize: 11, padding: '3px 10px', background: t.is_active ? '#fee2e2' : '#dcfce7', color: t.is_active ? '#991b1b' : '#166534' }} onClick={() => handleToggleUser(t)}>{t.is_active ? 'Deactivate' : 'Activate'}</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
                  </div>
                )
              })()}
          </div>
        )}
      </div>
    )
  }

  // SECTOR LEADER
  if (data?.type === 'sector_leader') {
    const schools = data.schools || []
    const users   = data.users || []
    const totalStudents = schools.reduce((sum, sc) => sum + (sc.students || 0), 0)
    const totalMale = schools.reduce((sum, sc) => sum + (sc.gender_counts?.Male || 0), 0)
    const totalFemale = schools.reduce((sum, sc) => sum + (sc.gender_counts?.Female || 0), 0)
    return (
      <div>
        <Header today={today} title="Sector Dashboard" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:16, marginBottom:24 }}>
          <KpiCard label="Total Schools"         value={schools.length} color="#2563eb" />
          <KpiCard label="Students"              value={totalStudents} color="#4f46e5" />
          <KpiCard label="Male"                  value={totalMale} color="#0891b2" />
          <KpiCard label="Female"                value={totalFemale} color="#be185d" />
          <KpiCard label="Headmasters"          value={users.length} color="#38bdf8" />
        </div>
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:15, marginBottom:16 }}>Recorded Students by School</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={schools.map(sc => ({ name: sc.school.name, recorded: sc.total, atRisk: sc.at_risk, safe: sc.safe }))}>
              <XAxis dataKey="name" tick={{fontSize:12}} /><YAxis tick={{fontSize:12}} /><Tooltip />
              <Bar dataKey="recorded" fill="#2563eb" radius={[4,4,0,0]} name="Recorded" />
              <Bar dataKey="atRisk" fill="#dc2626" radius={[4,4,0,0]} name="At Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:16 }}>Schools in Your Sector</h3>
          <table>
            <thead><tr><th>School</th><th>Location</th><th>Recorded</th><th>At Risk</th><th>Safe</th></tr></thead>
            <tbody>
              {schools.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>No schools registered yet</td></tr>
              )}
              {schools.map(sc => (
                <tr key={sc.school.id}>
                  <td style={{ fontWeight:500 }}>{sc.school.name}</td>
                  <td style={{ fontSize:13, color:'#64748b' }}>{sc.school.district}, {sc.school.sector}</td>
                  <td>{sc.total}</td>
                  <td><span className="badge-risk">{sc.at_risk}</span></td>
                  <td><span className="badge-safe">{sc.safe}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15 }}>Headmasters</h3>
            <button className="btn btn-primary" style={{ fontSize:13 }} onClick={() => navigate('/users')}>
              Manage Headmasters
            </button>
          </div>
          <table>
            <thead><tr><th>Name</th><th>Username</th><th>School</th><th>Status</th></tr></thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>No headmasters created yet</td></tr>
              )}
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight:500 }}>{u.first_name} {u.last_name}</td>
                  <td style={{ fontFamily:'monospace', fontSize:13 }}>{u.username}</td>
                  <td>{u.school?.name || 'Unassigned'}</td>
                  <td><StatusBadge active={u.is_active} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // HEADMASTER
  if (data?.type === 'headmaster') {
    const summary = data.summary || {}
    const users = data.users || []
    const students = data.students || []
    const hierarchyUsers = data.hierarchyUsers || []
    const hierarchyTeachers = data.hierarchyTeachers || []
    const dosUsers = hierarchyUsers.filter(u => u.role === 'dos')
    const totalStudents = summary.total_students || students.length
    const totalRecorded = summary.total_recorded || 0
    const totalRisk = summary.at_risk_count || 0
    const totalSafe = summary.safe_count || 0
    const male = summary.gender_counts?.Male || 0
    const female = summary.gender_counts?.Female || 0
    const unknown = summary.gender_counts?.Unknown || 0
    const performanceSummary = summary.performance_summary || []

    return (
      <div>
        <Header today={today} title="Headmaster Dashboard" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:16, marginBottom:24 }}>
          <KpiCard label="DOS Users" value={dosUsers.length} color="#92400e" />
          <KpiCard label="Teachers" value={hierarchyTeachers.length} color="#166534" />
          <KpiCard label="Total Students" value={totalStudents} color="#2563eb" />
          <KpiCard label="Recorded Today" value={totalRecorded} color="#4f46e5" />
          <KpiCard label="At Risk" value={totalRisk} color="#dc2626" />
          <KpiCard label="Safe" value={totalSafe} color="#16a34a" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:24 }}>
          <div className="card">
            <h3 style={{ fontSize:15, marginBottom:16 }}>Risk by Performance Level</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={performanceSummary.map(item => ({ name: item.name, recorded: item.total, atRisk: item.at_risk }))}>
                <XAxis dataKey="name" tick={{fontSize:12}} /><YAxis tick={{fontSize:12}} /><Tooltip />
                <Bar dataKey="recorded" fill="#2563eb" radius={[4,4,0,0]} name="Recorded" />
                <Bar dataKey="atRisk" fill="#dc2626" radius={[4,4,0,0]} name="At Risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <h3 style={{ marginBottom:16, fontSize:15, alignSelf:'flex-start' }}>Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[{ name:'At Risk', value: totalRisk }, { name:'Safe', value: totalSafe }]} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({name,value})=>`${name}: ${value}`} labelLine={false} fontSize={11}>
                  <Cell fill="#dc2626" />
                  <Cell fill="#16a34a" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:16 }}>School Students</h3>
              <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>All active students in your school, grouped by class.</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-secondary" style={{ fontSize:12, padding:'4px 12px' }} onClick={() => {
                const displayStudents = students
                const allClasses = [...new Set(displayStudents.map(s => s.class_name || 'Unassigned'))]
                const allExpanded = allClasses.every(c => expandedClasses[c])
                const newState = {}
                allClasses.forEach(c => { newState[c] = !allExpanded })
                setExpandedClasses(newState)
              }}>
                {(() => {
                  const displayStudents = students
                  const allClasses = [...new Set(displayStudents.map(s => s.class_name || 'Unassigned'))]
                  return allClasses.length > 0 && allClasses.every(c => expandedClasses[c]) ? 'Collapse All' : 'Expand All'
                })()}
              </button>
            </div>
          </div>
          {(() => {
            const displayStudents = students
            const classGroups = {}
            displayStudents.forEach(s => {
              const cls = s.class_name || 'Unassigned'
              if (!classGroups[cls]) classGroups[cls] = []
              classGroups[cls].push(s)
            })
            const classNames = Object.keys(classGroups).sort()
            if (classNames.length === 0) return <p style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>No students in your school yet</p>
            return classNames.map(cls => {
              const classStudents = classGroups[cls]
              const isExpanded = expandedClasses[cls] !== false
              const classRisk = classStudents.filter(s => s.at_risk === true).length
              const classSafe = classStudents.filter(s => s.at_risk === false).length
              const classPending = classStudents.filter(s => s.at_risk === null).length
              return (
                <div key={cls} style={{ marginBottom:8, border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
                  <div
                    style={{ background:'#f8fafc', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', userSelect:'none' }}
                    onClick={() => setExpandedClasses(p => ({ ...p, [cls]: !isExpanded }))}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:11, color: isExpanded ? '#2563eb' : '#64748b', transition:'transform 0.15s' }}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
                      <span style={{ fontWeight:600, fontSize:14 }}>{cls}</span>
                      <span style={{ fontSize:12, color:'#64748b' }}>{classStudents.length} student{classStudents.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      {classRisk > 0 && <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, background:'#fee2e2', color:'#991b1b' }}>{classRisk} at risk</span>}
                      {classSafe > 0 && <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, background:'#dcfce7', color:'#166534' }}>{classSafe} safe</span>}
                      {classPending > 0 && <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, background:'#f3f4f6', color:'#6b7280' }}>{classPending} pending</span>}
                    </div>
                  </div>
                  {isExpanded && (
                    <table>
                      <thead><tr><th>Name</th><th>Student ID</th><th>Gender</th><th>Status</th></tr></thead>
                      <tbody>
                        {classStudents.map(s => (
                          <tr key={s.id}>
                            <td style={{ fontWeight:500 }}>{s.name}</td>
                            <td style={{ fontFamily:'monospace', fontSize:13 }}>{s.student_id}</td>
                            <td>{s.gender}</td>
                            <td><span style={{ padding:'2px 8px', borderRadius:4, fontSize:12, background: s.at_risk === null ? '#f3f4f6' : s.at_risk ? '#fee2e2' : '#dcfce7', color: s.at_risk === null ? '#6b7280' : s.at_risk ? '#991b1b' : '#166534' }}>{s.at_risk === null ? 'Pending' : s.at_risk ? 'At Risk' : 'Safe'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })
          })()}
          {students.length > 10 && <p style={{ marginTop:12, color:'#64748b', fontSize:13 }}>Showing {students.length} students across {[...new Set(students.map(s => s.class_name || 'Unassigned'))].length} classes</p>}
        </div>

        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:16 }}>DOS &amp; Teachers</h3>
              <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>DOS users under your school and their assigned teachers.</p>
            </div>
          </div>
          {dosUsers.length === 0 && (
            <p style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>No DOS users created yet</p>
          )}
          {dosUsers.map(dos => {
            const dosTeachers = hierarchyTeachers.filter(t => t.created_by_id === dos.id)
            return (
              <div key={dos.id} style={{ marginBottom:16, border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
                <div style={{ background:'#f8fafc', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:'#fef3c7', color:'#92400e' }}>DOS</span>
                    <span style={{ fontWeight:500 }}>{dos.first_name} {dos.last_name}</span>
                    <span style={{ color:'#64748b', fontSize:12, fontFamily:'monospace' }}>{dos.username}</span>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <StatusBadge active={dos.is_active} />
                    <span style={{ fontSize:11, color:'#64748b' }}>{dosTeachers.length} teacher{dosTeachers.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                {dosTeachers.length > 0 && (
                  <div style={{ marginLeft:24, borderLeft:'2px solid #e2e8f0', padding:'8px 16px' }}>
                    {dosTeachers.map(t => (
                      <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f1f5f9' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:'#dcfce7', color:'#166534' }}>Teacher</span>
                          <span style={{ fontWeight:500 }}>{t.first_name} {t.last_name}</span>
                          <span style={{ color:'#64748b', fontSize:12, fontFamily:'monospace' }}>{t.username}</span>
                          <span style={{ color:'#64748b', fontSize:12 }}>Class: {t.assigned_class?.name || '—'}</span>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <StatusBadge active={t.is_active} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {dosTeachers.length === 0 && (
                  <div style={{ marginLeft:24, borderLeft:'2px solid #e2e8f0', padding:'8px 16px' }}>
                    <p style={{ color:'#94a3b8', fontSize:12, fontStyle:'italic' }}>No teachers assigned yet</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  {/* Teacher students modal (DOS) */}
  {user?.role === 'dos' && teacherStudentsModal.open && teacherStudentsModal.teacher && (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={closeTeacherStudentsModal}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          width: '90%',
          maxWidth: 900,
          maxHeight: '85vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
              Students for {teacherStudentsModal.teacher.first_name} {teacherStudentsModal.teacher.last_name}
            </h3>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>
              Class: {teacherStudentsModal.teacher.assigned_class?.name || '—'} • {teacherStudentsModal.students.length} students
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={closeTeacherStudentsModal} style={{ fontSize: 13 }}>
              Close
            </button>
          </div>
        </div>

        {/* Add student form */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Add new student</h4>
            {teacherStudentsModal.error && (
              <div style={{ color: '#991b1b', background: '#fee2e2', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                {teacherStudentsModal.error}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: '#64748b' }}>Student ID *</label>
              <input
                value={addStudentForm.student_id}
                onChange={(e) => setAddStudentForm(p => ({ ...p, student_id: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                placeholder="e.g. 1001"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b' }}>Name *</label>
              <input
                value={addStudentForm.name}
                onChange={(e) => setAddStudentForm(p => ({ ...p, name: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                placeholder="Student name"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#64748b' }}>Gender</label>
              <select
                value={addStudentForm.gender}
                onChange={(e) => setAddStudentForm(p => ({ ...p, gender: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#64748b' }}>Guardian</label>
              <input
                value={addStudentForm.guardian}
                onChange={(e) => setAddStudentForm(p => ({ ...p, guardian: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                placeholder="Guardian name"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: '#64748b' }}>Village</label>
              <input
                value={addStudentForm.village}
                onChange={(e) => setAddStudentForm(p => ({ ...p, village: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                placeholder="Village"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={submitAddStudent}
              disabled={addStudentSubmitting || teacherStudentsModal.loading}
              style={{ minWidth: 140, opacity: (addStudentSubmitting || teacherStudentsModal.loading) ? 0.7 : 1 }}
            >
              {addStudentSubmitting ? 'Adding...' : 'Add student'}
            </button>
          </div>
        </div>

        {/* Students list */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Student list</h4>
            {teacherStudentsModal.loading && (
              <span style={{ color: '#64748b', fontSize: 13 }}>Loading...</span>
            )}
          </div>

          {teacherStudentsModal.students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>
              No students yet. Add one above.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Gender</th>
                  <th>Guardian</th>
                  <th>Village</th>
                </tr>
              </thead>
              <tbody>
                {teacherStudentsModal.students.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim()}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.student_id}</td>
                    <td>{s.gender || '—'}</td>
                    <td>{s.guardian || '—'}</td>
                    <td>{s.village || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )}

  // DOS DASHBOARD
  if (data?.type === 'dos') {

    const teachers = data.teachers || []
    const students = data.students || []
    const summary = data.summary || {}
    const totalStudents = students.length
    const totalMale = summary.gender_counts?.Male || 0
    const totalFemale = summary.gender_counts?.Female || 0
    const totalRecorded = students.filter(s => s.at_risk !== null).length
    const totalRisk = students.filter(s => s.at_risk === true).length
    const totalSafe = students.filter(s => s.at_risk === false).length
    const totalPending = totalStudents - totalRecorded

    return (
      <div>
        <Header today={today} title="DOS Dashboard" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:16, marginBottom:24 }}>
          <KpiCard label="Total Teachers" value={teachers.length} color="#2563eb" />
          <KpiCard label="Total Students" value={totalStudents} color="#4f46e5" />
          <KpiCard label="At Risk" value={totalRisk} color="#dc2626" />
          <KpiCard label="Safe" value={totalSafe} color="#16a34a" />
          <KpiCard label="Pending" value={totalPending} color="#f59e0b" />
        </div>

        <div className="card" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:16 }}>All Students</h3>
              <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Summary of all students managed by your teachers, grouped by class.</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-secondary" style={{ fontSize:12, padding:'4px 12px' }} onClick={() => {
                const allClasses = [...new Set(students.map(s => s.class_name || 'Unassigned'))]
                const allExpanded = allClasses.every(c => expandedClasses[c])
                const newState = {}
                allClasses.forEach(c => { newState[c] = !allExpanded })
                setExpandedClasses(newState)
              }}>
                {(() => {
                  const allClasses = [...new Set(students.map(s => s.class_name || 'Unassigned'))]
                  return allClasses.length > 0 && allClasses.every(c => expandedClasses[c]) ? 'Collapse All' : 'Expand All'
                })()}
              </button>
            </div>
          </div>
          {(() => {
            const classGroups = {}
            students.forEach(s => {
              const cls = s.class_name || 'Unassigned'
              if (!classGroups[cls]) classGroups[cls] = []
              classGroups[cls].push(s)
            })
            const classNames = Object.keys(classGroups).sort()
            if (classNames.length === 0) return <p style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>No students in your school yet</p>
            return classNames.map(cls => {
              const classStudents = classGroups[cls]
              const isExpanded = expandedClasses[cls] !== false
              const classRisk = classStudents.filter(s => s.at_risk === true).length
              const classSafe = classStudents.filter(s => s.at_risk === false).length
              const classPending = classStudents.filter(s => s.at_risk === null).length
              const teacher = teachers.find(t => t.assigned_class?.name === cls)
              return (
                <div key={cls} style={{ marginBottom:8, border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
                  <div
                    style={{ background:'#f8fafc', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', userSelect:'none' }}
                    onClick={() => setExpandedClasses(p => ({ ...p, [cls]: !isExpanded }))}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:11, color: isExpanded ? '#2563eb' : '#64748b', transition:'transform 0.15s' }}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
                      <span style={{ fontWeight:600, fontSize:14 }}>{cls}</span>
                      <span style={{ fontSize:12, color:'#64748b' }}>{classStudents.length} student{classStudents.length !== 1 ? 's' : ''}</span>
                      {teacher && <span style={{ fontSize:11, color:'#64748b' }}>Teacher: {teacher.first_name} {teacher.last_name}</span>}
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      {classRisk > 0 && <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, background:'#fee2e2', color:'#991b1b' }}>{classRisk} at risk</span>}
                      {classSafe > 0 && <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, background:'#dcfce7', color:'#166534' }}>{classSafe} safe</span>}
                      {classPending > 0 && <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, background:'#f3f4f6', color:'#6b7280' }}>{classPending} pending</span>}
                    </div>
                  </div>
                  {isExpanded && (
                    <table>
                      <thead><tr><th>Name</th><th>Student ID</th><th>Gender</th><th>Status</th></tr></thead>
                      <tbody>
                        {classStudents.map(s => (
                          <tr key={s.id}>
                            <td style={{ fontWeight:500 }}>{s.name}</td>
                            <td style={{ fontFamily:'monospace', fontSize:13 }}>{s.student_id}</td>
                            <td>{s.gender}</td>
                            <td><span style={{ padding:'2px 8px', borderRadius:4, fontSize:12, background: s.at_risk === null ? '#f3f4f6' : s.at_risk ? '#fee2e2' : '#dcfce7', color: s.at_risk === null ? '#6b7280' : s.at_risk ? '#991b1b' : '#166534' }}>{s.at_risk === null ? 'Pending' : s.at_risk ? 'At Risk' : 'Safe'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })
          })()}
          {students.length > 10 && <p style={{ marginTop:12, color:'#64748b', fontSize:13 }}>Showing {students.length} students across {[...new Set(students.map(s => s.class_name || 'Unassigned'))].length} classes</p>}
        </div>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:16 }}>Teachers</h3>
              <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Create and manage teachers to handle student attendance.</p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/users')}>
              + Create Teacher
            </button>
          </div>
          <table>
            <thead><tr><th>Name</th><th>Username</th><th>Class</th><th>Status</th></tr></thead>
            <tbody>
              {teachers.length === 0 && <tr><td colSpan={4} style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>No teachers created yet</td></tr>}
              {teachers.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight:500 }}>{t.first_name} {t.last_name}</td>
                  <td style={{ fontFamily:'monospace', fontSize:13 }}>{t.username}</td>
                  <td>{t.assigned_class?.name || 'Unassigned'}</td>
                  <td><StatusBadge active={t.is_active} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // TEACHER DASHBOARD
  if (data?.type === 'teacher') {
    const summary = data.summary || {}
    const students = data.students || []
    const classInfo = data.classInfo || { name: students[0]?.class_name || 'No Class' }
    const totalStudents = students.length
    const totalRecorded = summary.total_recorded ?? students.filter(s => s.at_risk !== null).length
    const totalRisk = summary.at_risk_count ?? students.filter(s => s.at_risk === true).length
    const totalSafe = summary.safe_count ?? students.filter(s => s.at_risk === false).length
    const totalPending = totalStudents - totalRecorded
    const genderCounts = summary.gender_counts || {
      Male: 0,
      Female: 0,
      Unknown: 0
    }
    const riskChartData = [
      { name: 'At Risk', value: totalRisk },
      { name: 'Safe', value: totalSafe },
      { name: 'Pending', value: totalPending }
    ]
    const progress = totalStudents ? Math.round((totalRecorded / totalStudents) * 100) : 0
    const recordMap = new Map((summary.records || []).map(r => [r.student?.id, r]))

    return (
      <div>
        <Header today={today} title={`My Class Dashboard`} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, color:'#2563eb', fontWeight:600 }}>
            <span style={{ padding:'6px 12px', borderRadius:20, background:'#e0f2fe' }}>{classInfo.name || 'No Class'}</span>
            <span style={{ padding:'6px 12px', borderRadius:20, background:'#fef3c7', color:'#92400e' }}>{totalPending} pending today</span>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button className="btn btn-secondary" onClick={loadData} style={{ minWidth: 120 }}>
              Refresh
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/reports')} style={{ minWidth: 140 }}>
              View Reports
            </button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
          <KpiCard label="My Students" value={totalStudents} color="#2563eb" />
          <KpiCard label="Recorded Today" value={totalRecorded} color="#4f46e5" />
          <KpiCard label="At Risk" value={totalRisk} color="#dc2626" />
          <KpiCard label="Safe" value={totalSafe} color="#16a34a" />
        </div>
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:16, marginBottom:16 }}>Attendance count</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskChartData} margin={{ top: 10, right: 18, bottom: 5, left: 0 }}>
              <XAxis dataKey="name" tick={{fontSize:12}} />
              <YAxis tick={{fontSize:12}} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:24 }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div>
                <h3 style={{ fontSize:16, marginBottom:4 }}>Today's progress</h3>
                <p style={{ color:'#64748b', fontSize:13 }}>Daily attendance completed for your assigned class</p>
              </div>
              <div style={{ fontSize:20, fontWeight:700, color:'#2563eb' }}>{progress}%</div>
            </div>
            <div style={{ height: 10, background:'#e2e8f0', borderRadius:999, overflow:'hidden', marginBottom:12 }}>
              <div style={{ width:`${progress}%`, height:'100%', background:'#2563eb' }} />
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <span style={{ display:'inline-flex', gap:8, alignItems:'center', padding:'6px 12px', borderRadius:999, background:'#dcfce7', color:'#166534' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#16a34a' }} />
                {totalRecorded} completed
              </span>
              <span style={{ display:'inline-flex', gap:8, alignItems:'center', padding:'6px 12px', borderRadius:999, background:'#fef3c7', color:'#92400e' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b' }} />
                {totalPending} not recorded
              </span>
            </div>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize:16, marginBottom:16 }}>Risk distribution</h3>
            <div style={{ display:'grid', gap:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>At Risk</span>
                <span>{totalRisk}</span>
              </div>
              <div style={{ width:'100%', height:10, background:'#fee2e2', borderRadius:999 }}>
                <div style={{ width: totalStudents ? `${Math.round((totalRisk/totalStudents)*100)}%` : '0%', height:'100%', background:'#dc2626' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>Safe</span>
                <span>{totalSafe}</span>
              </div>
              <div style={{ width:'100%', height:10, background:'#dcfce7', borderRadius:999 }}>
                <div style={{ width: totalStudents ? `${Math.round((totalSafe/totalStudents)*100)}%` : '0%', height:'100%', background:'#16a34a' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>Pending</span>
                <span>{totalPending}</span>
              </div>
              <div style={{ width:'100%', height:10, background:'#fef3c7', borderRadius:999 }}>
                <div style={{ width: totalStudents ? `${Math.round((totalPending/totalStudents)*100)}%` : '0%', height:'100%', background:'#f59e0b' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:16 }}>Students</h3>
              <p style={{ color:'#64748b', fontSize:13 }}>Fill or update today's dropout-risk attendance.</p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ padding:'4px 10px', borderRadius:8, fontSize:12, fontWeight:600, background: new Date().getDay() === 0 || new Date().getDay() === 6 ? '#fee2e2' : '#dcfce7', color: new Date().getDay() === 0 || new Date().getDay() === 6 ? '#991b1b' : '#166534' }}>
                {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]}
              </span>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/students/all/form')}
                disabled={false}
              >
                {totalRecorded > 0 ? 'Edit Attendance' : 'Start Attendance'}
              </button>
            </div>
          </div>
          <table>
            <thead><tr><th>Student</th><th>Guardian</th><th>Village</th><th>Status</th></tr></thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>No students found</td></tr>
              ) : students.map(s => {
                const record = recordMap.get(s.id)
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight:500 }}>
                      {s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim()}
                      <div style={{ fontFamily:'monospace', fontSize:12, color:'#64748b' }}>{s.student_id}</div>
                    </td>
                    <td>{s.guardian || '—'}</td>
                    <td>{s.village || '—'}</td>
                    <td>{record ? 'Submitted' : 'Not recorded'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // DEFAULT
  return (() => {
    const summary = data?.summary || {}
    const pieData = [
      { name:'At Risk', value: summary.at_risk_count || 0 },
      { name:'Safe',    value: summary.safe_count    || 0 }
    ]
    return (
      <div>
        <Header today={today} title="School Dashboard" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:16, marginBottom:24 }}>
          <KpiCard label="Students" value={summary.total_students || 0} color="#4f46e5" />
          <KpiCard label="Male" value={summary.gender_counts?.Male || 0} color="#0891b2" />
          <KpiCard label="Female" value={summary.gender_counts?.Female || 0} color="#be185d" />
          <KpiCard label="Recorded Today" value={summary.total_recorded    || 0} color="#2563eb" />
          <KpiCard label="At Risk"        value={summary.at_risk_count     || 0} color="#dc2626" />
          <KpiCard label="Safe"           value={summary.safe_count        || 0} color="#16a34a" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:24 }}>
          <div className="card">
            <h3 style={{ marginBottom:16, fontSize:15 }}>Risk by Performance Level</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={summary.performance_summary || []}>
                <XAxis dataKey="name" tick={{fontSize:12}} /><YAxis tick={{fontSize:12}} />
                <Tooltip /><Bar dataKey="at_risk" fill="#dc2626" radius={[4,4,0,0]} name="At Risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <h3 style={{ marginBottom:16, fontSize:15, alignSelf:'flex-start' }}>Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({name,value})=>`${name}: ${value}`} labelLine={false} fontSize={11}>
                  {pieData.map((_,i)=><Cell key={i} fill={COLORS[i]} />)}
                </Pie><Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:16 }}>Student Records - Today</h3>
          <table>
            <thead><tr><th>Student</th><th>Student ID</th><th>Performance</th><th>Year</th><th>Status</th></tr></thead>
            <tbody>
              {(summary.records||[]).length===0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>No records today</td></tr>
              )}
              {(summary.records||[]).map(r=>(
                <tr key={r.id}>
                  <td style={{ fontWeight:500 }}>{r.student?.name || '-'}</td>
                  <td style={{ fontFamily:'monospace', fontSize:13 }}>{r.student_id}</td>
                  <td>{r.performance}</td><td>{r.year_of_study}</td>
                  <td><span className={r.at_risk?'badge-risk':'badge-safe'}>{r.at_risk?'At Risk':'Safe'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15 }}>{ROLE_LABEL[user.role]}</h3>
            <button className="btn btn-primary" style={{ fontSize:13 }} onClick={() => navigate('/users')}>
              Manage {ROLE_LABEL[user.role]}
            </button>
          </div>
          <table>
            <thead><tr><th>Name</th><th>Username</th><th>School</th><th>Status</th></tr></thead>
            <tbody>
              {data.users.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>No headmasters created yet</td></tr>
              )}
              {data.users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight:500 }}>{u.first_name} {u.last_name}</td>
                  <td style={{ fontFamily:'monospace', fontSize:13 }}>{u.username}</td>
                  <td>{u.school?.name || 'Unassigned'}</td>
                  <td><StatusBadge active={u.is_active} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  })()

  return null
}
