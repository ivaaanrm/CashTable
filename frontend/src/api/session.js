import { apiRequest } from './http'

export async function getSession() {
  return apiRequest('/session')
}

export async function clearSession() {
  return apiRequest('/session', { method: 'DELETE' })
}
