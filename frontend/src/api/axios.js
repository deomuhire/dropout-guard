import axios from 'axios'

const rawBase = import.meta.env.VITE_API_URL

// Normalize baseURL:
// - If VITE_API_URL is set (Vercel), use it as-is (NO /api suffix).
// - If not set (local), use http://localhost:5000.
// - Defensively strip a trailing `/api` if present to avoid `/api/api/...`.
const normalizedBaseURL = rawBase
  ? String(rawBase).replace(/\/+$/, '').replace(/\/(api)\/?$/i, '')
  : 'http://localhost:5000'

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