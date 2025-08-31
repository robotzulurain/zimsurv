import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import "./SexAgeResistance.css";

function band(age) {
  if (age == null || isNaN(age)) return "Unknown";
  const a = Number(age);
  if (a < 1) return "<1y";
  if (a <= 4) return "1-4";
  if (a <= 14) return "5-14";
  if (a <= 24) return "15-24";
  if (a <= 49) return "25-49";
  if (a <= 64) return "50-64";
  return "65+";
}
function pctR(nR, n) { if (!n) return null; return +(100 * (nR / n)).toFixed(1); }

export default function SexAgeResistance({ host = "all" }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoading(true);
        const q = new URLSearchParams({ limit: "10000" });
        if (host && host.toLowerCase() !== "all") q.set("host_type", host);
        const res = await apiFetch(`/api/lab-results/?${q.toString()}`);
        const j = await res.json();
        if (!dead) setRows(Array.isArray(j?.results) ? j.results : []);
      } catch (e) {
        if (!dead) setErr(e.message || String(e));
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [host]);

  const bySex = useMemo(() => {
    const acc = { Male: { R:0, N:0 }, Female:{ R:0, N:0 }, Unknown:{ R:0, N:0 } };
    for (const r of rows) {
      const key = (r.sex === "M" ? "Male" : r.sex === "F" ? "Female" : "Unknown");
      acc[key].N += 1;
      if (String(r.ast_result).toUpperCase() === "R") acc[key].R += 1;
    }
    return [
      { label:"Male",    R:acc.Male.R,    N:acc.Male.N,    p:pctR(acc.Male.R, acc.Male.N) },
      { label:"Female",  R:acc.Female.R,  N:acc.Female.N,  p:pctR(acc.Female.R, acc.Female.N) },
      { label:"Unknown", R:acc.Unknown.R, N:acc.Unknown.N, p:pctR(acc.Unknown.R, acc.Unknown.N) },
    ];
  }, [rows]);

  const byAge = useMemo(() => {
    const buckets = {};
    for (const r of rows) {
      const b = band(r.age);
      if (!buckets[b]) buckets[b] = { R:0, N:0 };
      buckets[b].N += 1;
      if (String(r.ast_result).toUpperCase() === "R") buckets[b].R += 1;
    }
    return Object.entries(buckets)
      .map(([label, v]) => ({ label, R:v.R, N:v.N, p:pctR(v.R, v.N) }))
      .sort((a,b)=> {
        const order = ["<1y","1-4","5-14","15-24","25-49","50-64","65+","Unknown"];
        return order.indexOf(a.label) - order.indexOf(b.label);
      });
  }, [rows]);

  if (loading) return <p>Loading sex/age…</p>;
  if (err) return <p style={{color:"#b91c1c"}}>Error: {err}</p>;

  return (
    <div>
      <div className="sectionTitle">Resistance by Sex & Age</div>
      <div className="small">Showing %R (resistant / total) from current filters.</div>

      <div className="grid2">
        <div className="card">
          <div className="sectionTitle" style={{marginTop:0}}>By Sex</div>
          {bySex.map((r)=>(
            <div className="barRow" key={r.label}>
              <div className="barLabel">{r.label}</div>
              <div className="barTrack"><div className="barFill" style={{width: (r.p ?? 0) + "%"}} /></div>
              <div className="barPct">{r.p == null ? "—" : `${r.p}% (N=${r.N})`}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="sectionTitle" style={{marginTop:0}}>By Age band</div>
          {byAge.map((r)=>(
            <div className="barRow" key={r.label}>
              <div className="barLabel">{r.label}</div>
              <div className="barTrack"><div className="barFill" style={{width: (r.p ?? 0) + "%"}} /></div>
              <div className="barPct">{r.p == null ? "—" : `${r.p}% (N=${r.N})`}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
