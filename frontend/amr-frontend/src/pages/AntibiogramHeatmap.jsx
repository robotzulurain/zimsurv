import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api';

function hueForPctR(pctR){
  // 0%R = green (120), 100%R = red (0)
  const hue = Math.max(0, Math.min(120, 120 - (pctR||0)*1.2));
  return `hsl(${hue}, 70%, 55%)`;
}

export default function AntibiogramHeatmap(){
  const [cells, setCells] = useState([]);
  const [organism, setOrganism] = useState('');
  const [antibiotic, setAntibiotic] = useState('');

  async function load(){
    const p = new URLSearchParams();
    if (organism) p.set('organism', organism);
    if (antibiotic) p.set('antibiotic', antibiotic);
    const q = p.toString() ? `?${p.toString()}` : '';
    const j = await apiFetch(`/api/summary/antibiogram-matrix/${q}`);
    setCells(Array.isArray(j) ? j : []);
  }

  useEffect(()=>{ load(); /* initial */ }, []); // eslint-disable-line

  const organisms = useMemo(
    () => Array.from(new Set(cells.map(c=>c.organism))).sort((a,b)=>a.localeCompare(b)),
    [cells]
  );
  const antibiotics = useMemo(
    () => Array.from(new Set(cells.map(c=>c.antibiotic))).sort((a,b)=>a.localeCompare(b)),
    [cells]
  );
  const map = useMemo(()=>{
    const m = new Map();
    cells.forEach(c => m.set(`${c.organism}||${c.antibiotic}`, c));
    return m;
  },[cells]);

  function downloadPdf(){
    const p = new URLSearchParams();
    if (organism) p.set('organism', organism);
    if (antibiotic) p.set('antibiotic', antibiotic);
    const q = p.toString() ? `?${p.toString()}` : '';
    window.open(`/api/summary/antibiogram.pdf${q}`, '_blank');
  }

  return (
    <div style={{maxWidth: '100%', margin:'0 auto', padding:'0 12px'}}>
      <h2>Antibiogram Heatmap</h2>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', margin:'8px 0 12px'}}>
        <input value={organism} onChange={e=>setOrganism(e.target.value)} placeholder="Filter organism (optional)" style={{padding:8, minWidth:220}}/>
        <input value={antibiotic} onChange={e=>setAntibiotic(e.target.value)} placeholder="Filter antibiotic (optional)" style={{padding:8, minWidth:220}}/>
        <button onClick={load} style={{padding:'8px 12px'}}>Apply</button>
        <button onClick={()=>{ setOrganism(''); setAntibiotic(''); setTimeout(load,0); }} style={{padding:'8px 12px'}}>Clear</button>
        <button onClick={downloadPdf} style={{padding:'8px 12px'}}>Open PDF</button>
      </div>

      {!cells.length ? (
        <div>No data</div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse', minWidth: 600}}>
            <thead>
              <tr>
                <th style={{position:'sticky', left:0, background:'#fafafa', zIndex:1, border:'1px solid #ddd', padding:'6px 8px'}}>Organism \\ Antibiotic</th>
                {antibiotics.map(ab=>(
                  <th key={ab} style={{border:'1px solid #ddd', padding:'6px 8px', whiteSpace:'nowrap'}}>{ab}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {organisms.map(org=>(
                <tr key={org}>
                  <th style={{position:'sticky', left:0, background:'#fafafa', zIndex:1, border:'1px solid #ddd', padding:'6px 8px', textAlign:'left', whiteSpace:'nowrap'}}>{org}</th>
                  {antibiotics.map(ab=>{
                    const k = `${org}||${ab}`;
                    const cell = map.get(k);
                    const pctR = cell ? cell.pctR : null;
                    const title = cell ? `${pctR}% R (n=${cell.total}, S=${cell.S}, I=${cell.I}, R=${cell.R})` : 'no data';
                    return (
                      <td key={ab} title={title} style={{
                        border:'1px solid #ddd',
                        padding:'6px 8px',
                        textAlign:'center',
                        minWidth: 90,
                        background: pctR==null ? '#f2f2f2' : hueForPctR(pctR),
                        color:'#111',
                        fontWeight: 600
                      }}>
                        {pctR==null ? '-' : `${pctR}%`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
