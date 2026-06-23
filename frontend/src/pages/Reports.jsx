import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Reports() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [filters, setFilters] = useState({ school: 'all', class_id: 'all', month: 'all', year: 'all' })
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    loadReports()
  }, [filters.class_id])

  const loadReports = async () => {
    try {
      if (user.school_id) {
        if (user.role === 'dos' || user.role === 'headmaster') {
          const classesRes = await api.get(`/schools/${user.school_id}/classes`)
          setClasses(classesRes.data)
        }
        const params = filters.class_id === 'all' ? {} : { class_id: filters.class_id }
        const res = await api.get(`/reports/school/${user.school_id}`, { params })
        setReports(res.data.map(r => ({
          ...r,
          school_id: user.school_id,
          school_name: user.school?.name
        })))
      } else if (user.role === 'sector_leader') {
        const schoolsRes = await api.get('/schools/')
        setSchools(schoolsRes.data)
        const reportGroups = await Promise.all(
          schoolsRes.data.map(async school => {
            const res = await api.get(`/reports/school/${school.id}`)
            return res.data.map(r => ({
              ...r,
              school_id: school.id,
              school_name: school.name
            }))
          })
        )
        setReports(reportGroups.flat())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async (report) => {
    const key = `${report.school_id}-${report.date}`
    setDownloading(key)
    try {
      const downloadUrl = report.school_id === 'all'
        ? `/reports/sector/${user.id}/download`
        : `/reports/school/${report.school_id}/download`
      const params = { date: report.date }
      if (report.school_id !== 'all' && filters.class_id !== 'all') {
        params.class_id = filters.class_id
      }
      const res = await api.get(downloadUrl, {
        params,
        responseType: 'blob'
      })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `report_${report.school_name || report.school_id}_${report.date}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error downloading report')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <div>Loading reports...</div>

  const years = [...new Set(reports.map(r => new Date(r.date).getFullYear()))].sort((a,b) => b - a)
  const displayReports = user.role === 'sector_leader' && filters.school === 'all'
    ? [...new Set(reports.map(r => r.date))].sort((a, b) => b.localeCompare(a)).map(date => ({
        school_id: 'all',
        school_name: 'All schools',
        date
      }))
    : reports
  const filteredReports = displayReports.filter(r => {
    const d = new Date(r.date)
    return (filters.school === 'all' || String(r.school_id) === filters.school)
      && (filters.month === 'all' || String(d.getMonth() + 1) === filters.month)
      && (filters.year === 'all' || String(d.getFullYear()) === filters.year)
  })

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Reports</h1>

      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'end', marginBottom:20, flexWrap:'wrap' }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Daily reports are saved automatically. Download as PDF - reports cannot be deleted.
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {user.role === 'sector_leader' && (
              <div>
                <label>School</label>
                <select value={filters.school} onChange={e => setFilters(p => ({ ...p, school:e.target.value }))}>
                  <option value="all">All schools</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {(user.role === 'dos' || user.role === 'headmaster') && (
              <div>
                <label>Class</label>
                <select value={filters.class_id} onChange={e => setFilters(p => ({ ...p, class_id:e.target.value }))}>
                  <option value="all">All classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label>Month</label>
              <select value={filters.month} onChange={e => setFilters(p => ({ ...p, month:e.target.value }))}>
                <option value="all">All months</option>
                {Array.from({ length:12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2024, i, 1).toLocaleString('en', { month:'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Year</label>
              <select value={filters.year} onChange={e => setFilters(p => ({ ...p, year:e.target.value }))}>
                <option value="all">All years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>School</th>
              <th>Date</th>
              <th>Details</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                No reports available yet
              </td></tr>
            )}
            {filteredReports.map((r, i) => {
              const key = `${r.school_id}-${r.date}`
              return (
                <tr key={key}>
                  <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                  <td>{r.school_name || '-'}</td>
                  <td style={{ fontWeight: 500 }}>
                    {new Date(r.date).toLocaleDateString('en-GB', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </td>
                  <td>
                    {r.school_id === 'all' ? (
                      <span style={{ color: '#64748b', fontSize: 13 }}>Combined report</span>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 16px', fontSize: 13 }}
                        onClick={() => navigate(`/reports/school/${r.school_id}?date=${r.date}${filters.class_id !== 'all' ? `&class_id=${filters.class_id}` : ''}`)}
                      >
                        View Details
                      </button>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 16px', fontSize: 13 }}
                      onClick={() => downloadPDF(r)}
                      disabled={downloading === key}
                    >
                      {downloading === key ? 'Downloading...' : 'Download PDF'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
