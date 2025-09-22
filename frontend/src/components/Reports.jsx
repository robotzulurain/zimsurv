import { useEffect, useMemo, useState } from "react";
import { countsSummary, options, reportSummary, reportFacilityLeague, reportAntibiogram, timeTrends } from "../api";
import { useFilters, applyFilters } from "../filters";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from "recharts";

export default function Reports() {
  const { filters } = useFilters();
  const [sum, setSum] = useState({ total_results:0, unique_patients:0, pct_resistant:0, facilities:0 });
  const [league, setLeague] = useState([]);
  const [abx, setAbx] = useState([]);
  const [trend, setTrend] = useState([]);

  const [organism, setOrganism] = useState("");

  useEffect(() => {
    countsSummary(applyFilters(filters)).then(r => setSum(s => ({
      ...s,
      total_results: r.total_results ?? r.total ?? r.count ?? 0,
      unique_patients: r.unique_patients ?? r.patients ?? 0,
      pct_resistant: r.pct_resistant ?? r.percent_resistant ?? 0,
    }))).catch(console.error);

    options({}).then(o => {
      const n = Array.isArray(o?.facilities) ? o.facilities.length : 0;
      setSum(s => ({...s, facilities:n}));
    }).catch(()=>{});

    reportSummary(applyFilters(filters)).catch(()=>{});
    reportFacilityLeague(applyFilters(filters)).then(r => setLeague(Array.isArray(r)?r:(r?.data??[]))).catch(console.error);
    reportAntibiogram(applyFilters(filters)).then(r => setAbx(toRows(Array.isArray(r)?r:(r?.data??[])))).catch(console.error);
    timeTrends(applyFilters(filters, { period:"month" })).then(r => setTrend(toTrend(Array.isArray(r)?r:(r?.data??[])))).catch(console.error);
  }, [filters]);

  const organisms = useMemo(() => Array.from(new Set(abx.map(r=>r.organism))).sort(), [abx]);
  useEffect(()=>{ if (!organism && organisms.length) setOrganism(organisms[0]); },[organisms]);
  const abxForOrg = useMemo(() => abx.filter(r=>r.organism===organism), [abx, organism]);

  const exportCSV = () => {
    const lines = [];
    lines.push("Summary");
    lines.push("Metric,Value");
    lines.push(`Total results,${sum.total_results}`);
    lines.push(`Unique patients,${sum.unique_patients}`);
    lines.push(`Facilities,${sum.facilities}`);
    lines.push(`% Resistant,${sum.pct_resistant}`);
    lines.push("");
    lines.push("Facility League");
    lines.push("Facility,Tests,%R,Completeness");
    league.forEach(r => lines.push(`${csv(r.facility||r.name)},${r.tests||r.count||""},${r.pct_r||r.percent_resistant||""},${r.completeness||""}`));
    lines.push("");
    lines.push("Antibiogram");
    lines.push("Organism,Antibiotic,R,I,S");
    abx.forEach(r => lines.push(`${csv(r.organism)},${csv(r.antibiotic)},${r.R||0},${r.I||0},${r.S||0}`));
    lines.push("");
    lines.push("Monthly Trends");
    lines.push("Month,%R,Tests");
    trend.forEach(t => lines.push(`${t.date},${t.pct_r},${t.tests}`));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "amr_reports_export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2>Reports</h2>

      <section style={box}>
        <h3>Summary (National)</h3>
        <table className="tbl">
          <thead><tr><th>Metric</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>Total results</td><td>{sum.total_results}</td></tr>
            <tr><td>Unique patients</td><td>{sum.unique_patients}</td></tr>
            <tr><td>Facilities</td><td>{sum.facilities}</td></tr>
            <tr><td>% Resistant</td><td>{sum.pct_resistant}</td></tr>
          </tbody>
        </table>
        <button onClick={exportCSV} style={{ marginTop:8 }}>Export CSV</button>
      </section>

      <section style={box}>
        <h3>Facility League</h3>
        <table className="tbl">
          <thead><tr><th>Facility</th><th>Tests</th><th>%R</th><th>Completeness</th></tr></thead>
          <tbody>
            {league.map((r,i)=>(
              <tr key={i}><td>{r.facility ?? r.name}</td><td>{r.tests ?? r.count}</td><td>{r.pct_r ?? r.percent_resistant}</td><td>{r.completeness ?? ""}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={box}>
        <h3>Antibiogram</h3>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
          <label style={hint}>Organism</label>
          <select value={organism} onChange={e=>setOrganism(e.target.value)}>
            {organisms.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={abxForOrg} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="antibiotic" angle={-30} textAnchor="end" height={60}/>
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="R" stackId="a" fill="#ef4444" />
            <Bar dataKey="I" stackId="a" fill="#f59e0b" />
            <Bar dataKey="S" stackId="a" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section style={box}>
        <h3>Monthly Trends</h3>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={trend} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" angle={-30} textAnchor="end" height={50}/>
            <YAxis yAxisId="left" domain={[0,100]} label={{ value: "%R", angle: -90, position: "insideLeft" }}/>
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pct_r" yAxisId="left" dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trend} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" angle={-30} textAnchor="end" height={50}/>
            <YAxis />
            <Tooltip />
            <Bar dataKey="tests" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <style>{`
        .tbl { width:100%; border-collapse: collapse; }
        .tbl th, .tbl td { border:1px solid #eee; padding:6px 8px; text-align:left; }
        .tbl th { background:#f8fafc; }
      `}</style>
    </div>
  );
}

function csv(v){ return String(v??"").replaceAll('"','""'); }
function toRows(rows){
  return rows.map(r => ({
    organism: r.organism ?? r.org ?? r.microbe ?? "Unknown",
    antibiotic: r.antibiotic ?? r.abx ?? r.name ?? "Unknown",
    R: Number(r.R ?? r.r ?? r.resistant ?? 0),
    I: Number(r.I ?? r.i ?? r.intermediate ?? 0),
    S: Number(r.S ?? r.s ?? r.susceptible ?? 0),
  }));
}
function toTrend(rows){
  return rows.map(r => ({
    date: r.date ?? r.month ?? r.period ?? "",
    pct_r: Number(r.pct_r ?? r.percent_resistant ?? r.resistant_pct ?? 0),
    tests: Number(r.tests ?? r.count ?? 0),
  }));
}
const box = { background:"#fff", border:"1px solid #eee", borderRadius:8, padding:8, marginBottom:12 };
const hint = { fontSize:12, color:"#6b7280" };
