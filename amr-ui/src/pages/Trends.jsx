import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'
import { isArr } from '../util/isArray'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts'

function monthKey(dstr){
  // expects "YYYY-MM-DD" or "YYYY-MM" -> returns "YYYY-MM"
  if (!dstr) return 'Unknown'
  const s = String(dstr)
  return s.length>=7 ? s.slice(0,7) : s
}

function aggregate(rows, dim){
  // dim: 'organism' | 'antibiotic' | 'host_type'
  const byMonth = new Map()
  for(const r of rows){
    const m = monthKey(r.test_date || r.date)
    const key = (r[dim] || r[dim.replace('_type','')] || 'Unknown')
    if (!byMonth.has(m)) byMonth.set(m, {})
    const obj = byMonth.get(m)
    obj[key] = (obj[key] || 0) + 1
  }
  // pick top 5 keys globally
  const counts = {}
  for(const obj of byMonth.values()){
    for(const [k,v] of Object.entries(obj)){
      counts[k] = (counts[k] || 0) + v
    }
  }
  const topKeys = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k])=>k)
  // build recharts data array
  const months = [...byMonth.keys()].sort()
  return months.map(m=>{
    const obj = byMonth.get(m)
    const row = { month: m }
    for(const k of topKeys) row[k] = obj[k] || 0
    return row
  })
}

export default function Trends(){
  const [dim,setDim] = useState('organism') // 'organism' | 'antibiotic' | 'host_type'
  const [raw,setRaw]=useState(null)
  const [loading,setLoading]=useState(true)
  const [err,setErr]=useState(null)

  useEffect(()=>{
    let on=true
    setLoading(true)
    // always pull lab-results to compute monthly series locally
    apiFetch('/api/lab-results/')
      .then(d=>{ if(on) setRaw(Array.isArray(d)?d:(d.results||[])) })
      .catch(e=>{ if(on) setErr(String(e)) })
      .finally(()=> on && setLoading(false))
    return ()=>{ on=false }
  },[])

  const data = useMemo(()=>{
    if (!isArr(raw)) return []
    return aggregate(raw, dim)
  },[raw, dim])

  const categories = useMemo(()=>{
    if (!isArr(data)) return []
    const keys = new Set()
    data.forEach(row=>{
      Object.keys(row).forEach(k=>{ if(k!=='month') keys.add(k) })
    })
    return [...keys]
  },[data])

  if (loading) return <div className="card">Loading…</div>
  if (err) return <div className="card error">Error: {err}</div>
  if (!isArr(data) || data.length===0) return <div className="card">No data</div>

  return (
    <section>
      <h2 className="section-title">Trends</h2>
      <div className="card" style={{display:'flex',gap:8,alignItems:'center'}}>
        <span className="small">Dimension:</span>
        <select value={dim} onChange={e=>setDim(e.target.value)}>
          <option value="organism">Organism</option>
          <option value="antibiotic">Antibiotic</option>
          <option value="host_type">Host</option>
        </select>
      </div>

      <div className="card" style={{height:380}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{top:10,right:20,left:0,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {categories.map((k,i)=>(
              <Bar key={k} dataKey={k} stackId={undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
