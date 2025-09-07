import { useEffect, useMemo, useState } from "react";
import { fetchTimeTrend, fetchFacilities } from "../api";
import FilterBar from "../components/FilterBar";
import { ORGANISMS, ANTIBIOTICS, HOSTS, COLORS } from "../constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

function ym(date){ return date.slice(0,7); } // "YYYY-MM"
function lastMonths(n=6){
  const out=[]; const d=new Date();
  for(let i=0;i<n;i++){ const dd=new Date(d.getFullYear(), d.getMonth()-i, 1); out.push(`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}`); }
  return out;
}

export default function MonthlyCompare(){
  const [all,setAll]=useState([]);
  const [err,setErr]=useState("");
  const [facilities,setFacilities]=useState([]);
  const [filters,setFilters]=useState({ antibiotic:"", organism:"", host:"", facility:"" });
  const months = useMemo(()=>lastMonths(12).reverse(),[]);
  const [m1,setM1]=useState(months.at(-2)); // previous month
  const [m2,setM2]=useState(months.at(-1)); // current month

  useEffect(()=>{ fetchFacilities().then(setFacilities).catch(()=>{}); },[]);
  useEffect(()=>{
    fetchTimeTrend("month", { ...filters })
      .then(d=> setAll(Array.isArray(d)? d : []))
      .catch(e=>{ setErr(e.message); setAll([]); });
  },[filters]);

  function onChange(name,val){ setFilters(f=>({...f,[name]:val})); }

  const mData = useMemo(()=>{
    const lookup = Object.fromEntries((all||[]).map(r=>[r.period, r]));
    const a = lookup[m1] || { total:0, resistance_rate:0 };
    const b = lookup[m2] || { total:0, resistance_rate:0 };
    return [
      { metric: "Total tests", [m1]: a.total||0, [m2]: b.total||0 },
      { metric: "Resistance rate (%)", [m1]: Math.round((a.resistance_rate||0)*100), [m2]: Math.round((b.resistance_rate||0)*100) },
    ];
  },[all,m1,m2]);

  return (
    <div style={{padding:16}}>
      <h2>Monthly Compare</h2>
      <FilterBar
        items={[
          { name:"antibiotic", label:"Antibiotic", value:filters.antibiotic, options:ANTIBIOTICS },
          { name:"organism",   label:"Organism",   value:filters.organism,   options:ORGANISMS },
          { name:"host",       label:"Host Type",  value:filters.host,       options:HOSTS },
          { name:"facility",   label:"Facility",   value:filters.facility,   options:facilities },
        ]}
        onChange={onChange}
      />
      <div style={{display:"flex", gap:12, flexWrap:"wrap", margin:"8px 0"}}>
        <div>
          <label style={{fontSize:12,color:"#555"}}>Month A</label><br/>
          <select value={m1} onChange={e=>setM1(e.target.value)} style={sel}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:12,color:"#555"}}>Month B</label><br/>
          <select value={m2} onChange={e=>setM2(e.target.value)} style={sel}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {err && <p style={{color:"crimson"}}>{err}</p>}
      <div style={{height:340, background:"#fff", border:"1px solid #eee", borderRadius:14, padding:12}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={m1} fill={COLORS.male} />
            <Bar dataKey={m2} fill={COLORS.female} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const sel = {padding:"8px 10px", border:"1px solid #ddd", borderRadius:10, background:"#fff"};
