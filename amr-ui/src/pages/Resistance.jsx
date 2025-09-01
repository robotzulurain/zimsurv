import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'
import { isArr } from '../util/isArray'
import PercentBar from '../components/PercentBar'

export default function Resistance(){
  const [raw, setRaw] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let on=true
    setLoading(true)
    apiFetch('/api/summary/resistance-time-trend/')
      .then(d=>{ if(on) setRaw(d) })
      .catch(e=>{ if(on) setErr(String(e)) })
      .finally(()=> on && setLoading(false))
    return ()=>{ on=false }
  },[])

  const series = useMemo(()=>{
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw.series)) return raw.series
    if (Array.isArray(raw.results)) return raw.results
    return []
  },[raw])

  if (loading) return <div className="card">Loading…</div>
  if (err) return <div className="card error">Error: {err}</div>
  if (!isArr(series)) return <div className="card">No data</div>

  return (
    <section>
      <h2 className="section-title">Resistance (monthly %R)</h2>
      <div className="grid" style={{gap:12}}>
        {series.map((row, idx)=>{
          const label = row.month || row.period || row.label || `#${idx+1}`
          const pct = row.percent_R ?? row.percent ?? row.pct ?? 0
          return (
            <div key={idx} className="card">
              <div style={{fontWeight:600, marginBottom:6}}>{label}</div>
              <PercentBar value={pct} max={100} height={12} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
