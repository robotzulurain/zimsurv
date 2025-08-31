const BASE =
  (import.meta?.env?.VITE_API_BASE ?? '') ||
  (typeof window !== 'undefined' && window.__API_BASE) ||
  'https://amr-app.onrender.com'; // fallback for demos

const TOKEN =
  (import.meta?.env?.VITE_API_TOKEN ?? '') ||
  (typeof window !== 'undefined' && window.localStorage?.getItem('api_token')) ||
  '';

export async function apiFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = { Accept: 'application/json', ...(opts.headers || {}) };
  if (TOKEN) headers['Authorization'] = `Token ${TOKEN}`;

  try {
    const resp = await fetch(url, { ...opts, headers });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status}${text ? ` - ${text.slice(0, 200)}` : ''}`);
    }
    try { return await resp.json(); } catch { return null; }
  } catch (err) {
    console.error('apiFetch error:', { path, url, err, BASE, hasTOKEN: Boolean(TOKEN) });
    throw err;
  }
}

export function getApiDebug() {
  return { BASE, hasTOKEN: Boolean(TOKEN) };
}
