const BASE = '/api'

export async function addTransaction(data) {
  const res = await fetch(`${BASE}/transactions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al registrar el movimiento')
  return res.json()
}

export async function deleteTransaction(id) {
  const res = await fetch(`${BASE}/transactions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al anular el movimiento')
  return res.json()
}
