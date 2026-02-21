const BASE = '/api'

export async function getGames() {
  const res = await fetch(`${BASE}/games/`)
  if (!res.ok) throw new Error('Error al cargar las partidas')
  return res.json()
}

export async function createGame(data) {
  const res = await fetch(`${BASE}/games/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear la partida')
  return res.json()
}

export async function getGame(id) {
  const res = await fetch(`${BASE}/games/${id}`)
  if (!res.ok) throw new Error('Error al cargar la partida')
  return res.json()
}

export async function closeGame(id) {
  const res = await fetch(`${BASE}/games/${id}/close`, { method: 'PATCH' })
  if (!res.ok) throw new Error('Error al cerrar la partida')
  return res.json()
}

export async function deleteGame(id) {
  const res = await fetch(`${BASE}/games/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al borrar la partida')
  // DELETE returns 204 No Content, so we don't try to parse JSON
  return true
}

export async function getSettlement(id) {
  const res = await fetch(`${BASE}/games/${id}/settlement`)
  if (!res.ok) throw new Error('Error al calcular la liquidación')
  return res.json()
}
