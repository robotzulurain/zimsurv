const BASE = import.meta.env.VITE_API_BASE || '';
let TOKEN = (import.meta.env.VITE_API_TOKEN || '').trim();

// Fallback JUST for public Netlify demo if env is missing
if (!TOKEN && typeof window !== 'undefined' && window.location.hostname.endsWith('netlify.app')) {
  TOKEN = 'feb91ba9962758d186f6d011ed93bee659998aa8';
  // console.warn('Using demo token fallback for Netlify');
}

function buildHeaders(extra = {}) {
  const headers = new Headers({ Accept: 'application/json', ...extra });
  if (TOKEN) headers.set('Authorization', `Token ${TOKEN}`);
  return headers;
}

export async function apiFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = buildHeaders(opts.headers || {});
  const resp = await fetch(url, { ...opts, mode: 'cors', credentials: 'omit', headers });
  const text = await resp.text().catch(()=> '');
  if (!resp.ok) throw new Error(`HTTP ${resp.status} - ${text || resp.statusText}`);
  try { return JSON.parse(text); } catch { return null; }
}
