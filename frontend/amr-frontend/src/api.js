export const BASE  = (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '');
export const TOKEN = process.env.REACT_APP_API_TOKEN || localStorage.getItem('api_token') || '';

export async function apiFetch(path, { method = 'GET', headers = {}, body } = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const h = { Accept: 'application/json', ...headers };
  if (TOKEN) h['Authorization'] = `Token ${TOKEN}`;
  if (body && !h['Content-Type']) h['Content-Type'] = 'application/json';

  const res = await fetch(url, { method, headers: h, body });
  if (!res.ok) {
    let detail = '';
    try { const t = await res.text(); detail = t?.slice(0, 500); } catch {}
    throw new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
  }
  // try JSON, fallback to text
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}
