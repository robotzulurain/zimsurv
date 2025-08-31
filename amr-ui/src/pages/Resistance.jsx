import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

function pctColor(p){
  // 0% -> green, 50% -> orange, 100% -> red
  const hue = 120 - Math.max(0, Math.min(100, p||0)) * 1.2; // 120..0
  return `hsl(${hue},85%,55%)`
}

export default function Resistance(){
  const [host,setHost]=useState('all')
  const [tab,setTab]=useState('heatmap')
  const [data,setData]=useState(null)

  async function load(h){
    const q = h==='all' ? 'all' : h
    const d = await apiFetch(`/api/summary/antibiogram/?host_type=${q}`)
    setData(d)
  }
  useEffect(()=>{ load(host).catch(console.error) },[host])

  const flat = useMemo(()=>{
    if(!data?.matrix || !data?.organisms || !data?.antibiotics) return []
    const rows = []
    for(let r=0;r<data.organisms.length;r++){
      for(let c=0;c<data.antibiotics.length;c++){
        const cell = data.matrix[r]?.[c] || {S:0,I:0,R:0,N:0,pctR:null}
        rows.push({
          organism:data.organisms[r],
          antibiotic:data.antibiotics[c],
          pctR: cell.pctR==null ? null : +cell.pctR,
          N: +cell.N || 0
        })
      }
    }
    return rows
  },[data])

  return (
    <section className="card">
      <h2 className="section-title">Resistance</h2>
      <div className="selects">
        <select value={host} onChange={e=>setHost(e.target.value)}>
          <option value="all">All hosts</option>
          <option value="human">Human</option>
          <option value="animal">Animal</option>
          <option value="environment">Environment</option>
        </select>
      </div>

      <div className="subtabs">
        <button className={`subtab ${tab==='heatmap'?'active':''}`} onClick={()=>setTab('heatmap')}>Heatmap (%R)</button>
        <button className={`subtab ${tab==='compare'?'active':''}`} onClick={()=>setTab('compare')}>Compare (Top %R)</button>
      </div>

      {!data && <div className="small">Loading…</div>}
      {data && tab==='heatmap' && (
        <Heatmap organisms={data.organisms} antibiotics={data.antibiotics} matrix={data.matrix}/>
      )}
      {data && tab==='compare' && (
        <Compare rows={flat}/>
      )}
    </section>
  )
}

function Heatmap({organisms, antibiotics, matrix}){
  const cellW = 90, cellH = 28
  return (
    <div style={{overflowX:'auto'}}>
      <table className="table" style={{minWidth: antibiotics.length*cellW+140}}>
        <thead>
          <tr>
            <th>Organism</th>
            {antibiotics.map(a=><th key={a}>{a}</th>)}
          </tr>
        </thead>
        <tbody>
          {organisms.map((org,ri)=>(
            <tr key={org}>
              <td><strong>{org}</strong></td>
              {antibiotics.map((abx,ci)=>{
                const cell = matrix[ri]?.[ci] || {pctR:null,N:0}
                const p = cell.pctR==null ? null : +cell.pctR
                const bg = p==null ? '#f1f5f9' : pctColor(p)
                const label = p==null ? '—' : `${Math.round(p)}%`
                return (
                  <td key={abx} title={`%R: ${label} • N=${cell.N||0}`}>
                    <div style={{background:bg, color:'#111827', borderRadius:6, padding:'4px 6px', textAlign:'center'}}>
                      {label} <span className="small">({cell.N||0})</span>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Compare({rows}){
  const filtered = rows.filter(r=>r.pctR!=null && r.N>0)
  filtered.sort((a,b)=> b.pctR - a.pctR || b.N - a.N)
  const top = filtered.slice(0,15)
  return (
    <div className="grid">
      <table className="table">
        <thead>
          <tr><th>#</th><th>Organism</th><th>Antibiotic</th><th>%R</th><th>N</th></tr>
        </thead>
        <tbody>
          {top.map((r,i)=>(
            <tr key={i}>
              <td>{i+1}</td><td>{r.organism}</td><td>{r.antibiotic}</td><td>{Math.round(r.pctR)}%</td><td>{r.N}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
