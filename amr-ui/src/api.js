const BASE = import.meta.env.VITE_API_BASE || '';
const TOKEN = import.meta.env.VITE_API_TOKEN || '';

export async function apiFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = { Accept: 'application/json', ...(opts.headers || {}) };
  if (TOKEN) headers['Authorization'] = `Token ${TOKEN}`;

  const resp = await fetch(url, { ...opts, headers });
  if (!resp.ok) {
    const text = await resp.text().catch(()=> '');
    throw new Error(`HTTP ${resp.status}${text ? ` - ${text.slice(0,200)}`:''}`);
  }
  try { return await resp.json(); } catch { return null; }
}
