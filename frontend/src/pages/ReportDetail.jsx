import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ArrowLeft, Download } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#dc2626', '#16a34a', '#f59e0b', '#2563eb', '#7c3aed', '#0891b2', '#be185d', '#ea580c']
const RISK_COLORS = { low: '#d97706', medium: '#ea580c', high: '#dc2626' }

const FACTOR_LABELS = {
  lack_of_school_material: 'Lack of School Material',
  lack_of_school_fees: 'Lack of School Fees',
  job_opportunity: 'Job Opportunity',
  pregnancy: 'Pregnancy',
  family_conflicts: 'Family Conflicts',
  drug_abuse: 'Drug Abuse',
  lack_of_motivation: 'Family Support',
  illness: 'Illness',
  absenteeism: 'Absenteism',
  bad_discipline: 'Bad Discipline',
  lack_of_motivation_display: 'Lack of Motivation',
}

const RISK_FACTOR_FIELDS = [
  'lack_of_school_material',
  'lack_of_school_fees',
  'family_conflicts',
  'drug_abuse',
  'lack_of_motivation',
  'illness',
  'absenteeism',
  'bad_discipline',
]

const getRiskFactorTags = attendance => {
  if (!attendance) return []
  return RISK_FACTOR_FIELDS
    .filter(field => Boolean(attendance[field]))
    .map(field => FACTOR_LABELS[field])
}

function KpiCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    'At Risk': { bg: '#fee2e2', color: '#991b1b' },
    'Safe': { bg: '#dcfce7', color: '#166534' },
    'Pending': { bg: '#f3f4f6', color: '#6b7280' }
  }
  const c = config[status] || config['Pending']
  return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>{status}</span>
}

export default function ReportDetail() {
  const { schoolId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const classIdParam = searchParams.get('class_id') || 'all'

  const [data, setData] = useState(null)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { loadDetail() }, [schoolId, dateParam, classIdParam])
  useEffect(() => { loadClasses() }, [schoolId, user?.role])

  const loadClasses = async () => {
    if (user?.role !== 'dos' && user?.role !== 'headmaster') return
    try {
      const res = await api.get(`/schools/${schoolId}/classes`)
      setClasses(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadDetail = async () => {
    setLoading(true)
    try {
      const params = { date: dateParam }
      if (classIdParam !== 'all') params.class_id = classIdParam
      const res = await api.get(`/reports/school/${schoolId}/detail`, { params })
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const params = { date: dateParam }
      if (classIdParam !== 'all') params.class_id = classIdParam
      const res = await api.get(`/reports/school/${schoolId}/download`, {
        params,
        responseType: 'blob'
      })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `report_${data?.school?.name || schoolId}_${dateParam}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Error downloading PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleClassChange = (classId) => {
    const next = { date: dateParam }
    if (classId !== 'all') next.class_id = classId
    setSearchParams(next)
  }

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading report details...</div>
  if (!data) return <div style={{ padding: 40, color: '#dc2626' }}>Failed to load report data</div>

  const { school, date, students, summary, class_name, is_teacher_view } = data
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // Filter students
  let filteredStudents = students
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filteredStudents = filteredStudents.filter(s =>
      s.student.name?.toLowerCase().includes(term) ||
      s.student.student_id?.toLowerCase().includes(term) ||
      s.student.guardian?.toLowerCase().includes(term) ||
      s.student.village?.toLowerCase().includes(term)
    )
  }

  // Chart data
  const riskPieData = [
    { name: 'At Risk', value: summary.at_risk_count },
    { name: 'Safe', value: summary.safe_count },
    { name: 'Pending', value: summary.pending_count }
  ].filter(d => d.value > 0)

  const genderPieData = Object.entries(summary.gender_counts || {})
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0)

  const performanceData = (summary.performance_summary || []).map(p => ({
    name: p.name, recorded: p.total, atRisk: p.at_risk, avgRisk: p.avg_risk
  }))

  const riskFactorData = Object.entries(summary.risk_factors || {})
    .map(([key, value]) => ({ name: FACTOR_LABELS[key] || key, value }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const socialData = Object.entries(summary.social_activities || {})
    .map(([name, value]) => ({ name, value }))

  const classData = Object.entries(summary.class_stats || {}).map(([name, stats]) => ({
    name, total: stats.total, atRisk: stats.at_risk, safe: stats.safe, pending: stats.pending
  }))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/reports')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{school.name}{is_teacher_view && class_name ? ` — ${class_name}` : ''} — Report</h1>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{formattedDate} · {school.sector}, {school.district}, {school.province}{is_teacher_view ? ` · Class: ${class_name || 'None'}` : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', gap: 10, flexWrap: 'wrap' }}>
          {(user?.role === 'dos' || user?.role === 'headmaster') && (
            <div>
              <label>Class</label>
              <select value={classIdParam} onChange={e => handleClassChange(e.target.value)}>
                <option value="all">All classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <button className="btn btn-primary" onClick={downloadPDF} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} /> {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Total Students" value={summary.total_students} color="#2563eb" />
        <KpiCard label="Recorded" value={summary.total_recorded} color="#4f46e5" />
        <KpiCard label="At Risk" value={summary.at_risk_count} color="#dc2626" />
        <KpiCard label="Safe" value={summary.safe_count} color="#16a34a" />
        <KpiCard label="Pending" value={summary.pending_count} color="#f59e0b" />
      </div>

      {/* Charts Row 1: Risk Distribution + Gender */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={riskPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={12}>
                {riskPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={genderPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={12}>
                <Cell fill="#0891b2" />
                <Cell fill="#be185d" />
                <Cell fill="#94a3b8" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Performance + Risk Factors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Risk by Performance Level</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={performanceData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="recorded" fill="#2563eb" radius={[4, 4, 0, 0]} name="Recorded" />
              <Bar dataKey="atRisk" fill="#dc2626" radius={[4, 4, 0, 0]} name="At Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Risk Factors</h3>
          {riskFactorData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No risk factors recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={riskFactorData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#ea580c" radius={[0, 4, 4, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 3: Class Stats + Social Activity */}
      <div style={{ display: classData.length > 0 && socialData.length > 0 ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 24 }}>
        {!is_teacher_view && classData.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Students by Class</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={classData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="safe" fill="#16a34a" radius={[4, 4, 0, 0]} name="Safe" stackId="a" />
                <Bar dataKey="atRisk" fill="#dc2626" radius={[4, 4, 0, 0]} name="At Risk" stackId="a" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {socialData.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Social Activities</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={socialData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                  {socialData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Student Detail Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16 }}>
              Student Details
            </h3>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
              Showing {filteredStudents.length} of {students.length} students
            </p>
          </div>
          <input
            type="text"
            placeholder="Search by name, ID, guardian, village..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, width: 280 }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Student</th>
                <th>ID</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Guardian</th>
                <th>Village</th>
                <th>Performance</th>
                <th>Risk Factors</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                  No students found
                </td></tr>
              )}
              {filteredStudents.map(s => {
                const st = s.student
                const a = s.attendance
                const factors = getRiskFactorTags(a)
                const status = !a ? 'Pending' : a.at_risk ? 'At Risk' : 'Safe'
                return (
                  <tr key={st.id} style={{ background: a?.at_risk ? '#fef2f2' : undefined }}>
                    <td style={{ fontWeight: 500 }}>{st.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{st.student_id}</td>
                    <td>{st.class_name || '—'}</td>
                    <td>{st.gender || a?.gender || '—'}</td>
                    <td>{st.guardian || '—'}</td>
                    <td>{st.village || '—'}</td>
                    <td>{a?.performance || '—'}</td>
                    <td style={{ maxWidth: 150 }}>
                      {factors.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {factors.map(f => (
                            <span key={f} style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, background: '#fef3c7', color: '#92400e' }}>{f}</span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td><StatusBadge status={status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Factors per At-Risk Student */}
      {(() => {
        const atRiskStudents = students.filter(s => s.attendance?.at_risk).map(s => {
          const a = s.attendance
          const st = s.student
          const factors = getRiskFactorTags(a)
          return { name: st.name, class_name: st.class_name || '-', factors }
        })

        if (atRiskStudents.length === 0) return null

        return (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Risk Factors per At-Risk Student</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
              {atRiskStudents.length} student{atRiskStudents.length !== 1 ? 's' : ''} at risk with their contributing factors
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Risk Factors</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudents.map((s, i) => (
                    <tr key={i}>
                      <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td>{s.class_name}</td>
                      <td style={{ maxWidth: 250 }}>
                        {s.factors.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {s.factors.map(f => (
                              <span key={f} style={{
                                padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                                background: '#fef3c7', color: '#92400e'
                              }}>{f}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>No specific factors</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
