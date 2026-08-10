import axios from 'axios'

/**
 * Single axios instance for the whole app.
 * Base URL always comes from the environment — never hardcoded.
 * Falls back to the dev proxy path so `npm run dev` works with no .env present.
 */
const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

const TOKEN_KEY = 'cliniccare_token'

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* storage unavailable (private mode) — requests simply stay unauthenticated */
    }
  },
  clear: () => tokenStore.set(null),
}

// Attach the bearer token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * On a 401 the session is no longer valid: drop the token and let the app
 * redirect to login. We dispatch an event instead of importing the router
 * here so this module stays framework-agnostic and free of import cycles.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url || ''
    // Don't bounce the user out for a failed login attempt — that 401 is expected.
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register')
    if (status === 401 && !isAuthAttempt) {
      tokenStore.clear()
      window.dispatchEvent(new CustomEvent('cliniccare:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export default api
