import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, Download, X } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

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

export default function RiskFrequency() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentFactors, setStudentFactors] = useState(null)
  const [factorsLoading, setFactorsLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/attendance/risk-frequency')
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadStudentFactors = async (student) => {
    setSelectedStudent(student)
    setFactorsLoading(true)
    setStudentFactors(null)
    try {
      const res = await api.get(`/attendance/student/${student.student_id}/risk-factors`)
      setStudentFactors(res.data)
    } catch (err) {
      console.error(err)
      setStudentFactors(null)
    } finally {
      setFactorsLoading(false)
    }
  }

  const downloadCSV = () => {
    const headers = ['#', 'Student Name', 'Student ID', 'Class', 'School', 'At Risk', 'At Risk Count', 'Not Attended Count', 'Attendance Made Count']
    const rows = filtered.map((s, i) => [
      i + 1,
      s.name,
      s.student_code,
      s.class_name,
      s.school_name,
      (s.total_at_risk || 0) > 0 ? 'Yes' : 'No',
      s.at_risk_count || 0,
      s.not_attended_count || 0,
      s.attendance_made_count || 0
    ])
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `risk_frequency_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filtered = data.filter(s => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return s.name?.toLowerCase().includes(term) ||
             s.student_code?.toLowerCase().includes(term) ||
             s.class_name?.toLowerCase().includes(term) ||
             s.school_name?.toLowerCase().includes(term)
    }
    return true
  })

  const totalNotAttended = data.reduce((s, r) => s + (r.not_attended_count || 0), 0)
  const totalAtRisk = data.reduce((s, r) => s + (r.at_risk_count || 0), 0)
  const attendanceMadeCount = data[0]?.attendance_made_count || 0


  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'#64748b' }}>
      Loading risk frequency data...
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700 }}>Attendance Frequency</h1>
        <p style={{ color:'#64748b', marginTop:4 }}>
          How often students appeared at risk, with the total times they did not attend.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        <div className="card" style={{ textAlign:'center' }}>
          <div style={{ fontSize:32, fontWeight:700, color:'#4f46e5' }}>{data.length}</div>
          <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Total Students</div>
        </div>
        <div className="card" style={{ textAlign:'center' }}>
          <div style={{ fontSize:32, fontWeight:700, color:'#dc2626' }}>{totalAtRisk}</div>
          <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Total At Risk</div>
        </div>
        <div className="card" style={{ textAlign:'center' }}>
          <div style={{ fontSize:32, fontWeight:700, color:'#2563eb' }}>{totalNotAttended}</div>
          <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Total Not Attended</div>
        </div>
      </div>


      {/* Filters */}
      <div className="card" style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <span style={{ color:'#64748b', fontSize:13 }}>Showing all students with risk and attendance frequency</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input
              type="text"
              placeholder="Search student, class, school..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding:'8px 14px', borderRadius:6, border:'1px solid #e2e8f0',
                fontSize:13, maxWidth:240, width:'100%', outline:'none'
              }}
            />
            <button
              className="btn btn-primary"
              style={{ fontSize:13, padding:'8px 14px', display:'flex', alignItems:'center', gap:6 }}
              onClick={downloadCSV}
            >
              <Download size={14} /> Download CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, fontWeight:600, color:'#475569' }}>#</th>
                <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, fontWeight:600, color:'#475569' }}>Student Name</th>
                <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, fontWeight:600, color:'#475569' }}>Student ID</th>
                <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, fontWeight:600, color:'#475569' }}>Class</th>
                {user?.role === 'sector_leader' && (
                  <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, fontWeight:600, color:'#475569' }}>School</th>
                )}
                <th style={{ padding:'10px 12px', textAlign:'center', fontSize:13, fontWeight:600, color:'#475569' }}>At Risk Count</th>
                <th style={{ padding:'10px 12px', textAlign:'center', fontSize:13, fontWeight:600, color:'#475569' }}>Not attended count</th>

                <th style={{ padding:'10px 12px', textAlign:'center', fontSize:13, fontWeight:600, color:'#475569' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'sector_leader' ? 8 : 7} style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>
                    No students found
                  </td>
                </tr>
              )}
              {filtered.map((s, i) => (
                <tr key={s.student_id}
                  style={{ borderBottom:'1px solid #f1f5f9', background: (s.total_at_risk || 0) >= 3 ? '#fef2f2' : (s.total_at_risk || 0) >= 1 ? '#fff7ed' : undefined, cursor:'pointer' }}
                  onClick={() => loadStudentFactors(s)}>
                  <td style={{ padding:'10px 12px', fontSize:13, color:'#64748b' }}>{i + 1}</td>
                  <td style={{ padding:'10px 12px', fontWeight:500, fontSize:13 }}>{s.name}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'monospace', fontSize:13, color:'#64748b' }}>{s.student_code}</td>
                  <td style={{ padding:'10px 12px', fontSize:13 }}>
                    <span style={{ padding:'2px 8px', borderRadius:4, fontSize:12, background:'#e0f2fe', color:'#1e40af', fontWeight:600 }}>{s.class_name}</span>
                  </td>
                  {user?.role === 'sector_leader' && (
                    <td style={{ padding:'10px 12px', fontSize:13, color:'#64748b' }}>{s.school_name}</td>
                  )}
                  <td style={{ padding:'10px 12px', textAlign:'center' }}>
                    <span style={{ padding:'3px 10px', borderRadius:12, fontSize:13, fontWeight:700, background:'#fef2f2', color:'#dc2626' }}>{s.at_risk_count || 0}</span>
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'center' }}>
                    <span style={{ padding:'3px 10px', borderRadius:12, fontSize:13, fontWeight:700, background:'#e0f2fe', color:'#1e40af' }}>{s.not_attended_count || 0}</span>
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'center' }}>
                    <button className="btn btn-secondary" style={{ fontSize:11, padding:'4px 10px' }}
                      onClick={(e) => { e.stopPropagation(); loadStudentFactors(s) }}>
                      View Factors
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <p style={{ marginTop:12, color:'#64748b', fontSize:13 }}>
            Showing {filtered.length} student{filtered.length !== 1 ? 's' : ''} - click a row to view risk factors
          </p>
        )}
      </div>

      {/* Student Factors Modal */}
      {selectedStudent && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(15,23,42,0.72)', zIndex:500,
          display:'flex', alignItems:'center', justifyContent:'center'
        }}
        onClick={() => { setSelectedStudent(null); setStudentFactors(null) }}
        >
          <div className="card" style={{ maxWidth: 640, width: 'calc(100% - 32px)', maxHeight:'80vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div>
                <h2 style={{ fontSize:18, fontWeight:700 }}>{selectedStudent.name}</h2>
                <p style={{ color:'#64748b', fontSize:13, marginTop:2 }}>
                  {selectedStudent.class_name} {user?.role === 'sector_leader' ? `| ${selectedStudent.school_name}` : ''} | ID: {selectedStudent.student_code}
                </p>
              </div>
              <button style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}
                onClick={() => { setSelectedStudent(null); setStudentFactors(null) }}>
                <X size={20} />
              </button>
            </div>

            {/* Summary badges */}
            <div style={{ display:'flex', gap:12, marginBottom:20 }}>
              <div style={{ padding:'8px 16px', borderRadius:8, background:'#fef2f2', border:'1px solid #fecaca' }}>
                <div style={{ fontSize:20, fontWeight:700, color:'#dc2626' }}>{selectedStudent.total_at_risk || 0}</div>
                <div style={{ fontSize:11, color:'#991b1b' }}>At Risk</div>
              </div>
              <div style={{ padding:'8px 16px', borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                <div style={{ fontSize:20, fontWeight:700, color:'#2563eb' }}>{selectedStudent.not_attended_count || 0}</div>
                <div style={{ fontSize:11, color:'#1e40af' }}>Not Attended</div>
              </div>
            </div>

            {factorsLoading && (
              <div style={{ textAlign:'center', padding:24, color:'#64748b' }}>Loading risk factors...</div>
            )}

            {studentFactors && !factorsLoading && (
              <div>
                {/* Aggregated risk factors */}
                {studentFactors.factor_counts && studentFactors.factor_counts.length > 0 && (
                  <div style={{ marginBottom:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:10, color:'#1e293b' }}>Risk Factors Summary</h3>
                    <p style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>How many times each risk factor was recorded across all at-risk records.</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {studentFactors.factor_counts.map(([key, count]) => (
                          <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#f8fafc', borderRadius:6, borderLeft:'3px solid #dc2626' }}>
                            <span style={{ fontSize:13, fontWeight:500 }}>{FACTOR_LABELS[key] || key}</span>
                            <span style={{ fontSize:13, fontWeight:700, color:'#dc2626' }}>{count}x</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {studentFactors.factor_counts && studentFactors.factor_counts.length === 0 && (
                  <div style={{ marginBottom:20 }}>
                    <p style={{ color:'#94a3b8', fontSize:13, textAlign:'center', padding:16, background:'#f8fafc', borderRadius:8 }}>No specific risk factors recorded for this student</p>
                  </div>
                )}

                {/* Individual records */}
                {studentFactors.at_risk_records && studentFactors.at_risk_records.length > 0 && (
                  <div>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:10, color:'#1e293b' }}>At-Risk Records ({studentFactors.at_risk_records.length} total)</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {studentFactors.at_risk_records.map((rec, idx) => {
                        const activeFactors = (rec.factors || []).map(f => FACTOR_LABELS[f] || f)
                        return (
                          <div key={idx} style={{ padding:'10px 14px', background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                              <span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{rec.date}</span>
                              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                                <span style={{ padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:600,
                                  background: '#fee2e2',
                                  color: '#dc2626'
                                }}>AT RISK</span>
                              </div>
                            </div>
                            {rec.performance && (
                              <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>Performance: {rec.performance}</div>
                            )}
                            {activeFactors.length > 0 && (
                              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                                {activeFactors.map(f => (
                                  <span key={f} style={{ padding:'2px 6px', borderRadius:4, fontSize:11, background:'#fee2e2', color:'#991b1b', fontWeight:500 }}>{f}</span>
                                ))}
                              </div>
                            )}
                            {activeFactors.length === 0 && (
                              <span style={{ fontSize:11, color:'#94a3b8' }}>No specific factors recorded</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {studentFactors.at_risk_records && studentFactors.at_risk_records.length === 0 && (
                  <p style={{ color:'#94a3b8', textAlign:'center', padding:24 }}>No at-risk records found for this student</p>
                )}
              </div>
            )}

            {!factorsLoading && !studentFactors && (
              <p style={{ color:'#94a3b8', textAlign:'center', padding:24 }}>Could not load risk factors</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
