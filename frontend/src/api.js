const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function req(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export const api = {
  counts: (qs="") => req(`/api/summary/counts-summary${qs}`),
  trends: (qs="") => req(`/api/summary/time-trends${qs}`),
  antibiogram: (qs="") => req(`/api/summary/antibiogram${qs}`),
  sexAge: (qs="") => req(`/api/summary/sex-age${qs}`),
  facilities: (qs="") => req(`/api/geo/facilities${qs}`),
  alerts: (qs="") => req(`/api/alerts${qs}`),

  options: () => req("/api/options"),
  createEntry: (payload) =>
    req("/api/entry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
  uploadFile: (file) => { const fd = new FormData(); fd.append("file", file); return req("/api/upload", { method: "POST", body: fd }); },
  templateCSV: () => req("/api/templates/csv"),
};

export default api;

// Build "?a=b&c=d" from a filter object like {organism, antibiotic, facility, host_type}
export function qsFromFilters(f) {
  const p = new URLSearchParams();
  Object.entries(f || {}).forEach(([k, v]) => { if (v) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : "";
}
