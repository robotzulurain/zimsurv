const BASE = import.meta.env.VITE_API_BASE || 'https://amr-app.onrender.com';
const TOKEN = import.meta.env.VITE_API_TOKEN || '';

export async function apiFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = new Headers(opts.headers || {});
  if (TOKEN && !headers.has('Authorization')) {
    headers.set('Authorization', `Token ${TOKEN}`);
  }
  if (!headers.has('Accept')) headers.set('Accept','application/json');

  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text().catch(()=>res.statusText);
    throw new Error(`HTTP ${res.status} - ${txt}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

/** Service registry — pages can call sr.counts(), sr.trend({...}), etc. */
export const sr = {
  counts     : () => apiFetch('/api/summary/counts-summary/'),
  trend      : (q={}) => apiFetch('/api/summary/resistance-time-trend/?'+toQS(q)),
  antibiogram: (q={}) => apiFetch('/api/summary/antibiogram/?'+toQS(q)),
  dataQuality: () => apiFetch('/api/summary/data-quality/'),
  facilities : () => apiFetch('/api/summary/facilities-geo/'),
  sexAge     : (q={}) => apiFetch('/api/summary/sex-age/?'+toQS(q)),
  labResults : (q={}) => apiFetch('/api/lab-results/?'+toQS(q)),
};

function toQS(obj){
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k,v])=>{
    if (v && v !== 'All') p.append(k, v);
  });
  return p.toString();
}

/* Default export for code that does: import api from '../api' */
const api = { apiFetch, sr };
export default api;
