const TOKEN_KEY = 'cashtable_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return !!getToken()
}

export async function authFetch(url, options = {}) {
  const token = getToken()
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  const res = await fetch(url, options)

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Sesión expirada')
  }

  return res
}

export async function login(pin) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || 'Error al iniciar sesión')
  }

  const data = await res.json()
  setToken(data.access_token)
}
