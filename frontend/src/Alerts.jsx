import React, { useEffect, useMemo, useState } from "react";
import { api, qsFromFilters } from "./api";
import FilterBar from "./components/FilterBar";

function Pill({ children, tone="amber" }) {
  const map = {
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-green-100 text-green-800",
    sky: "bg-sky-100 text-sky-800",
    gray: "bg-gray-100 text-gray-800",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[tone] || map.gray}`}>{children}</span>;
}

function Section({ title, count, children }) {
  return (
    <div className="rounded-xl bg-white shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <Pill tone={count ? "sky" : "gray"}>{count ?? 0}</Pill>
      </div>
      {children}
    </div>
  );
}

function toCsv(alerts) {
  const rows = [["type","organism","antibiotic","facility","month","test_date","count_last_14d","severity","lat","lng"]];
  alerts.forEach(a => {
    rows.push([
      a.type || "",
      a.organism || "",
      a.antibiotic || "",
      a.facility || "",
      a.month || "",
      a.test_date || "",
      a.count_last_14d ?? "",
      a.severity || "",
      a.lat ?? "",
      a.lng ?? "",
    ]);
  });
  return rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
}

export default function Alerts() {
  const [filters, setFilters] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => qsFromFilters(filters), [JSON.stringify(filters)]);

  useEffect(() => {
    let cancel = false;
    setLoading(true); setErr("");
    (async () => {
      try {
        const res = await api.alerts(qs);
        if (!cancel) setAlerts(res.alerts || []);
      } catch (e) {
        if (!cancel) setErr(e.message || "Failed to load alerts");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [qs]);

  const rare = alerts.filter(a => a.type === "Rare resistance pattern");
  const spikes = alerts.filter(a => a.type === "Sudden spike");
  const clusters = alerts.filter(a => a.type === "Potential cluster");

  const onExport = () => {
    const csv = toCsv(alerts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "amr_alerts.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-xl font-bold">Alerts</h2>
        <Pill tone="red">⚠ One Health surveillance</Pill>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onExport} className="px-3 py-1.5 rounded bg-gray-800 text-white text-sm">Export CSV</button>
        </div>
      </div>
      <FilterBar onChange={setFilters} />
      {err && <div className="mb-3 rounded bg-red-100 text-red-700 p-3">{err}</div>}
      {loading && <div className="mb-3 text-gray-600">Loading…</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <Section title="Rare resistance patterns" count={rare.length}>
          {rare.length === 0 ? <p className="text-sm text-gray-500">No rare patterns in current filters.</p> :
            <ul className="space-y-2 text-sm">
              {rare.map((a, i) => (
                <li key={i} className="border rounded p-2">
                  <div className="font-medium">⚠ {a.organism} vs {a.antibiotic}</div>
                  <div className="text-gray-600">Facility: {a.facility || "—"}</div>
                  <div className="text-gray-600">Date: {a.test_date || "—"}</div>
                  <div><Pill tone="red">rare</Pill> <Pill tone="red">{a.severity || "high"}</Pill></div>
                </li>
              ))}
            </ul>
          }
        </Section>

        <Section title="Sudden spikes in cases or %R" count={spikes.length}>
          {spikes.length === 0 ? <p className="text-sm text-gray-500">No spikes detected.</p> :
            <ul className="space-y-2 text-sm">
              {spikes.map((a, i) => (
                <li key={i} className="border rounded p-2">
                  <div className="font-medium">⚠ {a.message || "Spike detected"}</div>
                  <div className="text-gray-600">Month: {a.month || "—"}</div>
                  <div><Pill tone="amber">spike</Pill> <Pill tone="amber">{a.severity || "medium"}</Pill></div>
                </li>
              ))}
            </ul>
          }
        </Section>

        <Section title="Potential clusters (time/place)" count={clusters.length}>
          {clusters.length === 0 ? <p className="text-sm text-gray-500">No clusters in last 14 days.</p> :
            <ul className="space-y-2 text-sm">
              {clusters.map((a, i) => (
                <li key={i} className="border rounded p-2">
                  <div className="font-medium">⚠ {a.organism} at {a.facility}</div>
                  <div className="text-gray-600">Last 14 days: {a.count_last_14d}</div>
                  <div><Pill tone="green">cluster</Pill> <Pill tone="amber">{a.severity || "medium"}</Pill></div>
                </li>
              ))}
            </ul>
          }
        </Section>
      </div>

      <p className="mt-4 text-xs text-gray-600">
        Heuristics: Rare = %S ≥ 80% long-run but an R appeared. Spike = latest month &gt; 2× avg previous months (within filters). Cluster = ≥2 of same organism at a facility in last 14 days.
      </p>
    </section>
  );
}
