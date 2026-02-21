const BASE = '/api'

export async function addPlayer(gameId, data) {
  const res = await fetch(`${BASE}/games/${gameId}/players/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al añadir jugador')
  return res.json()
}

export async function deletePlayer(playerId) {
  const res = await fetch(`${BASE}/players/${playerId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al eliminar jugador')
  return res.json()
}
