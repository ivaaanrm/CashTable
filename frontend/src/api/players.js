import { apiRequest } from './http'

export async function getPlayerTransactions(playerId) {
  return apiRequest(`/players/${playerId}/transactions`)
}

export async function addPlayer(gameId, data) {
  return apiRequest(`/games/${gameId}/players/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updatePlayerChips(playerId, actualChips) {
  return apiRequest(`/players/${playerId}/chips`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actual_chips: actualChips }),
  })
}

export async function deletePlayer(playerId) {
  return apiRequest(`/players/${playerId}`, { method: 'DELETE' })
}
