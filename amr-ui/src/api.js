const BASE = import.meta.env.VITE_API_BASE ?? "";
const TOKEN = import.meta.env.VITE_API_TOKEN ?? "";

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

async function get(path, fallback) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Token ${TOKEN}`,
      },
    });
    if (!res.ok) return fallback;
    const data = await safeJson(res);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export const api = {
  counts: () =>
    get("/api/summary/counts-summary/", {
      total_results: 0,
      unique_patients: 0,
      organisms_count: 0,
    }),

  trend: () =>
    get("/api/summary/resistance-time-trend/", { series: [] }),

  antibiogram: () =>
    get("/api/summary/antibiogram/", { rows: [] }),

  quality: () =>
    get("/api/summary/data-quality/", {
      completeness: {},
      duplicates: {},
      recent_activity: {},
    }),

  geo: () =>
    get("/api/summary/facilities-geo/", { features: [] }),

  lab: () =>
    get("/api/lab-results/", { results: [] }),

  createOne: (payload) =>
    fetch(`${BASE}/api/data-entry/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),

  createBulk: (rows) =>
    fetch(`${BASE}/api/data-entry/bulk/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows }),
    }),
};
