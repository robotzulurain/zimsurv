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
export const options = (params) => req("/options", { params });

// ---- SUMMARY ----
export const countsSummary = (params) => req("/summary/counts-summary", { params });
export const timeTrends     = (params) => req("/summary/time-trends",     { params });
export const antibiogram    = (params) => req("/summary/antibiogram",     { params });
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
