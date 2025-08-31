const BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/,'') || '';
const TOKEN = import.meta.env.VITE_API_TOKEN;

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return null;
  for (const k of ['results','data','trend','rows','items']) {
    if (Array.isArray(payload[k])) return payload[k];
  }
  return null;
}

async function fetchJSON(path, opts={}) {
  const r = await fetch(`${BASE}${path}`, {
    headers: {
      'Accept': 'application/json',
      ...(opts.body ? {'Content-Type':'application/json'} : {}),
      ...(TOKEN ? {'Authorization': `Token ${TOKEN}`} : {})
    },
    ...opts
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} - ${await r.text()}`);
  const data = await r.json();
  const arr = extractArray(data);
  return arr ?? data; // return array if we found one, otherwise raw object
}

export const api = {
  counts:   () => fetchJSON('/api/summary/counts-summary/'),
  trend:    () => fetchJSON('/api/summary/resistance-time-trend/'),
  antibiogram: () => fetchJSON('/api/summary/antibiogram/'),
  quality:  () => fetchJSON('/api/summary/data-quality/'),
  facilities: () => fetchJSON('/api/summary/facilities-geo/'),
  lab:      () => fetchJSON('/api/lab-results/'),
  submitOne:  (row)  => fetchJSON('/api/data-entry/', {method:'POST', body: JSON.stringify(row)}),
  submitBulk: (rows) => fetchJSON('/api/data-entry/bulk/', {method:'POST', body: JSON.stringify({rows})}),
};
