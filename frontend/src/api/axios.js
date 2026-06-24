import axios from 'axios'

const api = axios.create({
  // If VITE_API_URL is not provided, default to the backend URL.
  // This prevents axios from using an incorrect relative base when the app
  // is not served through the Vite dev proxy.
  // Axios base URL should be the backend host (NO trailing /api),
  // because all API calls in the app already include `/api/...` paths.
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}`
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : ''


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