import { useEffect, useState, useMemo } from "react";
import { countsSummary, timeTrends } from "../api";
import { useFilters, applyFilters, ALL } from "../filters";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import OneHealthAnimation from "./OneHealthAnimation.jsx";

export default function Overview() {
  const { filters } = useFilters();
  const [m, setM] = useState({ total_results: 0, unique_patients: 0, pct_resistant: 0 });
  const [series, setSeries] = useState([]);

  useEffect(() => {
    countsSummary(applyFilters(filters)).then(r => {
      setM({
        total_results: r.total_results ?? r.total ?? r.count ?? 0,
        unique_patients: r.unique_patients ?? r.patients ?? 0,
        pct_resistant: r.pct_resistant ?? r.percent_resistant ?? 0,
      });
    }).catch(console.error);

    timeTrends(applyFilters(filters, { period: "month" })).then(r => {
      const rows = Array.isArray(r) ? r : (r?.data ?? r?.results ?? []);
      setSeries(rows.map(d => ({
        date: d.date ?? d.month ?? d.period ?? "",
        tests: Number(d.tests ?? d.count ?? 0),
      })));
    }).catch(console.error);
  }, [filters]);

  const context = useMemo(() => {
    const bits = [];
    if (filters.host_type !== ALL) bits.push(`Host: ${filters.host_type}`);
    if (filters.host_type === "ANIMAL" && filters.animal_species !== ALL) bits.push(`Species: ${filters.animal_species}`);
    if (filters.host_type === "ENVIRONMENT" && filters.environment_type !== ALL) bits.push(`Environment: ${filters.environment_type}`);
    if (filters.facility !== ALL) bits.push(`Facility: ${filters.facility}`);
    if (filters.organism !== ALL) bits.push(`Organism: ${filters.organism}`);
    if (filters.antibiotic !== ALL) bits.push(`Antibiotic: ${filters.antibiotic}`);
    if (filters.patient_type !== ALL && filters.host_type === "HUMAN") bits.push(`Patient: ${filters.patient_type}`);
    return bits.join(" · ") || "No active filters";
  }, [filters]);

  return (
    <div style={{ display:"grid", gap:10 }}>
      <h2 style={{ margin:0 }}>Overview</h2>

      {/* Animation on top, full width; text below */}
      <section style={{ background:"#fff", border:"1px solid #eee", borderRadius:8, padding:10 }}>
        <div style={{ width:"100%", maxWidth:"980px", margin:"0 auto" }}>
          <OneHealthAnimation height={200} />
        </div>
        <div style={{ marginTop:8 }}>
          <div style={{ fontWeight:700, marginBottom:4 }}>One Health view</div>
          <div style={{ fontSize:12, color:"#334155", lineHeight:1.35 }}>
            This dashboard supports a One Health approach by unifying human, animal, and environment AMR data.
            Choose a Host above. When you select <b>ANIMAL</b>, you can filter by <b>Animal Species</b>;
            for <b>ENVIRONMENT</b>, filter by <b>Environment Type</b>. All charts honor these filters.
          </div>
          <div style={{ marginTop:6, fontSize:12, color:"#0f172a" }}>
            <b>Active context:</b> {context}
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        <Card label="Total tests" value={m.total_results}/>
        <Card label="Unique patients" value={m.unique_patients}/>
        <Card label="% Resistant" value={`${Number(m.pct_resistant).toFixed(1)}%`}/>
      </section>

      {/* Chart */}
      <section style={{ background:"#fff", border:"1px solid #eee", borderRadius:8, padding:6 }}>
        <div style={{ fontWeight:600, margin:"2px 0 6px 0" }}>Monthly tests</div>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={series} margin={{ top:4,right:14,left:0,bottom:26 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" angle={-30} textAnchor="end" height={46}/>
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="tests" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

function Card({label, value}) {
  return (
    <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:8, padding:"10px 12px" }}>
      <div style={{ fontSize:12, color:"#6b7280" }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700 }}>{value}</div>
    </div>
  );
}
