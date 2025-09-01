import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'
import { isArr } from '../util/isArray'
import PercentBar from '../components/PercentBar'

function useAntibiogram(){
  const [raw,setRaw]=useState(null)
  const [loading,setLoading]=useState(true)
  const [err,setErr]=useState(null)
  useEffect(()=>{
    let on=true
    setLoading(true)
    apiFetch('/api/summary/antibiogram/')
      .then(d=>{ if(on) setRaw(d) })
      .catch(e=>{ if(on) setErr(String(e)) })
      .finally(()=> on && setLoading(false))
    return ()=>{ on=false }
  },[])
  return { raw, loading, err }
}

function normalizeRows(raw){
  if (!raw) return []
  const arr = Array.isArray(raw) ? raw
            : Array.isArray(raw.results) ? raw.results
            : Array.isArray(raw.rows) ? raw.rows
            : []
  return arr.map(r=>{
    const organism   = r.organism || r.org || r.o || ''
    const antibiotic = r.antibiotic || r.abx || r.ab || ''
    const total      = r.total ?? r.n ?? r.count ?? 0
    const resistant  = r.resistant ?? r.R ?? r.r ?? 0
    const percent_R  = r.percent_R ?? r.R_pct ?? r.r_pct ?? (total ? (resistant/total*100) : 0)
    return { organism, antibiotic, total, resistant, percent_R }
  }).filter(x=>x.organism && x.antibiotic)
}

function Heatmap({ rows }){
  const organisms  = useMemo(()=> [...new Set(rows.map(r=>r.organism))], [rows])
  const antibiotics= useMemo(()=> [...new Set(rows.map(r=>r.antibiotic))], [rows])
  const cell = (org,ab)=>{
    const hit = rows.find(r=>r.organism===org && r.antibiotic===ab)
    const v = hit ? Math.round(hit.percent_R) : null
    const bg = v==null ? '#f8f8f8'
      : `hsl(${(100-v)*1.2}, 70%, ${45 + (100-v)*0.2}%)` // greener for low R, redder for high R
    return {v, bg}
  }
  return (
    <div className="card" style={{overflowX:'auto'}}>
      <table className="table">
        <thead>
          <tr>
            <th>Organism \\ Antibiotic</th>
            {antibiotics.map(ab=> <th key={ab}>{ab}</th>)}
          </tr>
        </thead>
        <tbody>
          {organisms.map(org=>(
            <tr key={org}>
              <td style={{fontWeight:600}}>{org}</td>
              {antibiotics.map(ab=>{
                const c = cell(org,ab)
                return (
                  <td key={ab} title={`${org} vs ${ab}: ${c.v ?? '—'}% R`} style={{background:c.bg, textAlign:'center', minWidth:64}}>
                    {c.v==null ? '—' : `${c.v}%`}
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

function Compare({ rows, topN=10, minN=1 }){
  const ranked = useMemo(()=>{
    return rows
      .filter(r=> (r.total ?? 0) >= minN)
      .sort((a,b)=> (b.percent_R ?? 0) - (a.percent_R ?? 0))
      .slice(0, topN)
  },[rows, topN, minN])
  if (!isArr(ranked)) return <div className="card">No data</div>
  return (
    <div className="grid" style={{gap:12}}>
      {ranked.map((r,i)=>(
        <div key={i} className="card">
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <div style={{fontWeight:600}}>{r.organism} × {r.antibiotic}</div>
            <div className="small" style={{opacity:.7}}>n={r.total ?? 0}</div>
          </div>
          <PercentBar value={r.percent_R ?? 0} max={100} height={12} />
        </div>
      ))}
    </div>
  )
}

export default function Resistance(){
  const [tab,setTab]=useState('heatmap') // 'heatmap' | 'compare'
  const { raw, loading, err } = useAntibiogram()
  const rows = useMemo(()=> normalizeRows(raw), [raw])

  return (
    <section>
      <h2 className="section-title">Resistance</h2>

      <div className="card" style={{display:'flex',gap:8}}>
        <button className={`subtab ${tab==='heatmap'?'active':''}`} onClick={()=>setTab('heatmap')}>Heatmap (%R)</button>
        <button className={`subtab ${tab==='compare'?'active':''}`} onClick={()=>setTab('compare')}>Compare (Top %R)</button>
      </div>

      {loading && <div className="card">Loading…</div>}
      {err && <div className="card error">Error: {err}</div>}
      {!loading && !err && !isArr(rows) && <div className="card">No data</div>}

      {!loading && !err && isArr(rows) && (
        tab==='heatmap' ? <Heatmap rows={rows}/> : <Compare rows={rows} topN={12} minN={1}/>
      )}
    </section>
  )
}
