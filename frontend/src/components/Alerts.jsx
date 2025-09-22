import { useEffect, useMemo, useState } from "react";
import { timeTrends } from "../api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";

const defaults = {
  spike_pp: 20,          // percentage points
  spike_min_tests: 10,
  cluster_r_min: 3,      // resistant cases within window
  cluster_min_tests: 5,
  window_days: 30,
};

function norm(rows) {
  const arr = Array.isArray(rows) ? rows : (rows?.data ?? rows?.results ?? []);
  return (arr || []).map(d => ({
    date: d.date ?? d.day ?? d.month ?? d.period ?? "",
    tests: Number(d.tests ?? d.count ?? 0),
    pct_r: Number(d.pct_r ?? d.percent_resistant ?? d.resistant_pct ?? 0),
  })).filter(d => d.date);
}

export default function Alerts() {
  const [cfg, setCfg] = useState(defaults);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    // try daily first; if backend only supports monthly, it should still work
    timeTrends({ period: "day" })
      .then(r => {
        const rows = norm(r);
        if (rows.length) { setSeries(rows); return; }
        return timeTrends({ period: "month" }).then(m => setSeries(norm(m)));
      })
      .catch(console.error);
  }, []);

  const computed = useMemo(() => {
    const spikes = [];
    const clusters = [];
    if (!series.length) return { spikes, clusters };

    // Spikes: adjacent delta in %R >= spike_pp and tests >= spike_min_tests in the "after" point
    for (let i = 1; i < series.length; i++) {
      const prev = series[i-1], cur = series[i];
      const delta = cur.pct_r - prev.pct_r;
      if (cur.tests >= cfg.spike_min_tests && delta >= cfg.spike_pp) {
        spikes.push({
          at: cur.date, from: prev.pct_r, to: cur.pct_r, tests: cur.tests,
          note: `Resistance jumped from ${prev.pct_r}% → ${cur.pct_r}% (${cur.tests} tests)`,
        });
      }
    }

    // Clusters: approx resistant cases = round(pct_r * tests / 100)
    // Slide over N points roughly equal to window_days (if daily data). If monthly, use 1-month windows.
    const windowSize = guessWindowPoints(series, cfg.window_days);
    for (let i = 0; i < series.length; i++) {
      const win = series.slice(Math.max(0, i - windowSize + 1), i + 1);
      const tests = win.reduce((a,b)=>a+b.tests,0);
      const rCases = Math.round(win.reduce((a,b)=>a + (b.pct_r*b.tests/100), 0));
      if (tests >= cfg.cluster_min_tests && rCases >= cfg.cluster_r_min) {
        clusters.push({
          through: series[i].date, tests, rCases,
          note: `Cluster: ${rCases} resistant cases within ~${cfg.window_days} days (${tests} tests)`,
        });
      }
    }

    return { spikes, clusters };
  }, [series, cfg]);

  return (
    <div>
      <h2>Alerts</h2>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:12 }}>
        <Field label="Spike (pp)">
          <input type="number" value={cfg.spike_pp} onChange={e=>setCfg({...cfg, spike_pp:Number(e.target.value)})}/>
        </Field>
        <Field label="Spike min tests">
          <input type="number" value={cfg.spike_min_tests} onChange={e=>setCfg({...cfg, spike_min_tests:Number(e.target.value)})}/>
        </Field>
        <Field label="Cluster R cases ≥">
          <input type="number" value={cfg.cluster_r_min} onChange={e=>setCfg({...cfg, cluster_r_min:Number(e.target.value)})}/>
        </Field>
        <Field label="Cluster min tests">
          <input type="number" value={cfg.cluster_min_tests} onChange={e=>setCfg({...cfg, cluster_min_tests:Number(e.target.value)})}/>
        </Field>
        <Field label="Window (days)">
          <input type="number" value={cfg.window_days} onChange={e=>setCfg({...cfg, window_days:Number(e.target.value)})}/>
        </Field>
      </div>

      <section style={box}>
        <h3>📈 Spikes <small style={hint}>· sudden %R increases</small></h3>
        {computed.spikes.length ? (
          <ul>{computed.spikes.map((s,i)=><li key={i}>{s.note} (at {s.at})</li>)}</ul>
        ) : <div>No spike alerts for current filters.</div>}
      </section>

      <section style={box}>
        <h3>🧪 Clusters <small style={hint}>· multiple R cases in short window</small></h3>
        {computed.clusters.length ? (
          <ul>{computed.clusters.map((c,i)=><li key={i}>{c.note} (through {c.through})</li>)}</ul>
        ) : <div>No cluster alerts for current filters.</div>}
      </section>

      <section style={box}>
        <h3>🔔 Other Alerts</h3>
        <div>Spike: {computed.spikes.length ? computed.spikes.length : "—"}</div>
        <div>Cluster: {computed.clusters.length ? computed.clusters.length : "—"}</div>
      </section>

      <section style={box}>
        <h3>Context (Series)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={series} margin={{top:10,right:20,left:10,bottom:30}}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" angle={-30} textAnchor="end" height={50}/>
            <YAxis yAxisId="left" label={{value:"%R", angle:-90, position:"insideLeft"}} domain={[0,100]}/>
            <Tooltip/>
            <Legend/>
            <Line type="monotone" dataKey="pct_r" yAxisId="left" dot={false}/>
          </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={series} margin={{top:10,right:20,left:10,bottom:30}}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" angle={-30} textAnchor="end" height={50}/>
            <YAxis/>
            <Tooltip/>
            <Bar dataKey="tests"/>
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

function guessWindowPoints(series, days) {
  if (series.length < 2) return 1;
  // crude guess: if key looks like 'YYYY-MM', treat as monthly
  const sample = series[0].date;
  if (/^\d{4}-\d{2}$/.test(sample)) return 1; // one month window
  // otherwise assume daily
  return Math.max(1, Math.round(days));
}

function Field({label, children}) {
  return <label style={{display:"grid", gap:4}}><span style={hint}>{label}</span>{children}</label>;
}
const box = { background:"#fff", border:"1px solid #eee", borderRadius:8, padding:8, marginBottom:12 };
const hint = { fontSize:12, color:"#6b7280" };
