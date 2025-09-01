const BASE = import.meta.env.VITE_API_BASE
const TOKEN = import.meta.env.VITE_API_TOKEN

export async function apiFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const headers = {
    Accept: 'application/json',
    ...(opts.headers || {}),
  }
  if (TOKEN) headers['Authorization'] = `Token ${TOKEN}`

  const res = await fetch(url, { ...opts, headers })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const msg = typeof data === 'object' ? JSON.stringify(data) : text
    throw new Error(`HTTP ${res.status} - ${msg}`)
  }
  return data
}
