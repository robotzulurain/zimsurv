// src/api.js — named exports + default api object

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "")) || "/api";

async function req(path, { method = "GET", json, formData, params } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  // attach query params (skip blanks/All)
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "All") {
        url.searchParams.set(k, v);
      }
    });
  }

  const headers = {};
  let body;
  if (json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (formData) {
    body = formData; // browser sets boundary
  }

  const res = await fetch(url.toString(), { method, headers, body });
  const text = await res.text().catch(() => "");
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg =
      (data && (data.detail || data.error || data.message)) ||
      text ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ---- OPTIONS ----
export const options = async (params) => {
  const data = await req("/options", { params });
  return {
    hosts: (data && data.hosts) || ["HUMAN","ANIMAL","ENVIRONMENT"],
    environment_types: (data && data.environment_types) || [],
    animal_species: (data && data.animal_species) || [],
    ...data,
  };
};
// ---- SUMMARY ----
export const countsSummary = (params = {}) => req("/summary/counts-summary", { params: buildSummaryParams(params) });
export const timeTrends     = (params = {}) => req("/summary/time-trends",     { params: buildSummaryParams(params) });
export const antibiogram    = (params = {}) => req("/summary/antibiogram",     { params: buildSummaryParams(params) });
export const sexAge         = (params) => req("/summary/sex-age",         { params });

// ---- GEO ----
export const geoFacilities  = (params) => req("/geo/facilities",          { params });

// ---- ALERTS ----
export const alertsFeed     = (params) => req("/alerts",                  { params });

// ---- REPORTS ----
export const reportSummary        = (params) => req("/reports/summary",         { params });
export const reportFacilityLeague = (params) => req("/reports/facility-league", { params });
export const reportAntibiogram    = (params) => req("/reports/antibiogram",    { params });

// ---- DATA ENTRY ----
export const createEntry = (json) => req("/entry", { method: "POST", json });

export const uploadCSV = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return req("/upload/csv", { method: "POST", formData: fd });
};

// Default export so older imports still work
const api = {
  options,
  countsSummary,
  timeTrends,
  antibiogram,
  sexAge,
  geoFacilities,
  alertsFeed,
  reportSummary,
  reportFacilityLeague,
  reportAntibiogram,
  createEntry,
  uploadCSV,
};
export default api;


// === AMR helper: build params for summary endpoints ===
function buildSummaryParams(input = {}) {
  const out = {};
  const set = (k, v) => { if (v != null && v !== "") out[k] = v; };

  // Host + dependent filters
  set("host_type", input.host_type);
  if (input.host_type === "ENVIRONMENT") set("environment_type", input.environment_type);
  if (input.host_type === "ANIMAL")      set("animal_species",   input.animal_species);

  // Pass-through others without overwriting above keys
  Object.entries(input).forEach(([k, v]) => {
    if (["host_type","environment_type","animal_species"].includes(k)) return;
    if (v != null && v !== "" && out[k] == null) out[k] = v;
  });
  return out;
}
// END_AMR_HELPER
