import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import HostFilter from "../components/HostFilter";
import StatCard from "../components/StatCard";

export default function Overview() {
  const [host, setHost] = useState("");
  const [counts, setCounts] = useState({ total: 0, unique_patients: 0, organisms: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let gone = false;
    async function load() {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (host) p.set("host_type", host);
        const j = await apiFetch(`/api/summary/counts-summary/${p.toString() ? `?${p}` : ""}`);
        if (!gone) setCounts(j || { total: 0, unique_patients: 0, organisms: 0 });
      } finally {
        if (!gone) setLoading(false);
      }
    }
    load();
    return ()=>{ gone = true; };
  }, [host]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-gray-500">Quick snapshot of your surveillance data.</p>
        </div>
        <HostFilter host={host} setHost={setHost} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total results" value={loading ? "…" : (counts.total ?? 0)} />
        <StatCard title="Unique patients" value={loading ? "…" : (counts.unique_patients ?? 0)} />
        <StatCard title="Organisms" value={loading ? "…" : (counts.organisms ?? 0)} />
      </div>
    </div>
  );
}
