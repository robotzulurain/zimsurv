import React, { useEffect, useState } from "react";
import { api, qsFromFilters } from "./api";

export default function Alerts(){
  const [filters, setFilters] = useState({ organism:"", antibiotic:"", facility:"", host_type:"", from:"", to:"" });
  const [data, setData] = useState({ alerts: [] });
  const [err, setErr] = useState("");

  useEffect(() => {
    const q = qsFromFilters(filters);
    api.alerts(q).then(d => { setData(d || { alerts: [] }); setErr(""); })
                 .catch(e => { setErr(e.message || "Error"); setData({ alerts: [] }); });
  }, [JSON.stringify(filters)]);

  function onReset(){ setFilters({ organism:"", antibiotic:"", facility:"", host_type:"", from:"", to:"" }); }

  const { alerts = [] } = data;

  return (
    <section className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alerts</h2>
        <a className="text-sm underline" href={api.glassExportUrl(qsFromFilters(filters))}>Export CSV</a>
      </div>

      <div className="mt-3 grid sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <input className="border rounded px-2 py-1" placeholder="Organism" value={filters.organism} onChange={e=>setFilters({...filters,organism:e.target.value})}/>
        <input className="border rounded px-2 py-1" placeholder="Antibiotic" value={filters.antibiotic} onChange={e=>setFilters({...filters,antibiotic:e.target.value})}/>
        <input className="border rounded px-2 py-1" placeholder="Facility" value={filters.facility} onChange={e=>setFilters({...filters,facility:e.target.value})}/>
        <select className="border rounded px-2 py-1" value={filters.host_type} onChange={e=>setFilters({...filters,host_type:e.target.value})}>
          <option value="">All Host Type</option>
          <option>HUMAN</option><option>ANIMAL</option><option>ENVIRONMENT</option>
        </select>
        <input type="date" className="border rounded px-2 py-1" value={filters.from} onChange={e=>setFilters({...filters,from:e.target.value})}/>
        <input type="date" className="border rounded px-2 py-1" value={filters.to} onChange={e=>setFilters({...filters,to:e.target.value})}/>
      </div>
      <div className="mt-2">
        <button className="text-sm px-2 py-1 rounded border" onClick={onReset}>Reset</button>
      </div>

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

      <div className="mt-4">
        {alerts.length === 0 ? (
          <div className="text-sm text-gray-600">No alerts for current filters.</div>
        ) : (
          <ul className="list-disc ml-5">
            {alerts.map((a,i)=>(
              <li key={i} className="text-sm">
                <span className="font-semibold">{a.type}</span>
                {a.facility ? ` @ ${a.facility}` : ""}{a.organism ? ` — ${a.organism}` : ""}
                {a.count_last_14d ? ` (last 14d: ${a.count_last_14d})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Heuristics: Rare = %S ≥ 80% long-run but an R appeared. Spike = latest month &gt; 2× avg previous months (within filters). Cluster = ≥2 of same organism at a facility in last 14 days.
      </p>
    </section>
  );
}
