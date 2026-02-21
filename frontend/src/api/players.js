const BASE = '/api'

export async function getPlayerTransactions(playerId) {
  const res = await fetch(`${BASE}/players/${playerId}/transactions`)
  if (!res.ok) throw new Error('Error al cargar los movimientos')
  return res.json()
}

export async function addPlayer(gameId, data) {
  const res = await fetch(`${BASE}/games/${gameId}/players/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al añadir jugador')
  return res.json()
}

export async function updatePlayerChips(playerId, actualChips) {
  const res = await fetch(`${BASE}/players/${playerId}/chips`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actual_chips: actualChips }),
  })
  if (!res.ok) throw new Error('Error al actualizar fichas')
  return res.json()
}

export async function deletePlayer(playerId) {
  const res = await fetch(`${BASE}/players/${playerId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al eliminar jugador')
  return res.json()
}
