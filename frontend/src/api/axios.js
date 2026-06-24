import axios from 'axios'

const rawBase = import.meta.env.VITE_API_URL

const base = rawBase
  ? String(rawBase).replace(/\/+$/, '')
  : 'http://127.0.0.1:5000'

const normalizedBaseURL = base.endsWith('/api') ? base : `${base}/api`

const api = axios.create({
  // All request paths in the app already include `/api/...`.
  baseURL: normalizedBaseURL,
})



// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If 401 → redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api