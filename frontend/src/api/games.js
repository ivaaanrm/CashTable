import { apiRequest } from './http'

export async function getGames() {
  return apiRequest('/games/')
}

export async function createGame(data) {
  return apiRequest('/games/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function joinGameByPin(data) {
  return apiRequest('/games/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function getGame(id) {
  return apiRequest(`/games/${id}`)
}

export async function updateGame(id, data) {
  return apiRequest(`/games/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function closeGame(id) {
  return apiRequest(`/games/${id}/close`, { method: 'PATCH' })
}

export async function deleteGame(id) {
  return apiRequest(`/games/${id}`, { method: 'DELETE' })
}

export async function getSettlement(id) {
  return apiRequest(`/games/${id}/settlement`)
}
