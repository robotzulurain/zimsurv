import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

const HOSTS = ['', 'human','animal','environment']

export default function Resistance(){
  const [host,setHost]=useState('')
  const [rows,setRows]=useState(null)
  const [err,setErr]=useState(null)

  useEffect(()=>{
    setRows(null); setErr(null)
    const qs = host? `?host=${encodeURIComponent(host)}` : ''
    apiFetch(`/api/summary/antibiogram/${qs}`).then(setRows).catch(e=>setErr(String(e)))
  },[host])

  const groups = useMemo(()=>{
    if(!rows) return {}
    const g = {}
    rows.forEach(r=>{
      if(!g[r.organism]) g[r.organism]=[]
      g[r.organism].push(r)
    })
    return g
  },[rows])

  const antibiotics = useMemo(()=>{
    if(!rows) return []
    const set = new Set(rows.map(r=>r.antibiotic))
    return Array.from(set)
  },[rows])

  return (
    <section className="column" style={{gap:12}}>
      <div className="row" style={{justifyContent:'space-between',alignItems:'center'}}>
        <h2 className="section-title">Resistance</h2>
        <label className="small" style={{display:'flex',alignItems:'center',gap:6}}>
          <span>Host</span>
          <select value={host} onChange={e=>setHost(e.target.value)}>
            {HOSTS.map((h,i)=><option key={i} value={h}>{h||'All'}</option>)}
          </select>
        </label>
      </div>

      {err && <div className="error">Error: {err}</div>}
      {!rows && !err && <div className="muted">Loading…</div>}
      {rows && rows.length===0 && <div className="muted">No data</div>}

      {rows && rows.length>0 && (
        <>
          {/* Compare table */}
          <div className="card">
            <h3 className="small muted" style={{marginBottom:8}}>Compare (Top %R)</h3>
            <table className="table">
              <thead>
                <tr><th>Organism</th><th>Antibiotic</th><th>Total</th><th>Resistant</th><th>%R</th></tr>
              </thead>
              <tbody>
                {rows
                  .slice()
                  .sort((a,b)=>b.percent_R-a.percent_R)
                  .slice(0,10)
                  .map((r,idx)=>(
                    <tr key={idx}>
                      <td>{r.organism}</td>
                      <td>{r.antibiotic}</td>
                      <td>{r.total}</td>
                      <td>{r.resistant}</td>
                      <td>{Math.round(r.percent_R)}%</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Heatmap-ish grid */}
          <div className="card">
            <h3 className="small muted" style={{marginBottom:8}}>Heatmap (%R)</h3>
            <div className="small muted" style={{marginBottom:6}}>darker = higher %R</div>
            <div className="overflow-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>Organism \\ Antibiotic</th>
                    {antibiotics.map(a=><th key={a}>{a}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groups).map(([org, list])=>{
                    const byAbx = Object.fromEntries(list.map(r=>[r.antibiotic, r]))
                    return (
                      <tr key={org}>
                        <td>{org}</td>
                        {antibiotics.map(abx=>{
                          const cell = byAbx[abx]
                          const pct = cell? cell.percent_R : 0
                          const shade = Math.min(100, Math.max(0, Math.round(pct))) // 0-100
                          // simple shade using HSL lightness
                          const bg = `hsl(215 80% ${100 - shade/1.5}%)`
                          const color = shade>60? '#fff' : '#111'
                          return (
                            <td key={abx} style={{background:bg, color, textAlign:'center'}}>
                              {cell? `${Math.round(pct)}%`:'–'}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
