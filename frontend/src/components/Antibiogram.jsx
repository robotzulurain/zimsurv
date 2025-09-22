import { useEffect, useMemo, useState } from "react";
import { antibiogram } from "../api";
import { useFilters, applyFilters } from "../filters";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

function normalize(payload) {
  const rows = Array.isArray(payload) ? payload
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.results) ? payload.results
    : [];
  return rows.map(r => {
    const R = Number(r.R ?? r.r ?? r.resistant ?? 0);
    const I = Number(r.I ?? r.i ?? r.intermediate ?? 0);
    const S = Number(r.S ?? r.s ?? r.susceptible ?? 0);
    const total = Number(r.total ?? r.count ?? (R+I+S));
    return {
      organism: r.organism ?? r.org ?? r.microbe ?? "Unknown",
      antibiotic: r.antibiotic ?? r.abx ?? r.name ?? "Unknown",
      R, I, S, total: total || (R+I+S),
    };
  });
}

function toGrid(rows) {
  const orgs = Array.from(new Set(rows.map(r=>r.organism))).sort();
  const abx  = Array.from(new Set(rows.map(r=>r.antibiotic))).sort();
  const map = {};
  for (const o of orgs) map[o] = {};
  rows.forEach(r => { map[r.organism][r.antibiotic] = { R:r.R, I:r.I, S:r.S, total:r.total }; });
  return { organisms: orgs, antibiotics: abx, map };
}

function cellColor(stats) {
  if (!stats || !stats.total) return "#ffffff";
  const pctR = (stats.R / stats.total) * 100;
  const r = Math.round(255 * (pctR/100));
  const g = Math.round(255 * (1 - pctR/100));
  const b = 220;
  return `rgb(${r},${g},${b})`;
}

export default function Antibiogram() {
  const { filters } = useFilters();
  const [grid, setGrid] = useState({ organisms: [], antibiotics: [], map: {} });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const params = applyFilters(filters, { by: "organism_antibiotic" });
    antibiogram(params).then(res => setGrid(toGrid(normalize(res)))).catch(console.error);
  }, [filters]);

  const sumOrg = (org) => {
    const row = grid.map[org] || {};
    let R=0,I=0,S=0,total=0;
    for (const abx of grid.antibiotics) {
      const st = row[abx]; if (st) { R+=st.R; I+=st.I; S+=st.S; total+=st.total; }
    }
    return { R,I,S,total };
  };

  const detail = useMemo(() => {
    if (!selected) return null;
    if (selected.antibiotic === "ALL") {
      const s = sumOrg(selected.organism);
      return { label: `${selected.organism} — All antibiotics`, ...s };
    }
    return { label: `${selected.organism} × ${selected.antibiotic}`, ...(selected.stats||{R:0,I:0,S:0,total:0}) };
  }, [selected, grid]);

  return (
    <div>
      <h2>Antibiogram (heatmap)</h2>
      <div style={{ overflowX: "auto", border:"1px solid #eee", borderRadius:8 }}>
        <table style={{ borderCollapse:"collapse", width:"100%" }}>
          <thead>
            <tr>
              <th style={thc}>Organism</th>
              {grid.antibiotics.map(abx => <th key={abx} style={thc}>{abx}</th>)}
              <th style={thc}>Count</th>
            </tr>
          </thead>
          <tbody>
            {grid.organisms.map(org => {
              const sum = sumOrg(org);
              return (
                <tr key={org}>
                  <td style={tdOrg} onClick={()=>setSelected({ organism:org, antibiotic:"ALL" })}>{org}</td>
                  {grid.antibiotics.map(abx => {
                    const st = grid.map[org]?.[abx];
                    const bg = cellColor(st);
                    const txt = st?.total ? Math.round((st.R/st.total)*100) + "%" : "";
                    return (
                      <td
                        key={org+abx}
                        style={{ ...tdCell, background:bg }}
                        title={st ? `R:${st.R} I:${st.I} S:${st.S} (n=${st.total})` : "No data"}
                        onClick={()=>setSelected({ organism:org, antibiotic:abx, stats:st })}
                      >
                        {txt}
                      </td>
                    );
                  })}
                  <td style={{ ...tdCount }} onClick={()=>setSelected({ organism:org, antibiotic:"ALL" })}>
                    {sum.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detail && (
        <div style={{ marginTop: 12, padding: 12, background:"#fff", border:"1px solid #eee", borderRadius:8 }}>
          <strong>{detail.label}</strong>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[detail]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="R" stackId="a" fill="#ef4444" />
                <Bar dataKey="I" stackId="a" fill="#f59e0b" />
                <Bar dataKey="S" stackId="a" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

const thc = { position:"sticky", top:0, background:"#f8fafc", border:"1px solid #eee", padding:"6px 8px", fontWeight:600, textAlign:"center" };
const tdOrg = { border:"1px solid #eee", padding:"6px 8px", whiteSpace:"nowrap", cursor:"pointer" };
const tdCell = { border:"1px solid #eee", padding:"6px 8px", minWidth:60, textAlign:"center", cursor:"pointer" };
const tdCount= { border:"1px solid #eee", padding:"6px 8px", fontWeight:700, textAlign:"right", cursor:"pointer", background:"#f8fafc" };
