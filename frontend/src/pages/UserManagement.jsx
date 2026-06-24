import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { LOCATION_DATA, getDistricts, getSectors, getVillages } from '../data/rwandaLocations'
import PasswordCriteria from '../components/PasswordCriteria'

const ROLE_LABEL = {
  superadmin: 'Sector Leaders',
  sector_leader: 'Headmasters',
  headmaster: 'DOS',
  dos: 'Class Teachers'
}

const CLASS_OPTIONS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P6A']

// Location data imported from ../data/rwandaLocations.js

const PROVINCES = Object.keys(LOCATION_DATA)

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '', username: '', password: '',
  province: '', district: '', sector: '', village: '', school_name: '', class_name: 'P1'
}

export default function UserManagement() {
  const { user }      = useAuth()
  const [users, setUsers]     = useState([])
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [csvClass, setCsvClass] = useState('P1')
  const [csvFile, setCsvFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedClass, setUploadedClass] = useState('')
  const [viewingTeacher, setViewingTeacher] = useState(null)
  const [teacherStudents, setTeacherStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [savingStudent, setSavingStudent] = useState(false)
  const [showReplaceList, setShowReplaceList] = useState(false)
  const [replaceFile, setReplaceFile] = useState(null)
  const [replacingList, setReplacingList] = useState(false)
  const [formError, setFormError] = useState('')

  const isPasswordStrong = (password) => {
    if (!password) return false
    return password.length >= 8
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /[0-9]/.test(password)
      && /[^A-Za-z0-9]/.test(password)
  }

  const [districts, setDistricts] = useState([])
  const [sectors, setSectors] = useState([])
  const [villages, setVillages] = useState([])
  const skipLocationReset = useRef(0)

  useEffect(() => {
    loadUsers()
    loadSchools()
    loadClasses()
  }, [])

  useEffect(() => {
    if (form.province) {
      setDistricts(getDistricts(form.province))
      if (skipLocationReset.current <= 0) {
        setForm(p => ({ ...p, district: '', sector: '', village: '' }))
      }
    } else {
      setDistricts([])
      if (skipLocationReset.current <= 0) {
        setForm(p => ({ ...p, district: '', sector: '', village: '' }))
      }
    }
    if (skipLocationReset.current > 0) skipLocationReset.current--
  }, [form.province])

  useEffect(() => {
    if (form.province && form.district) {
      setSectors(getSectors(form.province, form.district))
      if (skipLocationReset.current <= 0) {
        setForm(p => ({ ...p, sector: '', village: '' }))
      }
    } else {
      setSectors([])
      if (skipLocationReset.current <= 0) {
        setForm(p => ({ ...p, sector: '', village: '' }))
      }
    }
    if (skipLocationReset.current > 0) skipLocationReset.current--
  }, [form.province, form.district])

  useEffect(() => {
    if (form.province && form.district && form.sector) {
      setVillages(getVillages(form.province, form.district, form.sector))
      if (skipLocationReset.current <= 0) {
        setForm(p => ({ ...p, village: '' }))
      }
    } else {
      setVillages([])
      if (skipLocationReset.current <= 0) {
        setForm(p => ({ ...p, village: '' }))
      }
    }
    if (skipLocationReset.current > 0) skipLocationReset.current--
  }, [form.province, form.district, form.sector])

  const loadUsers = async () => {
    try {
      const res = await api.get('/users/')
      setUsers(res.data)
    } finally {
      setLoading(false)
    }
  }

  const loadSchools = async () => {
    try {
      const res = await api.get('/schools/')
      setSchools(res.data)
    } catch {}
  }

  const loadClasses = async () => {
    try {
      if (!user?.school_id) return
      const res = await api.get(`/schools/${user.school_id}/classes`)
      setClasses(res.data)
    } catch {}
  }

  const openCreate = () => {
    setEditUser(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setFormError('')
    // Pre-populate dropdown options before setting form values
    const province = u.province || ''
    const district = u.district || ''
    const sector = u.sector || ''
    const village = u.village || ''

    if (province) {
      setDistricts(getDistricts(province))
    }
    if (province && district) {
      setSectors(getSectors(province, district))
    }
    if (province && district && sector) {
      setVillages(getVillages(province, district, sector))
    }

    // Skip the useEffect resets for all three cascading dropdowns
    skipLocationReset.current = 3

    setForm({
      first_name: u.first_name || '',
      last_name:  u.last_name  || '',
      email:      u.email      || '',
      phone:      u.phone      || '',
      username:   u.username   || '',
      password:   '',
      province:   province,
      district:   district,
      sector:     sector,
      village:    village,
      school_name: u.school ? u.school.name : '',
      class_name: u.assigned_class?.name || 'P1'
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setFormError('')
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email || !emailRegex.test(form.email)) {
      setFormError('Please enter a valid email address.')
      return
    }
    // Validate phone (must be 10 digits starting with 07 if provided)
    if (form.phone) {
      const digitsOnly = form.phone.replace(/\D/g, '')
      if (digitsOnly.length !== 10 || !digitsOnly.startsWith('07')) {
        setFormError('Phone number must be exactly 10 digits and start with 07.')
        return
      }
    }
    // Validate password strength when creating or when password is provided on edit
    const passwordToCheck = form.password
    if (!editUser && !isPasswordStrong(passwordToCheck)) {
      setFormError('Password does not meet the strength requirements. Please ensure all criteria are met.')
      return
    }
    if (editUser && passwordToCheck && !isPasswordStrong(passwordToCheck)) {
      setFormError('Password does not meet the strength requirements. Please ensure all criteria are met.')
      return
    }
    setSaving(true)
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form)
      } else {
        await api.post('/users/', form)
      }
      setShowForm(false)
      loadUsers()
      loadClasses()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error saving user')
    } finally {
      setSaving(false)
    }
  }

  const toggleUser = async (u) => {
    await api.put(`/users/${u.id}/toggle`)
    loadUsers()
  }

  const viewTeacherStudents = async (teacher) => {
    if (viewingTeacher?.id === teacher.id) {
      setViewingTeacher(null)
      setTeacherStudents([])
      return
    }
    const classId = teacher.assigned_class?.id
    if (!classId) {
      alert('No class assigned to this teacher')
      return
    }
    setLoadingStudents(true)
    try {
      const res = await api.get(`/schools/classes/${classId}/students`)
      setViewingTeacher(teacher)
      setTeacherStudents(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Error loading students')
    } finally {
      setLoadingStudents(false)
    }
  }

  const openEditStudent = (student) => {
    setEditingStudent(student)
    setEditForm({ name: student.name || '', student_id: student.student_id || '', guardian: student.guardian || '', village: student.village || '', gender: student.gender || '' })
  }

  const saveEditStudent = async () => {
    setSavingStudent(true)
    try {
      await api.put(`/students/${editingStudent.id}`, editForm)
      setEditingStudent(null)
      loadUsers()
      viewTeacherStudents(viewingTeacher)
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating student')
    } finally {
      setSavingStudent(false)
    }
  }

  const handleReplaceList = async () => {
    if (!replaceFile) { alert('Please select a CSV file'); return }
    if (!viewingTeacher?.assigned_class?.name) {
      alert('No class assigned to this teacher');
      return
    }
    setReplacingList(true)
    try {
      const formData = new FormData()
      formData.append('file', replaceFile)
      formData.append('class_name', viewingTeacher.assigned_class.name)
      formData.append('replace', 'true')
      await api.post(`/students/import-csv`, formData)
      setReplaceFile(null)
      setShowReplaceList(false)
      loadUsers()
      viewTeacherStudents(viewingTeacher)
    } catch (err) {
      alert(err.response?.data?.error || 'Error replacing list')
    } finally {
      setReplacingList(false)
    }
  }

  const roleLabel = ROLE_LABEL[user?.role] || 'Users'
  const nextRole = roleLabel === 'DOS' ? 'DOS' : roleLabel.slice(0, -1)
  const needsLocation = user?.role === 'superadmin'
  const needsSchool = user?.role === 'sector_leader'
  const needsClass = user?.role === 'dos'
  const selectedClass = classes.find(c => c.name === csvClass)

  const uploadCsv = async () => {
    if (!csvFile) {
      alert('Choose a CSV file first')
      return
    }
    const selectedClass = classes.find(c => c.name === csvClass)
    if (selectedClass?.student_count > 0) {
      const confirmMessage = `Class ${csvClass} already has ${selectedClass.student_count} active students. Uploading will merge with the existing list. Use Replace List to overwrite.`
      if (!window.confirm(confirmMessage)) {
        return
      }
    }
    const body = new FormData()
    body.append('file', csvFile)
    body.append('class_name', csvClass)
    setUploading(true)
    try {
      const res = await api.post('/students/import-csv', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const skipped = res.data.skipped?.length || 0
      alert(`CSV imported. Created: ${res.data.created}, Updated: ${res.data.updated}, Skipped: ${skipped}`)
      setCsvFile(null)
      setUploadedClass(csvClass)
      loadClasses()
    } catch (err) {
      alert(err.response?.data?.error || 'Error uploading CSV')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Manage {roleLabel}</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Create {nextRole}</button>
      </div>

      {user?.role === 'dos' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Upload Students CSV</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>
                Required headers: studentid, student name, student guidian, village.
              </p>
            </div>
            <div style={{ minWidth: 140, flex: '0 1 140px' }}>
              <label>Class</label>
              <select value={csvClass} onChange={e => { setCsvClass(e.target.value); setUploadedClass('') }}>
                {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 260px' }}>
              <label>CSV File</label>
              <input type="file" accept=".csv,text/csv" onChange={e => { setCsvFile(e.target.files?.[0] || null); setUploadedClass('') }} />
            </div>
            <button className="btn btn-primary" onClick={uploadCsv} disabled={uploading}>
              {uploading ? 'Uploading...' : uploadedClass === csvClass ? `Submitted to ${csvClass}` : 'Upload Students'}
            </button>
          </div>
          {selectedClass?.student_count > 0 && (
            <div style={{ marginTop: 12, color: '#92400e', fontSize: 13 }}>
              Class {csvClass} already has {selectedClass.student_count} active students. Upload will merge into the existing list.
              Use Replace List to overwrite the class roster.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ maxWidth: 540, width: 'calc(100% - 32px)', maxHeight: '90vh', overflowY: 'auto', margin: '0 auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              {editUser ? 'Edit User' : `Create ${nextRole}`}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { key: 'first_name', label: 'First Name' },
                { key: 'last_name',  label: 'Last Name'  },
                { key: 'email',      label: 'Email',  colSpan: true },
                { key: 'phone',      label: 'Phone (07XXXXXXXX)', colSpan: true },
                { key: 'username',   label: 'Username' },
                { key: 'password',   label: editUser ? 'New Password (leave blank to keep)' : 'Password', type: 'password' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.colSpan ? '1 / -1' : 'auto' }}>
                  <label>{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                  {f.key === 'password' && (
                    <PasswordCriteria password={form.password} />
                  )}
                </div>
              ))}

              {needsLocation && (
                <>
                  <div>
                    <label>Province</label>
                    <select value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))}>
                      <option value="">Select Province</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>District</label>
                    <select value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} disabled={!form.province}>
                      <option value="">Select District</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Sector</label>
                    <select value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} disabled={!form.district}>
                      <option value="">Select Sector</option>
                      {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Village</label>
                    <select value={form.village} onChange={e => setForm(p => ({ ...p, village: e.target.value }))} disabled={!form.sector}>
                      <option value="">Select Village</option>
                      {villages.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </>
              )}

              {needsSchool && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>School Name {user?.role === 'sector_leader' ? 'for this Headmaster' : ''}</label>
                  <input
                    type="text"
                    value={form.school_name}
                    onChange={e => setForm(p => ({ ...p, school_name: e.target.value }))}
                    placeholder="Type school name"
                  />
                </div>
              )}

              {needsClass && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Class Assigned to Teacher</label>
                  <select value={form.class_name} onChange={e => setForm(p => ({ ...p, class_name: e.target.value }))}>
                    {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>

            {formError && (
              <div style={{
                color: '#991b1b',
                background: '#fee2e2',
                padding: '10px 14px',
                borderRadius: 8,
                marginTop: 14,
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-primary" onClick={handleSave}
                disabled={saving}
                style={{ flex: 1 }}>
                {saving ? (editUser ? 'Saving...' : 'Creating...') : (editUser ? 'Save' : 'Create')}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Username</th><th>Email</th>
              <th>{user?.role === 'dos' ? 'Class' : 'Location'}</th>{user?.role === 'dos' && <th>List Assigned</th>}<th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={user?.role === 'dos' ? 7 : 6} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                No {roleLabel} created yet
              </td></tr>
            )}
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.first_name} {u.last_name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{u.username}</td>
                <td>{u.email}</td>
                <td style={{ fontSize: 13, color: '#64748b' }}>
                  {user?.role === 'dos'
                    ? (u.assigned_class?.name || 'No class assigned')
                    : (u.school ? u.school.name : [u.province, u.district, u.sector].filter(Boolean).join(', '))}
                </td>
                {user?.role === 'dos' && (
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: u.assigned_class ? '#166534' : '#94a3b8' }}>
                        {u.assigned_class ? `${u.assigned_class.student_count || 0} students` : 'No list'}
                      </span>
                      {u.assigned_class && (
                        <button
                          title="View student list"
                          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 14, color: viewingTeacher?.id === u.id ? '#2563eb' : '#64748b', padding: '2px 6px', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                          onClick={() => viewTeacherStudents(u)}
                          disabled={loadingStudents}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                )}
                <td>
                  <span style={{
                    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: u.is_active ? '#dcfce7' : '#fee2e2',
                    color: u.is_active ? '#166534' : '#991b1b'
                  }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}
                      onClick={() => openEdit(u)}>Edit</button>
                    <button className="btn" style={{
                      padding: '4px 12px', fontSize: 12,
                      background: u.is_active ? '#fee2e2' : '#dcfce7',
                      color: u.is_active ? '#991b1b' : '#166534'
                    }} onClick={() => toggleUser(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student List Modal for DOS */}
      {user?.role === 'dos' && viewingTeacher && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setViewingTeacher(null); setTeacherStudents([]); setEditingStudent(null); setShowReplaceList(false) }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 750, width: '90%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Students in {viewingTeacher.assigned_class?.name}</h3>
                <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Teacher: {viewingTeacher.first_name} {viewingTeacher.last_name} &mdash; {teacherStudents.length} student{teacherStudents.length !== 1 ? 's' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => { setShowReplaceList(!showReplaceList); setEditingStudent(null) }}>Replace List</button>
                <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => { setViewingTeacher(null); setTeacherStudents([]); setEditingStudent(null); setShowReplaceList(false) }}>Close</button>
              </div>
            </div>

            {/* Replace List Section */}
            {showReplaceList && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Replace Student List</h4>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Upload a new CSV to replace all students in this class. Existing students will be deactivated.</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="file" accept=".csv" onChange={e => setReplaceFile(e.target.files[0])} style={{ fontSize: 13 }} />
                  <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 16px' }} onClick={handleReplaceList} disabled={replacingList}>
                    {replacingList ? 'Uploading...' : 'Upload & Replace'}
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => { setShowReplaceList(false); setReplaceFile(null) }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Edit Student Form */}
            {editingStudent && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Edit Student: {editingStudent.name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', marginBottom: 2, display: 'block' }}>Name</label>
                    <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', marginBottom: 2, display: 'block' }}>Student ID</label>
                    <input value={editForm.student_id} onChange={e => setEditForm(f => ({ ...f, student_id: e.target.value }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', marginBottom: 2, display: 'block' }}>Gender</label>
                    <select value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', marginBottom: 2, display: 'block' }}>Guardian</label>
                    <input value={editForm.guardian} onChange={e => setEditForm(f => ({ ...f, guardian: e.target.value }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', marginBottom: 2, display: 'block' }}>Village</label>
                    <input value={editForm.village} onChange={e => setEditForm(f => ({ ...f, village: e.target.value }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 16px' }} onClick={saveEditStudent} disabled={savingStudent}>
                    {savingStudent ? 'Saving...' : 'Save'}
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => setEditingStudent(null)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Add student (DOS) */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Add new student</h4>


              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 2 }}>Student ID *</label>
                  <input
                    value={editForm.student_id || ''}
                    onChange={e => setEditForm(f => ({ ...f, student_id: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                    placeholder="e.g. 1001"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 2 }}>Name *</label>
                  <input
                    value={editForm.name || ''}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                    placeholder="Student name"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 2 }}>Gender</label>
                  <select
                    value={editForm.gender || 'Male'}
                    onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="">—</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 2 }}>Guardian</label>
                  <input
                    value={editForm.guardian || ''}
                    onChange={e => setEditForm(f => ({ ...f, guardian: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                    placeholder="Guardian name"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 2 }}>Village</label>
                  <input
                    value={editForm.village || ''}
                    onChange={e => setEditForm(f => ({ ...f, village: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                    placeholder="Village"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '4px 16px' }}
                  onClick={async () => {
                    if (!viewingTeacher?.id) return
                    const student_id = (editForm.student_id || '').trim()
                    const name = (editForm.name || '').trim()
                    if (!student_id || !name) {
                      alert('student_id and name are required')
                      return
                    }
                    try {
                      await api.post(`/dos-teachers-students/${viewingTeacher.id}/students/add`, {
                        student_id,
                        name,
                        gender: editForm.gender || '',
                        guardian: editForm.guardian || '',
                        village: editForm.village || ''
                      })
                      setEditForm({})
                      viewTeacherStudents(viewingTeacher)
                    } catch (err) {
                      alert(err.response?.data?.error || err.message || 'Error adding student')
                    }
                  }}
                  disabled={loadingStudents}
                >
                  Add student
                </button>
              </div>
            </div>

            {loadingStudents ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Loading students...</div>
            ) : teacherStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No students in this class yet</div>
            ) : (
              <table>
                <thead><tr><th>Name</th><th>Student ID</th><th>Gender</th><th>Guardian</th><th>Village</th><th>Action</th></tr></thead>
                <tbody>
                  {teacherStudents.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim()}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.student_id}</td>
                      <td>{s.gender || '\u2014'}</td>
                      <td>{s.guardian || '\u2014'}</td>
                      <td>{s.village || '\u2014'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: 11 }} onClick={() => { openEditStudent(s); setShowReplaceList(false) }}>Edit</button>
                          <button
                            className="btn"
                            style={{ padding: '2px 10px', fontSize: 11, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                            onClick={async () => {
                              if (!viewingTeacher?.id) return
                              const ok = window.confirm(`Delete student ${s.student_id} - ${s.name || ''}?`)
                              if (!ok) return
                              try {
                                await api.delete(`/dos-teachers-students/${viewingTeacher.id}/students/${s.id}`)
                                viewTeacherStudents(viewingTeacher)
                              } catch (err) {
                                alert(err.response?.data?.error || err.message || 'Error deleting student')
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
