const BASE = import.meta.env.VITE_API_BASE || '';
const ENV_TOKEN = import.meta.env.VITE_API_TOKEN || '';
const AUTH_SCHEME = import.meta.env.VITE_AUTH_SCHEME || 'Token'; // 'Token' or 'Bearer'

export function getAuthToken(){
  const t = localStorage.getItem('authToken');
  return t && t.trim() ? t.trim() : (ENV_TOKEN || '');
}
export function setAuthToken(t){
  if (!t) return clearAuthToken();
  localStorage.setItem('authToken', t);
}
export function clearAuthToken(){ localStorage.removeItem('authToken'); }

export async function apiFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = { Accept: 'application/json', ...(opts.headers || {}) };

  const token = getAuthToken();
  if (token) headers['Authorization'] = `${AUTH_SCHEME} ${token}`;

  const resp = await fetch(url, { ...opts, headers });
  if (!resp.ok) {
    const text = await resp.text().catch(()=> '');
    throw new Error(`HTTP ${resp.status}${text ? ` - ${text.slice(0,200)}`:''}`);
  }
  try { return await resp.json(); } catch { return null; }
}
