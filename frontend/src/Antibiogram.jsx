import React, { useEffect, useState } from "react";
import { api, qsFromFilters } from "./api";
import FilterBar from "./components/FilterBar";

// Darker, higher-contrast heat
function cellBg(pctS) {
  const t = Math.max(0, Math.min(100, pctS)) / 100; // clamp 0..100
  const r = Math.round(255 * (1 - t));
  const g = Math.round(255 * t);
  const b = 60;
  return `rgba(${r},${g},${b},0.55)`;
}
function cellTextColor(pctS){ return pctS < 35 ? "#fff" : "#111"; }

export default function Antibiogram() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [filters, setFilters] = useState({});

  // ✅ Do not pass an async function or a function that returns a Promise directly to useEffect
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await api.antibiogram(qsFromFilters(filters));
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load antibiogram");
      }
    };
    run();
    return () => { cancelled = true; }; // proper cleanup function
  }, [filters]); // object reference changes via setFilters in <FilterBar/>

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">Antibiogram</h2>
      <FilterBar onChange={setFilters} />
      {err && <div className="rounded bg-red-100 text-red-700 p-3 mb-3">{err}</div>}
      {!data ? <p>Loading…</p> :
        <div className="rounded-xl bg-white shadow p-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th className="text-left p-2 font-semibold">Organism</th>
                {data.columns.map((ab) => (
                  <th key={ab} className="text-left p-2 font-semibold">{ab}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.organism} className="border-t">
                  <td className="p-2 font-medium">{r.organism}</td>
                  {r.S.map((pctS, idx) => (
                    <td key={idx} className="p-2"
                        style={{ backgroundColor: cellBg(pctS), color: cellTextColor(pctS) }}>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold">{pctS}% S</span>
                        <span className="opacity-80">n={r.n?.[idx] ?? "—"}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.note && <p className="mt-3 text-gray-600">{data.note}</p>}
        </div>
      }
    </section>
  );
}
