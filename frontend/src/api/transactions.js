import { apiRequest } from './http'

export async function addTransaction(data) {
  return apiRequest('/transactions/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteTransaction(id) {
  return apiRequest(`/transactions/${id}`, { method: 'DELETE' })
}
