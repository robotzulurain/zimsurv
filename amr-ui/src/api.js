const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/,'');
const TOKEN = import.meta.env.VITE_API_TOKEN || '';

function buildUrl(path) {
  if (!BASE) throw new Error('VITE_API_BASE is not set');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${p}`;
}

export async function apiFetch(path, options = {}) {
  const url = buildUrl(path);
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (TOKEN) headers.set('Authorization', `Token ${TOKEN}`);

  // auto-JSON body
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  const resp = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body,
    // credentials not required unless you use cookies; token is in header
    // credentials: 'include',
  });

  if (!resp.ok) {
    const text = await resp.text().catch(()=> '');
    throw new Error(`HTTP ${resp.status} - ${text}`);
  }

  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return resp.json();
  }
  return resp.text();
}

// convenience
export const api = {
  get: (p) => apiFetch(p),
  post: (p, b) => apiFetch(p, { method: 'POST', body: b }),
};

export default api;
