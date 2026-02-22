export async function apiRequest(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
  })

  if (!res.ok) {
    let message = 'Error de servidor'
    try {
      const data = await res.json()
      if (typeof data?.detail === 'string') {
        message = data.detail
      } else if (data?.detail?.message) {
        message = data.detail.message
      } else if (data?.message) {
        message = data.message
      }
    } catch {
      // No JSON body available.
    }
    throw new Error(message)
  }

  if (res.status === 204) {
    return true
  }

  return res.json()
}
