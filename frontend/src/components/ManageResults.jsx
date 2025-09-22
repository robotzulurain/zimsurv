import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";

// tiny helpers
const DEFAULT_FILTERS = { facility:"All", organism:"All", antibiotic:"All", host_type:"All" };
const dedupe = (arr=[]) => {
  const seen = new Set(); const out = [];
  for (const v of arr) { const s = String(v ?? "").trim(); if (!s || seen.has(s)) continue; seen.add(s); out.push(s); }
  return out.sort();
};

export default function ManageResults() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [options, setOptions] = useState({ facilities:[], organisms:[], antibiotics:[], hosts:["HUMAN","ANIMAL","ENVIRONMENT"] });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("amr_token") || "";

  // load dropdown options
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const o = await api.options();
        if (!alive) return;
        setOptions({
          facilities: dedupe(o?.facilities || o?.facilities_all || []),
          organisms:  dedupe(o?.organisms || []),
          antibiotics:dedupe(o?.antibiotics || []),
          hosts:      dedupe(o?.hosts || ["HUMAN","ANIMAL","ENVIRONMENT"]),
        });
      } catch {
        // keep defaults
      }
    })();
    return () => { alive = false; };
  }, []);

  // load result list (frontend stub returns [] if backend endpoint missing)
  async function load() {
    setLoading(true);
    try {
      const data = await api.results(filters);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("results load failed:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [JSON.stringify(filters)]);

  async function doDelete(row) {
    if (!token) {
      alert("Login required to delete (see /login)");
      return;
    }
    try {
      const r = await api.deleteResult(row?.id, token);
      if (r?.ok === false) {
        alert("Delete not configured on backend yet.");
        return;
      }
      await load();
    } catch (e) {
      console.error("delete failed:", e);
      alert("Delete failed");
    }
  }

  const facs  = useMemo(()=>options.facilities||[], [options]);
  const orgs  = useMemo(()=>options.organisms||[], [options]);
  const abxs  = useMemo(()=>options.antibiotics||[], [options]);
  const hosts = useMemo(()=>options.hosts||["HUMAN","ANIMAL","ENVIRONMENT"], [options]);

  return (
    <section className="p-4 border rounded mt-6">
      <h3 className="text-lg font-semibold mb-3">Search & Manage Results (Lab Techs)</h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
        <label className="text-sm flex flex-col gap-1">
          <span>Facility</span>
          <select
            className="border rounded px-2 py-1"
            value={filters.facility}
            onChange={(e)=>setFilters(v=>({ ...v, facility: e.target.value || "All" }))}
          >
            <option key="__all_fac" value="All">All Facility</option>
            {facs.map((v, i) => <option key={`${v}-${i}`} value={v}>{v}</option>)}
          </select>
        </label>

        <label className="text-sm flex flex-col gap-1">
          <span>Organism</span>
          <select
            className="border rounded px-2 py-1"
            value={filters.organism}
            onChange={(e)=>setFilters(v=>({ ...v, organism: e.target.value || "All" }))}
          >
            <option key="__all_org" value="All">All Organism</option>
            {orgs.map((v, i) => <option key={`${v}-${i}`} value={v}>{v}</option>)}
          </select>
        </label>

        <label className="text-sm flex flex-col gap-1">
          <span>Antibiotic</span>
          <select
            className="border rounded px-2 py-1"
            value={filters.antibiotic}
            onChange={(e)=>setFilters(v=>({ ...v, antibiotic: e.target.value || "All" }))}
          >
            <option key="__all_abx" value="All">All Antibiotic</option>
            {abxs.map((v, i) => <option key={`${v}-${i}`} value={v}>{v}</option>)}
          </select>
        </label>

        <label className="text-sm flex flex-col gap-1">
          <span>Host</span>
          <select
            className="border rounded px-2 py-1"
            value={filters.host_type}
            onChange={(e)=>setFilters(v=>({ ...v, host_type: e.target.value || "All" }))}
          >
            <option key="__all_host" value="All">All Host</option>
            {hosts.map((v, i) => <option key={`${v}-${i}`} value={v}>{v}</option>)}
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button className="border rounded px-3 py-1" onClick={()=>setFilters(DEFAULT_FILTERS)}>Reset</button>
          <button className="border rounded px-3 py-1" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Facility</th>
              <th className="border px-2 py-1">Organism</th>
              <th className="border px-2 py-1">Antibiotic</th>
              <th className="border px-2 py-1">AST</th>
              <th className="border px-2 py-1">Host</th>
              <th className="border px-2 py-1">Created By</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="border px-2 py-2 text-gray-500" colSpan={9}>No results</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id ?? i}>
                  <td className="border px-2 py-1">{r.id ?? "—"}</td>
                  <td className="border px-2 py-1">{r.date ?? r.test_date ?? "—"}</td>
                  <td className="border px-2 py-1">{r.facility ?? "—"}</td>
                  <td className="border px-2 py-1">{r.organism ?? "—"}</td>
                  <td className="border px-2 py-1">{r.antibiotic ?? "—"}</td>
                  <td className="border px-2 py-1">{r.ast ?? r.result ?? "—"}</td>
                  <td className="border px-2 py-1">{r.host_type ?? r.host ?? "—"}</td>
                  <td className="border px-2 py-1">{r.created_by ?? "—"}</td>
                  <td className="border px-2 py-1">
                    <button className="border rounded px-2 py-0.5"
                      onClick={()=>doDelete(r)}
                    >Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!token && (
        <div className="text-xs text-gray-600 mt-2">
          Login to delete rows (see <code>/login</code>)
        </div>
      )}
    </section>
  );
}
