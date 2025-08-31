import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

const AGE_BANDS = [
  {k:'0-4', lo:0, hi:4},
  {k:'5-14', lo:5, hi:14},
  {k:'15-24', lo:15, hi:24},
  {k:'25-44', lo:25, hi:44},
  {k:'45-64', lo:45, hi:64},
  {k:'65+', lo:65, hi:200},
]

// simple categorical palette
const PALETTE = ['#ef4444','#0ea5e9','#10b981','#f59e0b','#8b5cf6','#22c55e','#e11d48']

function uniq(arr){ return Array.from(new Set(arr.filter(Boolean).map(s=>String(s).trim()))).sort() }

function pctR(items){
  const S = items.filter(x=>x.ast==='S').length
  const I = items.filter(x=>x.ast==='I').length
  const R = items.filter(x=>x.ast==='R').length
  const N = S+I+R
  return {pct: N? (R/N)*100 : 0, S,I,R,N}
}

function computeBySex(rows){
  const buckets = {F:[], M:[], U:[]}
  rows.forEach(r => {
    const s = (r.sex||'U').toUpperCase()
    ;(buckets[s] || buckets.U).push(r)
  })
  return ['F','M','U'].map(sex => ({label: sex, ...pctR(buckets[sex])}))
}

function computeByAge(rows){
  return AGE_BANDS.map(b=>{
    const items = rows.filter(r => Number.isFinite(+r.age) && +r.age>=b.lo && +r.age<=b.hi)
    return {label:b.k, ...pctR(items)}
  })
}

export default function SexAge(){
  const [data,setData] = useState(null)
  const [organism,setOrganism] = useState('All organisms')
  const [antibiotic,setAntibiotic] = useState('All (Top 5)')
  const [limit,setLimit] = useState(1000) // pull more rows for better stats

  useEffect(()=>{
    apiFetch(`/api/lab-results/?limit=${limit}`).then(setData).catch(console.error)
  },[limit])

  const rows = data?.results || []
  const organisms = useMemo(()=> ['All organisms', ...uniq(rows.map(r=>r.organism))], [rows])
  const antibioticsAll = useMemo(()=> uniq(rows.map(r=>r.antibiotic)), [rows])
  const antibiotics = useMemo(()=> ['All (Top 5)', ...antibioticsAll], [antibioticsAll])

  // filter rows by organism
  const byOrganism = useMemo(()=> organism==='All organisms' ? rows : rows.filter(r=>r.organism===organism), [rows, organism])

  // if "All (Top 5)" pick top-5 antibiotics by N within organism; else single antibiotic
  const selection = useMemo(()=>{
    if (antibiotic !== 'All (Top 5)') {
      return {[antibiotic]: byOrganism.filter(r=>r.antibiotic===antibiotic)}
    }
    const counts = new Map()
    byOrganism.forEach(r=>{
      if(!r.antibiotic) return
      counts.set(r.antibiotic, (counts.get(r.antibiotic)||0)+1)
    })
    const top = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k])=>k)
    const res = {}
    top.forEach(ab => { res[ab] = byOrganism.filter(r=>r.antibiotic===ab) })
    return res
  }, [byOrganism, antibiotic])

  // build chart-ready series
  const sexSeries = useMemo(()=>{
    return Object.entries(selection).map(([ab,arr]) => ({
      key: ab, color: PALETTE[Math.abs(hash(ab)) % PALETTE.length],
      points: computeBySex(arr) // [{label:'F', pct, N, ...}, ...]
    }))
  }, [selection])

  const ageSeries = useMemo(()=>{
    return Object.entries(selection).map(([ab,arr]) => ({
      key: ab, color: PALETTE[Math.abs(hash(ab)) % PALETTE.length],
      points: computeByAge(arr) // [{label:'0-4', pct, N, ...}, ...]
    }))
  }, [selection])

  const totalN = useMemo(()=> Object.values(selection).reduce((sum,arr)=> sum + arr.length, 0), [selection])

  return (
    <div className="grid">
      <section className="card">
        <h2 className="section-title">Compare %R by Sex & Age</h2>
        <div className="selects">
          <select value={organism} onChange={e=>setOrganism(e.target.value)}>
            {organisms.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
          <select value={antibiotic} onChange={e=>setAntibiotic(e.target.value)}>
            {antibiotics.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <select value={String(limit)} onChange={e=>setLimit(+e.target.value)}>
            {[200,500,1000,2000].map(n=><option key={n} value={n}>limit {n}</option>)}
          </select>
          <span className="badge">N (all selected): {totalN}</span>
        </div>

        <div className="grid grid-2" style={{marginTop:12}}>
          <div className="card">
            <h3 className="section-title">%R by Sex</h3>
            <GroupedBars series={sexSeries} yMax={100} unit="%" />
            <Legend series={sexSeries}/>
          </div>

          <div className="card">
            <h3 className="section-title">%R by Age Band</h3>
            <GroupedBars series={ageSeries} yMax={100} unit="%" />
            <Legend series={ageSeries}/>
          </div>
        </div>

        <details style={{marginTop:12}}>
          <summary className="small">Details (per group)</summary>
          <DataTable series={sexSeries} title="Sex groups"/>
          <DataTable series={ageSeries} title="Age bands"/>
        </details>
      </section>
    </div>
  )
}

// small hash for stable color indexing
function hash(s){ let h=0; for(let i=0;i<s.length;i++){ h=(h<<5)-h + s.charCodeAt(i); h|=0 } return h }

// Legend
function Legend({series}){
  if(!series?.length) return null
  return (
    <div className="legend" style={{flexWrap:'wrap'}}>
      {series.map(s=>(
        <span key={s.key} style={{display:'inline-flex',alignItems:'center',gap:6,marginRight:10,marginTop:6}}>
          <span className="swatch" style={{background:s.color}}></span>
          <span className="small">{s.key}</span>
        </span>
      ))}
    </div>
  )
}

// Data table
function DataTable({series, title}){
  const labels = series[0]?.points?.map(p=>p.label) || []
  return (
    <div className="card" style={{marginTop:12}}>
      <h4 className="section-title">{title}</h4>
      <table className="table">
        <thead>
          <tr>
            <th>Group</th>
            {series.map(s=> <th key={s.key}>{s.key} %R</th>)}
            {series.map(s=> <th key={s.key+'N'}>{s.key} N</th>)}
          </tr>
        </thead>
        <tbody>
          {labels.map(lbl=>{
            return (
              <tr key={lbl}>
                <td>{lbl}</td>
                {series.map(s=>{
                  const p = s.points.find(x=>x.label===lbl) || {pct:0,N:0}
                  return <td key={s.key+lbl}>{Math.round(p.pct)}%</td>
                })}
                {series.map(s=>{
                  const p = s.points.find(x=>x.label===lbl) || {pct:0,N:0}
                  return <td key={s.key+lbl+'n'}>{p.N}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Grouped bar chart (nice rounded bars + tooltip)
function GroupedBars({series, yMax=100, unit=''}){
  const labels = series[0]?.points?.map(p=>p.label) || []
  const width = Math.max(560, labels.length*90 + 80)
  const height = 260, padL=40, padB=28, padT=12, padR=12
  const innerW = width - padL - padR
  const innerH = height - padT - padB
  const xStep = innerW / Math.max(1, labels.length)
  const groupPad = 0.18 // % of xStep
  const barW = (xStep*(1-groupPad)) / Math.max(1, series.length)

  const [tip,setTip] = useState(null)

  return (
    <div style={{position:'relative', overflowX:'auto'}}>
      {tip && (
        <div className="tooltip" style={{left: tip.x, top: tip.y}}>
          <strong>{tip.series}</strong><br/>
          {tip.label}: {Math.round(tip.value)}{unit} <span className="small">(N={tip.N})</span>
        </div>
      )}
      <svg width={width} height={height} style={{maxWidth:'100%'}}>
        <defs>
          <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodOpacity="0.15"/>
          </filter>
        </defs>
        <g transform={`translate(${padL},${padT})`}>
          {/* Y grid + axis */}
          {[0,0.25,0.5,0.75,1].map(t=>{
            const y = innerH - t*innerH
            const v = Math.round(yMax*t)
            return (
              <g key={t}>
                <line x1={0} y1={y} x2={innerW} y2={y} stroke="#e5e7eb"/>
                <text x={-8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#64748b">{v}{unit}</text>
              </g>
            )
          })}
          {/* Bars */}
          {labels.map((lbl,i)=>{
            const gx = i*xStep + xStep*groupPad/2
            return (
              <g key={lbl} transform={`translate(${gx},0)`}>
                <text x={xStep/2 - xStep*groupPad/2} y={innerH+14} textAnchor="middle" fontSize="10" fill="#64748b">{lbl}</text>
                {series.map((s,si)=>{
                  const p = s.points.find(x=>x.label===lbl) || {pct:0,N:0}
                  const h = innerH * (Math.min(yMax,p.pct)/yMax)
                  const x = si*barW
                  const y = innerH - h
                  return (
                    <g key={s.key} transform={`translate(${x},0)`}>
                      <rect
                        x={0} y={y} width={barW-4} height={h}
                        rx="6" fill={s.color} filter="url(#barShadow)"
                        onMouseEnter={(e)=>{
                          const bounds = e.currentTarget.closest('svg').getBoundingClientRect()
                          setTip({
                            x: e.clientX - bounds.left,
                            y: e.clientY - bounds.top - 12,
                            label: lbl, value:p.pct, N:p.N, series:s.key
                          })
                        }}
                        onMouseLeave={()=>setTip(null)}
                      />
                      <text x={(barW-4)/2} y={y-6} textAnchor="middle" fontSize="10" fill="#111827">{Math.round(p.pct)}{unit}</text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
