import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import { sexAge } from "../api";
import { useFilters, applyFilters } from "../filters";

const BIN_EDGES = [0,10,20,30,40,50,60,70,80,999];
const BIN_LABELS = ["0-10","10-20","20-30","30-40","40-50","50-60","60-70","70-80","80+"];

const PIE_COLORS = { Male: "#60a5fa", Female: "#f472b6", Unknown: "#9ca3af" };
const BAR_COLORS = { Male: "#60a5fa", Female: "#f472b6", Unknown: "#9ca3af" };

const SEX_LABELS = { M:"Male", F:"Female", Male:"Male", Female:"Female" };

const num = (v, d=0) => Number.isFinite(Number(v)) ? Number(v) : d;
const first = (...vals) => vals.find(v => v !== undefined && v !== null);

const pctR = (R,I,S,total) => {
  if (total !== undefined) return total>0 ? (100 * (R ?? 0) / total) : 0;
  const t = (R||0)+(I||0)+(S||0);
  return t>0 ? (100 * (R||0) / t) : 0;
};

function bandFromAge(age) {
  const a = Math.max(0, Math.min(999, Number(age)||0));
  for (let i=0; i<BIN_EDGES.length-1; i++) if (a >= BIN_EDGES[i] && a < BIN_EDGES[i+1]) return BIN_LABELS[i];
  return BIN_LABELS.at(-1);
}
function midFromLabel(label) {
  if (!label) return 0;
  const m = String(label).match(/(\d+)\s*[-–to]+\s*(\d+)/i);
  if (m) return (Number(m[1]) + Number(m[2]))/2;
  const plus = String(label).match(/(\d+)\s*\+|>=\s*(\d+)/i);
  if (plus) return Number(plus[1] ?? plus[2]) + 5;
  const n = String(label).match(/(\d+)/);
  return Number(n?.[1]) || 0;
}

// ---------- collectors ----------
function deepCollectRows(obj, acc=[]) {
  if (Array.isArray(obj)) obj.forEach(v => deepCollectRows(v, acc));
  else if (obj && typeof obj === "object") {
    const k = Object.keys(obj);
    if (k.some(x=>/^(sex|gender|sexe)$/i.test(x)) || k.some(x=>/age|band|range|group/i.test(x))) acc.push(obj);
    for (const v of Object.values(obj)) deepCollectRows(v, acc);
  }
  return acc;
}
function extractJoint(payload){
  const rows = deepCollectRows(payload);
  const out = [];
  for (const r of rows) {
    const sexRaw = first(r.sex, r.gender, r.name, r.sexe);
    const sex = SEX_LABELS[sexRaw] || (/m/i.test(String(sexRaw)) ? "Male" : /f/i.test(String(sexRaw)) ? "Female" : "Unknown");
    const ageNum = r.age ?? r.age_years ?? r.ageYears;
    const band = first(r.age_band, r.band, r.ageBand, r.age_group, r.age_range, r.label);
    const ageMid = ageNum !== undefined ? num(ageNum) : midFromLabel(band);
    const R = num(first(r.R, r.r, r.resistant));
    const I = num(first(r.I, r.i, r.intermediate));
    const S = num(first(r.S, r.s, r.susceptible));
    const total = num(first(r.total, r.count, r.n, R+I+S));
    const tests = num(first(r.tests, r.total_tests, total));
    if ((R+I+S+tests)>0 && (Number.isFinite(ageMid) || band)) {
      out.push({ ageMid: Number.isFinite(ageMid) ? ageMid : midFromLabel(band), sex, R, I, S, total: tests || total });
    }
  }
  return out;
}
function extractSexTotals(payload){
  const src = first(payload?.sex, payload?.sex_counts, payload?.sexDistribution, payload?.data?.sex, payload?.results?.sex, payload);
  const out=[];
  if (Array.isArray(src)) {
    src.forEach(r => {
      const sex = SEX_LABELS[r.sex] || SEX_LABELS[r.name] || (/m/i.test(String(first(r.sex,r.name,r.label,"")))?"Male":/f/i.test(String(first(r.sex,r.name,r.label,"")))?"Female":"Unknown");
      const R=num(first(r.R,r.r,r.resistant));
      const I=num(first(r.I,r.i,r.intermediate));
      const S=num(first(r.S,r.s,r.susceptible));
      const total=num(first(r.total,r.count,r.n,r.tests,(R+I+S)));
      out.push({ sex, R,I,S,total });
    });
  } else if (src && typeof src==="object") {
    for (const [k,v] of Object.entries(src)) {
      const sex = SEX_LABELS[k] || (/m/i.test(k)?"Male":/f/i.test(k)?"Female":"Unknown");
      if (typeof v==="object") {
        const R=num(first(v.R,v.r,v.resistant));
        const I=num(first(v.I,v.i,v.intermediate));
        const S=num(first(v.S,v.s,v.susceptible));
        const total=num(first(v.total,v.count,v.n,v.tests,(R+I+S)));
        out.push({ sex,R,I,S,total });
      } else {
        out.push({ sex, R:0,I:0,S:0,total:num(v) });
      }
    }
  }
  return out;
}

// ---------- helpers ----------
function sum(arr, key) {
  return arr.reduce((acc, r) => acc + Number(r?.[key] || 0), 0);
}
function percent(part, whole) {
  if (!whole) return "0%";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

export default function SexAge(){
  const { filters } = useFilters();
  const [raw,setRaw]=useState(null);
  const [err,setErr]=useState(null);

  useEffect(()=>{
    sexAge(applyFilters(filters))
      .then(res => setRaw(res))
      .catch(e=>setErr(String(e)));
  },[filters]);

  const joint = useMemo(()=>extractJoint(raw),[raw]);
  const sexTotals = useMemo(()=>extractSexTotals(raw),[raw]);

  // 1) Preferred: %R by age & sex
  const groupedR = useMemo(()=>{
    const map = new Map(); // bin -> { Male:{R,I,S,total}, Female:{...}, Unknown:{...} }
    const ensure = (bin, sex) => {
      if (!map.has(bin)) map.set(bin, {});
      const row = map.get(bin);
      if (!row[sex]) row[sex] = { R:0,I:0,S:0,total:0 };
      return row[sex];
    };
    for (const r of joint){
      const bin = bandFromAge(r.ageMid);
      const sex = (r.sex==="Male"||r.sex==="Female")?r.sex:"Unknown";
      const slot = ensure(bin, sex);
      slot.R += r.R; slot.I += r.I; slot.S += r.S;
      slot.total += (r.total || (r.R+r.I+r.S));
    }
    return BIN_LABELS.map(bin => {
      const row = map.get(bin) || {};
      const m = row.Male || {R:0,I:0,S:0,total:0};
      const f = row.Female || {R:0,I:0,S:0,total:0};
      return {
        band: bin,
        Male: +pctR(m.R,m.I,m.S,m.total).toFixed(1),
        Female: +pctR(f.R,f.I,f.S,f.total).toFixed(1),
      };
    });
  },[joint]);

  const hasAnyR = groupedR.some(r => r.Male>0 || r.Female>0);

  // 2) Fallback: counts by age & sex (if no R/I/S)
  const groupedCounts = useMemo(()=>{
    const map = new Map();
    const ensure = (bin) => {
      if (!map.has(bin)) map.set(bin, { Male:0, Female:0 });
      return map.get(bin);
    };
    function keyToBin(s) {
      const m = String(s).match(/(\d+)\s*[-–to]+\s*(\d+)/i);
      if (m) {
        const mid = (Number(m[1])+Number(m[2]))/2;
        return bandFromAge(mid);
      }
      const plus = String(s).match(/(\d+)\s*\+/);
      if (plus) return bandFromAge(Number(plus[1])+5);
      const numOnly = String(s).match(/(\d+)/);
      return bandFromAge(Number(numOnly?.[1]||0));
    }
    function crawl(obj, path=[]) {
      if (Array.isArray(obj)) obj.forEach((v,i)=>crawl(v, path.concat(i)));
      else if (obj && typeof obj === "object") {
        for (const [k,v] of Object.entries(obj)) {
          if (typeof v === "number") {
            const ageKey = path.find(p => /(\d+)\s*[-–to]\s*(\d+)|\d+\+|age|band|group|range/i.test(String(p)));
            if (ageKey) {
              const bin = /(\d+)\s*[-–to]\s*(\d+)/i.test(ageKey) ? (BIN_LABELS.find(l=>l===ageKey) || keyToBin(ageKey)) : keyToBin(ageKey);
              const row = ensure(bin);
              if (k==="M"||/male/i.test(k)) row.Male += v;
              else if (k==="F"||/female/i.test(k)) row.Female += v;
            }
          } else {
            crawl(v, path.concat(k));
          }
        }
      }
    }
    crawl(raw);
    return BIN_LABELS.map(bin => {
      const row = map.get(bin) || { Male:0, Female:0 };
      return { band: bin, Male: row.Male, Female: row.Female };
    });
  },[raw]);

  // Pie: if R splits exist, show %R; else show share of tests
  const pie = useMemo(()=>{
    if (!sexTotals.length) return [];
    const hasR = sexTotals.some(s => (s.R||0)+(s.I||0)+(s.S||0) > 0);
    if (hasR) {
      return ["Male","Female"].map(sex => {
        const s = sexTotals.find(x=>x.sex===sex);
        if (!s) return null;
        return { name: sex, value: +pctR(s.R,s.I,s.S,s.total).toFixed(1), mode:"%R" };
      }).filter(Boolean);
    }
    const totalTests = sexTotals.reduce((a,b)=>a+(b.total||0),0) || 1;
    return ["Male","Female"].map(sex => {
      const s = sexTotals.find(x=>x.sex===sex);
      if (!s) return null;
      return { name: sex, value: +((100*(s.total||0))/totalTests).toFixed(1), mode:"%Tests" };
    }).filter(Boolean);
  },[sexTotals]);
  const pieMode = pie[0]?.mode || "%R";

  // Descriptive stats table (counts + R/I/S if present)
  const tableRows = useMemo(()=>{
    const bySex = { Male:{R:0,I:0,S:0,total:0}, Female:{R:0,I:0,S:0,total:0}, Unknown:{R:0,I:0,S:0,total:0} };
    sexTotals.forEach(s => {
      const key = (s.sex==="Male"||s.sex==="Female")?s.sex:"Unknown";
      bySex[key].R += s.R||0; bySex[key].I += s.I||0; bySex[key].S += s.S||0; bySex[key].total += s.total||0;
    });
    const rows = ["Male","Female","Unknown"].map(k => ({
      sex: k,
      total: bySex[k].total,
      R: bySex[k].R, I: bySex[k].I, S: bySex[k].S,
      pctR: pctR(bySex[k].R, bySex[k].I, bySex[k].S, bySex[k].total)
    }));
    const grand = rows.reduce((a,r)=>({
      total:a.total+r.total, R:a.R+r.R, I:a.I+r.I, S:a.S+r.S
    }),{total:0,R:0,I:0,S:0});
    const withPct = rows.map(r => ({...r, pct: percent(r.total, grand.total)}));
    return { rows: withPct, grand: {...grand, pctR: pctR(grand.R, grand.I, grand.S, grand.total)} };
  },[sexTotals]);

  return (
    <div>
      <h2>Sex & Age</h2>
      {err && <div style={{ background:"#fee2e2", border:"1px solid #fecaca", padding:8, borderRadius:8, marginBottom:8 }}>{err}</div>}

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
        {/* Bars */}
        <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:8, padding:8 }}>
          <h3>{hasAnyR ? "% Resistant by Age & Sex" : "Counts by Age & Sex (no R/I/S available)"}</h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={hasAnyR ? groupedR : groupedCounts} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="band" />
              <YAxis domain={hasAnyR ? [0,100] : undefined} />
              <Tooltip formatter={(v) => hasAnyR ? `${v}%` : v} />
              <Legend />
              <Bar dataKey="Male" name="Male" fill={BAR_COLORS.Male} />
              <Bar dataKey="Female" name="Female" fill={BAR_COLORS.Female} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:8, padding:8 }}>
          <h3>{pieMode === "%R" ? "% Resistant by Sex" : "Share of Tests by Sex"}</h3>
          {pie.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Tooltip formatter={(v)=>`${v}%`} />
                <Pie
                  data={pie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label={(e)=>`${e.name}: ${e.value}%`}
                >
                  {pie.map((p,i)=> <Cell key={i} fill={PIE_COLORS[p.name] || "#9ca3af"} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize:12, color:"#6b7280" }}>No sex totals found in payload.</div>
          )}
        </div>
      </div>

      {/* Descriptive stats table */}
      <div style={{ marginTop: 16, background:"#fff", border:"1px solid #eee", borderRadius:8, padding:8 }}>
        <h3>Descriptive statistics</h3>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr>
              <th style={th}>Sex</th>
              <th style={th}>Count</th>
              <th style={th}>% of Total</th>
              <th style={th}>R</th>
              <th style={th}>I</th>
              <th style={th}>S</th>
              <th style={th}>% Resistant</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.rows.map(r => (
              <tr key={r.sex}>
                <td style={td}><span style={dot(BAR_COLORS[r.sex] || "#9ca3af")} />{r.sex}</td>
                <td style={td}>{r.total}</td>
                <td style={td}>{r.pct}</td>
                <td style={td}>{r.R}</td>
                <td style={td}>{r.I}</td>
                <td style={td}>{r.S}</td>
                <td style={td}>{r.pctR.toFixed(1)}%</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...td, fontWeight: 600 }}>Total</td>
              <td style={{ ...td, fontWeight: 600 }}>{tableRows.grand.total}</td>
              <td style={{ ...td, fontWeight: 600 }}>100%</td>
              <td style={{ ...td, fontWeight: 600 }}>{tableRows.grand.R}</td>
              <td style={{ ...td, fontWeight: 600 }}>{tableRows.grand.I}</td>
              <td style={{ ...td, fontWeight: 600 }}>{tableRows.grand.S}</td>
              <td style={{ ...td, fontWeight: 600 }}>{tableRows.grand.pctR.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { textAlign: "left", borderBottom: "1px solid #eee", padding: "6px 4px", color: "#374151" };
const td = { borderBottom: "1px solid #f3f4f6", padding: "6px 4px", color: "#111827" };
const dot = (color) => ({
  display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: color, marginRight: 6, verticalAlign: "middle"
});
