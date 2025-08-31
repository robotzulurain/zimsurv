import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api';
import HostFilter from '../components/HostFilter';
import { useLookup } from '../hooks/useLookup';
import { colorFor } from '../utils/colors';
import {
  ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, CartesianGrid
} from 'recharts';

export default function Antibiogram(){
  const organisms = useLookup('/lookups/organisms/');
  const antibiotics = useLookup('/lookups/antibiotics/');

  const [host, setHost] = useState('');
  const [organism, setOrganism] = useState('');
  const [antibiotic, setAntibiotic] = useState('');
  const [rows, setRows] = useState([]);

  async function load(){
    const p = new URLSearchParams();
    if (host) p.set('host_type', host);
    if (organism) p.set('organism', organism);
    if (antibiotic) p.set('antibiotic', antibiotic);
    const j = await apiFetch('/api/summary/antibiogram/' + (p.toString()?`?${p}`:''));
    setRows(Array.isArray(j)? j: []);
  }

  useEffect(()=>{ load(); },[host, organism, antibiotic]);

  // Build %R by antibiotic (or organism) for chart
  const { chartData, xKey, seriesKeys } = useMemo(()=>{
    // Choose x-axis: if organism filter is chosen, show antibiotics on x; else show organisms on x
    const x = organism ? 'antibiotic' : 'organism';
    const grouped = new Map();
    rows.forEach(r=>{
      const key = r[x] || 'Unknown';
      if (!grouped.has(key)) grouped.set(key, { [x]: key, pctR: 0, total:0 });
      const it = grouped.get(key);
      it.total += r.total || 0;
      it.pctR += (r.pctR || 0) * (r.total || 0); // weighted average by total
    });
    const data = Array.from(grouped.values()).map(d=>({
      [x]: d[x],
      pctR: d.total ? +(d.pctR / d.total).toFixed(2) : 0
    }));
    const keys = ['pctR'];
    return { chartData: data, xKey: x, seriesKeys: keys };
  },[rows, organism]);

  return (
    <div style={{maxWidth:1100, margin:'0 auto'}}>
      <h2>Antibiogram</h2>

      <div style={{display:'flex', flexWrap:'wrap', gap:12, alignItems:'center', marginBottom:10}}>
        <HostFilter value={host} onChange={setHost} />

        <label style={{display:'inline-flex', gap:8, alignItems:'center'}}>
          <span>Organism</span>
          <input list="orgs" value={organism} onChange={e=>setOrganism(e.target.value)} placeholder="All organisms" />
          <datalist id="orgs">
            {(organisms||[]).map(o=><option key={o} value={o} />)}
          </datalist>
        </label>

        <label style={{display:'inline-flex', gap:8, alignItems:'center'}}>
          <span>Antibiotic</span>
          <input list="abx" value={antibiotic} onChange={e=>setAntibiotic(e.target.value)} placeholder="All antibiotics" />
          <datalist id="abx">
            {(antibiotics||[]).map(a=><option key={a} value={a} />)}
          </datalist>
        </label>

        <button onClick={()=>{ setHost(''); setOrganism(''); setAntibiotic(''); }}>
          Reset
        </button>
      </div>

      <div style={{height:360, border:'1px solid #eee', borderRadius:8, padding:8, marginBottom:12}}>
        {(chartData.length>0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip formatter={(v)=> `${v}% R`} />
              <Legend />
              {seriesKeys.map(k=>(
                <Bar key={k} dataKey={k} fill={colorFor(k)} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : <div style={{padding:8}}>No data for selected filters.</div>}
      </div>

      <details>
        <summary>Raw antibiogram</summary>
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse', width:'100%', marginTop:8}}>
            <thead>
              <tr>
                <th style={th}>Organism</th>
                <th style={th}>Antibiotic</th>
                <th style={th}>Total</th>
                <th style={th}>S</th>
                <th style={th}>I</th>
                <th style={th}>R</th>
                <th style={th}>%R</th>
              </tr>
            </thead>
            <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td style={td}>{r.organism}</td>
                <td style={td}>{r.antibiotic}</td>
                <td style={td}>{r.total}</td>
                <td style={td}>{r.S}</td>
                <td style={td}>{r.I}</td>
                <td style={td}>{r.R}</td>
                <td style={td}>{r.pctR}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
const th = {borderBottom:'2px solid #ddd', textAlign:'left', padding:'6px 8px'};
const td = {borderBottom:'1px solid #eee', textAlign:'left', padding:'6px 8px'};
