import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'

// ── Dropdown options (match notebook encoding exactly) ───────────────────────
const OPTIONS = {
  gender:          ['Male', 'Female'],
  performance:     ['0-40', '41-50', '51-60', '61-70', '71-100'],
  social_activity: ['None', 'Dance', 'Sport', 'Other'],
  attended:        ['Attended', 'Not attended'],
  yes_no:          ['No', 'Yes'],
}

const BINARY_FIELDS = [
  { key: 'lack_of_school_material', label: '2. Lack of School Material' },
  { key: 'lack_of_school_fees',     label: '3. Lack of School Fees' },
  { key: 'family_conflicts',        label: '4. Family Conflicts' },
  { key: 'drug_abuse',              label: '5. Drug Abuse' },
  // Predictor/DB feature is lack_of_motivation; UI label is "family support" per requirement
  { key: 'lack_of_motivation',      label: '6. Family Support' },
  { key: 'illness',                 label: '7. Illness' },
  { key: 'absenteeism',             label: '8. Absenteism' },
  { key: 'bad_discipline',          label: '9. Bad Discipline' },
]


const DEFAULT_FORM = {
  gender:                  'Male',
  performance:             '51-60',
  social_activity:         'None',
  lack_of_school_material: 0,
  lack_of_school_fees:     0,
  family_conflicts:        0,
  drug_abuse:              0,
  lack_of_motivation:      0,
  illness:                 0,
  // ML feature: many-days absence.
  absenteeism:             0,
  bad_discipline:          0,

  // UI-only flags for today's attendance buttons.
  // Default: neither Attended nor Not attended is selected.
  // (null => both buttons unselected)
  _today_attended:         null,


}


const getTodayAttendedValue = record => {
  if (!record?.is_today) return false
  if (typeof record.today_attended === 'boolean') return record.today_attended
  return record.absenteeism === 0
}



// Error boundary to catch render/runtime errors and show a helpful message
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('StudentForm runtime error', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <h2 style={{ color: '#991b1b' }}>An error occurred loading the attendance page</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#475569' }}>{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

function StudentFormInner() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [student,      setStudent]      = useState(null)
  const [students,     setStudents]     = useState([])
  const [form,         setForm]         = useState(DEFAULT_FORM)
  const [forms,        setForms]        = useState({})
  const [prediction,   setPrediction]   = useState(null)
  const [predictions,  setPredictions]  = useState({})
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [savingIds,    setSavingIds]    = useState([])
  const [isUpdate,     setIsUpdate]     = useState(false)
  const [prefillDate,  setPrefillDate]  = useState(null)
  const [error,        setError]        = useState(null)
  const [batchSaving, setBatchSaving] = useState(false)
  const [allSubmitted, setAllSubmitted] = useState(false)


  useEffect(() => {
    loadStudentAndForm()
  }, [id])

  const loadStudentAndForm = async () => {
    setLoading(true)
    setError(null)
    setPrediction(null)
    setPredictions({})
    setForm(DEFAULT_FORM)
    setForms({})
    setIsUpdate(false)
    setPrefillDate(null)
    setStudents([])
    setStudent(null)

    try {
      if (id === 'all') {
        const sRes = await api.get('/students/')
        const studentList = sRes.data
        setStudents(studentList)

        const attendanceResults = await Promise.all(studentList.map(async student => {
          try {
            const aRes = await api.get(`/attendance/student/${student.id}`)
            return { id: student.id, data: aRes.data }
          } catch {
            return { id: student.id, data: null }
          }
        }))

        const formMap = {}

        const predictionMap = {}

        attendanceResults.forEach(record => {
          if (record.data) {
            formMap[record.id] = {
              gender:                  record.data.gender                  ?? DEFAULT_FORM.gender,
              performance:             record.data.performance             ?? DEFAULT_FORM.performance,
              social_activity:         record.data.social_activity         ?? DEFAULT_FORM.social_activity,
              lack_of_school_material: record.data.lack_of_school_material ?? 0,
              lack_of_school_fees:     record.data.lack_of_school_fees     ?? 0,
              family_conflicts:        record.data.family_conflicts        ?? 0,
              drug_abuse:              record.data.drug_abuse              ?? 0,
              lack_of_motivation:      record.data.lack_of_motivation      ?? 0,
              illness:                 record.data.illness                 ?? 0,
              absenteeism:             record.data.absenteeism             ?? 0,
              bad_discipline:          record.data.bad_discipline          ?? 0,
              // If record exists for today, we treat it as today attendance already saved.
              _today_attended: getTodayAttendedValue(record.data),
            }


            if (record.data.is_today) {
              predictionMap[record.id] = {
                at_risk: record.data.at_risk,
              }
            }
          } else {
            formMap[record.id] = { ...DEFAULT_FORM }
          }
        })

        setForms(formMap)
        setPredictions(predictionMap)
      } else {
        const sRes = await api.get(`/students/${id}`)
        setStudent(sRes.data)

        const aRes = await api.get(`/attendance/student/${id}`)
        if (aRes.data) {
          setIsUpdate(Boolean(aRes.data.is_today))
          setPrefillDate(aRes.data.is_today ? null : aRes.data.prefill_source_date)
          setForm({
            gender:                  aRes.data.gender                  ?? DEFAULT_FORM.gender,
            performance:             aRes.data.performance             ?? DEFAULT_FORM.performance,
            social_activity:         aRes.data.social_activity         ?? DEFAULT_FORM.social_activity,
            lack_of_school_material: aRes.data.lack_of_school_material ?? 0,
            lack_of_school_fees:     aRes.data.lack_of_school_fees     ?? 0,
            family_conflicts:        aRes.data.family_conflicts        ?? 0,
            drug_abuse:              aRes.data.drug_abuse              ?? 0,
            lack_of_motivation:      aRes.data.lack_of_motivation      ?? 0,
            illness:                 aRes.data.illness                 ?? 0,
            absenteeism:             aRes.data.absenteeism             ?? 0,
            bad_discipline:          aRes.data.bad_discipline          ?? 0,
            // If aRes.data.is_today exists, we already have today's saved record.
            // We set today-attended = true only when absenteeism feature says 0.
            _today_attended:         getTodayAttendedValue(aRes.data),
          })

          if (aRes.data.is_today) {
            setPrediction({
              at_risk: aRes.data.at_risk,
            })
          }
        }
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || err.message || 'Unable to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (studentId, key, opts, value) => {
    let fieldValue
    if (opts === OPTIONS.yes_no) fieldValue = (value === 'Yes' ? 1 : 0)
    else if (opts === OPTIONS.attended) fieldValue = (value === 'Not attended' ? 1 : 0)
    else fieldValue = value

    if (id === 'all') {
      setForms(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [key]: fieldValue,
        }
      }))
    } else {
      setForm(prev => ({ ...prev, [key]: fieldValue }))
    }
  }


  const handleSubmit = async (studentId = id, overrides = {}) => {
    if (id === 'all') {
      setSavingIds(prev => [...prev, studentId])
      setPredictions(prev => ({ ...prev, [studentId]: null }))
    } else {
      setSaving(true)
      setPrediction(null)
    }

    try {
      const basePayload = id === 'all' ? forms[studentId] : form
      if (!basePayload) {
        throw new Error('Attendance payload is missing for this student')
      }
      const payload = { ...basePayload, ...overrides, _attendance_marked: true }

      const res = await api.post(`/attendance/student/${studentId}`, payload)

      if (id === 'all') {
        setForms(prev => ({
          ...prev,
          [studentId]: payload
        }))
        setPredictions(prev => ({ ...prev, [studentId]: res.data.prediction }))
      } else {
        setForm(payload)
        setPrediction(res.data.prediction)
        setIsUpdate(true)
        setPrefillDate(null)
      }
    } catch (err) {
      alert('Error saving: ' + (err.response?.data?.error || err.message))
    } finally {
      if (id === 'all') {
        setSavingIds(prev => prev.filter(x => x !== studentId))
      } else {
        setSaving(false)
      }
    }
  }

  // Attendance is represented by absenteeism in the ML input.
  // Requirement says only these fields should be on the UI; so we keep the attendance buttons.
  const handleAttendanceSubmit = (studentId, attended) => {
    if (!attended && form._today_attended !== true) {
      if (typeof form._today_attended !== 'boolean') {
        alert('Please select attendance for all students before submitting')
        return
      }
    }
    // Attended/Not attended are today attendance buttons.
    // They MUST NOT overwrite the ML feature `absenteeism` (many-days absence).
    handleSubmit(studentId, {
      _today_attended: attended,
      // Keep ML feature as-is (absenteeism is set only by the Absenteism dropdown)
      _attendance_marked: true,
    })
  }




  if (loading) return <div>Loading...</div>

  const SelectField = ({ label, value, onChange, opts }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 0 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ height: 36, padding: '6px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #cbd5e1' }}
      >
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  const renderAttendanceCard = studentData => {
    const currentForm = id === 'all' ? (forms[studentData.id] ?? DEFAULT_FORM) : form
    const currentPrediction = id === 'all' ? predictions[studentData.id] : prediction
    const currentSaving = id === 'all' ? savingIds.includes(studentData.id) : saving
    const studentName = studentData?.name ?? student?.name
    // Attended/Not attended are submission buttons (today attendance).
    // Highlighting must NOT depend on ML feature `absenteeism`.
    const attendedSelected = currentForm._today_attended === true
    const notAttendedSelected = currentForm._today_attended === false



    return (
      <div key={studentData.id} className="card" style={{ width: '100%', marginBottom: 28, padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{studentName}</h2>
          <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
            Guardian: {studentData?.guardian || student?.guardian} | Village: {studentData?.village || student?.village}
          </div>
        </div>

        {currentPrediction && (
          <div style={{
            padding: '12px 14px', borderRadius: 10, marginBottom: 16,
            background: currentPrediction.at_risk ? '#fee2e2' : '#dcfce7',
            border: `1px solid ${currentPrediction.at_risk ? '#fca5a5' : '#86efac'}`
          }}>
            <strong style={{ color: currentPrediction.at_risk ? '#991b1b' : '#166534' }}>
              {currentPrediction.at_risk ? 'AT RISK OF DROPPING OUT' : 'NOT AT RISK'}
            </strong>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px 16px' }}>
          <SelectField
            label="1. Gender"
            opts={OPTIONS.gender}
            value={currentForm.gender}
            onChange={value => handleSelect(studentData.id, 'gender', OPTIONS.gender, value)}
          />

          <SelectField
            label="Performance"
            opts={OPTIONS.performance}
            value={currentForm.performance}
            onChange={value => handleSelect(studentData.id, 'performance', OPTIONS.performance, value)}
          />

          <SelectField
            label="Social_activity"
            opts={OPTIONS.social_activity}
            value={currentForm.social_activity}
            onChange={value => handleSelect(studentData.id, 'social_activity', OPTIONS.social_activity, value)}
          />



          {BINARY_FIELDS.map(field => (
            <SelectField
              key={field.key}
              label={field.label}
              opts={OPTIONS.yes_no}
              value={field.key === 'absenteeism'
                ? (currentForm.absenteeism ? 'Yes' : 'No')
                : (currentForm[field.key] ? 'Yes' : 'No')}

              onChange={value => {
              if (field.key === 'absenteeism') {
                // Absenteism dropdown is independent from Attended/Not attended buttons.
                // Yes => absent for many days (absenteeism=1), No => absenteeism=0
                const yes = value === 'Yes'
                const absenteeismValue = yes ? 1 : 0

                if (id === 'all') {
                  setForms(prev => ({
                    ...prev,
                    [studentData.id]: {
                      ...prev[studentData.id],
                      absenteeism: absenteeismValue,
                    }
                  }))
                } else {

                  setForm(prev => ({ ...prev, absenteeism: absenteeismValue, _attendance_marked: true }))
                }
                return
              }

              handleSelect(studentData.id, field.key, OPTIONS.yes_no, value)
            }}
          />
        ))}

          {/* Attendance buttons are still provided, but UI fields remain limited to allowed keys. */}

          <div style={{ display: 'none' }} />

        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            className="btn"
            disabled={currentSaving}
            onClick={() => handleAttendanceSubmit(studentData.id, true)}
            style={{
              minWidth: 116,
              height: 34,
              padding: '0 14px',
              backgroundColor: attendedSelected ? '#2563eb' : '#e5e7eb',
              border: `1px solid ${attendedSelected ? '#2563eb' : '#cbd5e1'}`,
              color: attendedSelected ? '#ffffff' : '#334155',
              fontWeight: 700,
              borderRadius: 8,
              fontSize: 13
            }}
          >
            {currentSaving ? 'Saving...' : `${attendedSelected ? '✓ ' : ''}Attended`}
          </button>
          <button
            className="btn"
            disabled={currentSaving}
            onClick={() => handleAttendanceSubmit(studentData.id, false)}
            style={{
              minWidth: 132,
              height: 34,
              padding: '0 14px',
              backgroundColor: notAttendedSelected ? '#2563eb' : '#e5e7eb',
              border: `1px solid ${notAttendedSelected ? '#2563eb' : '#cbd5e1'}`,
              color: notAttendedSelected ? '#ffffff' : '#334155',
              fontWeight: 700,
              borderRadius: 8,
              fontSize: 13
            }}
          >
            {currentSaving ? 'Saving...' : `${notAttendedSelected ? '✓ ' : ''}Not attended`}
          </button>
        </div>
      </div>
    )
  }

  const handleSubmitAll = async () => {
    // Validate that every student has an explicit TODAY attendance selection
    // (Buttons must be independent of Absenteeism dropdown / ML feature)
    const missing = Object.keys(forms).filter(sid => typeof forms[sid]._today_attended !== 'boolean')

    if (missing.length > 0) {
      alert('Please select attendance for all students before submitting')
      return
    }


    if (!window.confirm('Submit attendance for all selected students now?')) return
    setBatchSaving(true)
    setAllSubmitted(false)

    try {
      const ids = Object.keys(forms)
      const promises = ids.map(async sid => {
        const payload = { ...forms[sid] }
        // Ensure absenteeism is present (0 = attended, 1 = not attended)
        payload.absenteeism = payload.absenteeism ? 1 : 0
        try {
          await api.post(`/attendance/student/${sid}`, payload)
        } catch (err) {
          console.error('Error submitting', sid, err)
        }
      })
      await Promise.all(promises)
      await loadStudentAndForm()
      setAllSubmitted(true)
      alert('Submitted attendances for all students')
      navigate('/')

    } finally {
      setBatchSaving(false)
    }

  }

  return (
    <div style={{ width: '100%', paddingRight: 20 }}>
      {error && (
        <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back</button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>
            {id === 'all' ? 'Attendance for All Students' : student?.name}
          </h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            {id === 'all'
              ? 'Submit attendance for each student using the cards below.'
              : <>Guardian: {student?.guardian} | Village: {student?.village}</>}
            {id !== 'all' && isUpdate && <span style={{ marginLeft: 8, color: '#d97706' }}>- Editing today's record</span>}
            {id !== 'all' && prefillDate && <span style={{ marginLeft: 8, color: '#d97706' }}>- Pre-filled from {prefillDate}</span>}
          </p>
        </div>
        {id === 'all' && (
          <div style={{ marginLeft: 'auto' }}>
            <button
              className="btn btn-primary"
              onClick={handleSubmitAll}
              disabled={batchSaving || allSubmitted}
              style={{ opacity: (batchSaving || allSubmitted) ? 0.75 : 1 }}
            >
              {batchSaving ? 'Submitting...' : (allSubmitted ? 'Attendance submitted' : 'Submit All Attendances')}
            </button>

          </div>
        )}
      </div>

      {id === 'all' ? (
        students.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            {/* Small-table styles (kept inline to avoid editing global CSS) */}
            {(() => {
              const thStyle = {
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 700,
                color: '#334155',
                padding: '8px 10px',
                borderBottom: '1px solid #e2e8f0',
                whiteSpace: 'nowrap',
              }
              const tdStyle = {
                padding: '6px 10px',
                borderBottom: '1px solid #f1f5f9',
                verticalAlign: 'top',
                whiteSpace: 'nowrap',
                fontSize: 12,
              }
              const selectStyle = {
                height: 30,
                padding: '4px 8px',
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
              }

              return (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Student</th>
                      <th style={thStyle}>Gender</th>
                      <th style={thStyle}>Performance</th>
                      <th style={thStyle}>Social Activity</th>
                      <th style={thStyle}>2. Lack of School Material</th>
                      <th style={thStyle}>3. Lack of School Fees</th>
                      <th style={thStyle}>4. Family Conflicts</th>
                      <th style={thStyle}>5. Drug Abuse</th>
                      <th style={thStyle}>6. lack of Family Support</th>
                      <th style={thStyle}>7. Illness</th>
                      <th style={thStyle}>8. Absenteism</th>
                      <th style={thStyle}>9. Bad Discipline</th>
                      <th style={thStyle}>Today Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(st => {
                      const sForm = forms[st.id] ?? DEFAULT_FORM
                      const attendedSelected = sForm._today_attended === true
                      const notAttendedSelected = sForm._today_attended === false
                      const currentSaving = savingIds.includes(st.id) || batchSaving

                      return (
                        <tr key={st.id}>
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{st.name}</div>
                            <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>ID: {st.student_id}</div>
                          </td>

                          <td style={tdStyle}>
                            <select
                              value={sForm.gender}
                              onChange={e => handleSelect(st.id, 'gender', OPTIONS.gender, e.target.value)}
                              style={{ ...selectStyle, width: 240, minWidth: 240 }}

                            >
                              {OPTIONS.gender.map(o => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          </td>

                          <td style={tdStyle}>
                            <select
                              value={sForm.performance}
                              onChange={e => handleSelect(st.id, 'performance', OPTIONS.performance, e.target.value)}
                              style={selectStyle}
                            >
                              {OPTIONS.performance.map(o => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          </td>

                          <td style={tdStyle}>
                            <select
                              value={sForm.social_activity}
                              onChange={e => handleSelect(st.id, 'social_activity', OPTIONS.social_activity, e.target.value)}
                              style={selectStyle}
                            >
                              {OPTIONS.social_activity.map(o => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          </td>

                          {BINARY_FIELDS.filter(f => f.key !== 'absenteeism').map(field => (
                            <td key={field.key} style={tdStyle}>
                              <select
                                value={sForm[field.key] ? 'Yes' : 'No'}
                                onChange={e => handleSelect(st.id, field.key, OPTIONS.yes_no, e.target.value)}
                                style={selectStyle}
                              >
                                {OPTIONS.yes_no.map(o => (
                                  <option key={o} value={o}>{o}</option>
                                ))}
                              </select>
                            </td>
                          ))}

                          <td style={tdStyle}>
                            <select
                              value={sForm.absenteeism ? 'Yes' : 'No'}
                              onChange={e => {
                                const yes = e.target.value === 'Yes'
                                const absenteeismValue = yes ? 1 : 0
                                setForms(prev => ({
                                  ...prev,
                                  [st.id]: {
                                    ...prev[st.id],
                                    absenteeism: absenteeismValue,
                                  },
                                }))
                              }}
                              style={selectStyle}
                            >
                              {OPTIONS.yes_no.map(o => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          </td>

                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setForms(prev => ({
                                    ...prev,
                                    [st.id]: {
                                      ...prev[st.id],
                                      _today_attended: true,
                                    },
                                  }))
                                }}
                                disabled={currentSaving}
                                style={{
                                  flex: '1 1 0',
                                  height: 28,
                                  padding: '0 8px',
                                  borderRadius: 8,
                                  border: `1px solid ${attendedSelected ? '#2563eb' : '#cbd5e1'}`,
                                  backgroundColor: attendedSelected ? '#2563eb' : '#ffffff',
                                  color: attendedSelected ? '#ffffff' : '#334155',
                                  fontWeight: 800,
                                  fontSize: 12,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Attended
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setForms(prev => ({
                                    ...prev,
                                    [st.id]: {
                                      ...prev[st.id],
                                      _today_attended: false,
                                    },
                                  }))
                                }}
                                disabled={currentSaving}
                                style={{
                                  flex: '1 1 0',
                                  height: 28,
                                  padding: '0 8px',
                                  borderRadius: 8,
                                  border: `1px solid ${notAttendedSelected ? '#2563eb' : '#cbd5e1'}`,
                                  backgroundColor: notAttendedSelected ? '#2563eb' : '#ffffff',
                                  color: notAttendedSelected ? '#ffffff' : '#334155',
                                  fontWeight: 800,
                                  fontSize: 12,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Not attended
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )
            })()}
          </div>
        ) : (
          <div style={{ padding: 24, borderRadius: 12, background: '#f8fafc', color: '#475569' }}>
            No students were found for your class. Please confirm your class assignment and try again.
          </div>
        )
      ) : (
        renderAttendanceCard(student)
      )}
    </div>
  )
}

export default function StudentForm() {
  return (
    <ErrorBoundary>
      <StudentFormInner />
    </ErrorBoundary>
  )
}
