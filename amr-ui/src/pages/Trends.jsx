import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

// Nice base colors + gradients for depth
const COLORS = { S:'#10b981', I:'#f59e0b', R:'#ef4444' }
const ORDER  = ['S','I','R'] // bottom -> top
const fmtMonth = (m)=> `${String(m).split('-')[0]}-${String(m).split('-')[1]||'01'}`
const uniq = (arr)=> Array.from(new Set(arr.filter(Boolean))).sort()

export default function Trends(){
  const [host, setHost] = useState('all')
  const [raw, setRaw] = useState([])
  const [organism, setOrganism] = useState('All organisms')
  const [antibiotic, setAntibiotic] = useState('All antibiotics')
  const [metric, setMetric] = useState('Counts') // Counts | Percent

  // fetch data
  useEffect(()=>{
    const q = host==='all' ? '' : `?host_type=${host}`
    apiFetch(`/api/summary/resistance-time-trend/${q}`)
      .then(d => setRaw(Array.isArray(d)? d : []))
      .catch(console.error)
  }, [host])

  const organisms = useMemo(() => ['All organisms', ...uniq(raw.map(r=>r.organism))], [raw])
  const antibiotics = useMemo(() => ['All antibiotics', ...uniq(raw.map(r=>r.antibiotic))], [raw])

  const filtered = useMemo(() => raw.filter(r =>
    (organism==='All organisms' || r.organism===organism) &&
    (antibiotic==='All antibiotics' || r.antibiotic===antibiotic)
  ), [raw, organism, antibiotic])

  const monthly = useMemo(()=>{
    const map = new Map()
    for(const r of filtered){
      const m = fmtMonth(r.month)
      const cur = map.get(m) || {S:0,I:0,R:0,Total:0}
      cur.S += +r.S||0; cur.I += +r.I||0; cur.R += +r.R||0
      cur.Total += (+r.S||0)+(+r.I||0)+(+r.R||0)
      map.set(m, cur)
    }
    const out = Array.from(map.entries())
      .map(([m,v])=>({month:m, ...v}))
      .sort((a,b)=> a.month < b.month ? -1 : 1)
    for(const o of out){
      const N = o.Total || 1
      o.pS = (o.S/N)*100; o.pI = (o.I/N)*100; o.pR = (o.R/N)*100
    }
    return out
  }, [filtered])

  const yMaxCounts = Math.max(10, ...monthly.map(d=>d.Total))
  const dims = { h: 300, pad:{l:52,r:16,t:18,b:38} }
  const width = Math.max(720, monthly.length*62 + dims.pad.l + dims.pad.r)
  const innerW = width - dims.pad.l - dims.pad.r
  const innerH = dims.h - dims.pad.t - dims.pad.b
  const xStep  = innerW / Math.max(1, monthly.length)

  return (
    <section className="card">
      <h2 className="section-title">Trends — S/I/R per month</h2>

      <div className="selects">
        <select value={host} onChange={e=>setHost(e.target.value)}>
          <option value="all">All hosts</option>
          <option value="human">Human</option>
          <option value="animal">Animal</option>
          <option value="environment">Environment</option>
        </select>
        <select value={organism} onChange={e=>setOrganism(e.target.value)}>
          {organisms.map(o=> <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={antibiotic} onChange={e=>setAntibiotic(e.target.value)}>
          {antibiotics.map(a=> <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={metric} onChange={e=>setMetric(e.target.value)}>
          {['Counts','Percent'].map(m=> <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="badge">Months: {monthly.length}</span>
      </div>

      <PrettyStacked
        data={monthly}
        metric={metric}
        yMaxCounts={yMaxCounts}
        width={width}
        height={dims.h}
        pad={dims.pad}
        xStep={xStep}
      />

      <div className="legend">
        <span className="swatch" style={{background:COLORS.S}}></span><span className="small">S</span>
        <span className="swatch" style={{background:COLORS.I}}></span><span className="small">I</span>
        <span className="swatch" style={{background:COLORS.R}}></span><span className="small">R</span>
        <span className="badge">Metric: {metric}</span>
      </div>
    </section>
  )
}

function PrettyStacked({data, metric, yMaxCounts, width, height, pad, xStep}){
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const yMax = metric==='Counts' ? yMaxCounts : 100
  const yScale = v => innerH * (v / yMax)

  const [tip,setTip] = useState(null)
  const barRadius = 7

  return (
    <div style={{position:'relative', overflowX:'auto'}}>
      {tip && (
        <div className="tooltip" style={{left: tip.x, top: tip.y}}>
          <strong>{tip.month}</strong><br/>
          {tip.metric==='Counts' ? (
            <>
              <span className="small">S:</span> {tip.S}&nbsp;
              <span className="small">I:</span> {tip.I}&nbsp;
              <span className="small">R:</span> {tip.R}<br/>
              <span className="small">Total:</span> {tip.Total}
            </>
          ) : (
            <>
              <span className="small">%S:</span> {Math.round(tip.pS)}%&nbsp;
              <span className="small">%I:</span> {Math.round(tip.pI)}%&nbsp;
              <span className="small">%R:</span> {Math.round(tip.pR)}%<br/>
              <span className="small">N:</span> {tip.Total}
            </>
          )}
        </div>
      )}

      <svg width={width} height={height} style={{maxWidth:'100%'}}>
        <defs>
          {/* soft shadow */}
          <filter id="barSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodOpacity="0.18"/>
          </filter>

          {/* subtle gradients */}
          <linearGradient id="gradS" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={COLORS.S} stopOpacity="0.95"/>
            <stop offset="100%" stopColor={COLORS.S} stopOpacity="0.75"/>
          </linearGradient>
          <linearGradient id="gradI" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={COLORS.I} stopOpacity="0.95"/>
            <stop offset="100%" stopColor={COLORS.I} stopOpacity="0.75"/>
          </linearGradient>
          <linearGradient id="gradR" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={COLORS.R} stopOpacity="0.95"/>
            <stop offset="100%" stopColor={COLORS.R} stopOpacity="0.75"/>
          </linearGradient>
        </defs>

        <g transform={`translate(${pad.l},${pad.t})`}>
          {/* Y grid */}
          {[0,0.25,0.5,0.75,1].map(t=>{
            const y = innerH - t*innerH
            const v = Math.round(yMax*t)
            return (
              <g key={t}>
                <line x1={0} y1={y} x2={innerW} y2={y} stroke="#e5e7eb" strokeDasharray="4 4"/>
                <text x={-10} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#64748b">
                  {v}{metric==='Percent' ? '%' : ''}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {data.map((d,i)=>{
            const x = i*xStep + xStep*0.22
            const bw = xStep*0.56

            const vals = metric==='Counts'
              ? { S:d.S, I:d.I, R:d.R }
              : { S:d.pS, I:d.pI, R:d.pR }

            const hS = yScale(vals.S)
            const hI = yScale(vals.I)
            const hR = yScale(vals.R)

            const yR = innerH - hR
            const yI = innerH - (hR + hI)
            const yS = innerH - (hR + hI + hS)

            // display value labels if there's space
            const showLabel = (h)=> h > 18

            return (
              <g key={d.month}
                 transform={`translate(${x},0)`}
                 onMouseMove={(e)=>{
                   const bounds = e.currentTarget.closest('svg').getBoundingClientRect()
                   setTip({ x: e.clientX - bounds.left, y: e.clientY - bounds.top - 12, metric, ...d })
                 }}
                 onMouseLeave={()=>setTip(null)}
              >
                {/* hover halo */}
                <rect x={-6} y={0} width={bw+12} height={innerH} fill="transparent"/>

                {/* R layer */}
                <rect x={0} y={yR} width={bw} height={hR} rx={barRadius} fill="url(#gradR)" filter="url(#barSoft)"/>
                {showLabel(hR) && <text x={bw/2} y={yR+12} textAnchor="middle" fontSize="10" fill="#111827">{metric==='Counts'? d.R : Math.round(d.pR)+'%'}</text>}

                {/* I layer */}
                <rect x={0} y={yI} width={bw} height={hI} rx={barRadius} fill="url(#gradI)" filter="url(#barSoft)"/>
                {showLabel(hI) && <text x={bw/2} y={yI+12} textAnchor="middle" fontSize="10" fill="#111827">{metric==='Counts'? d.I : Math.round(d.pI)+'%'}</text>}

                {/* S layer */}
                <rect x={0} y={yS} width={bw} height={hS} rx={barRadius} fill="url(#gradS)" filter="url(#barSoft)"/>
                {showLabel(hS) && <text x={bw/2} y={yS+12} textAnchor="middle" fontSize="10" fill="#111827">{metric==='Counts'? d.S : Math.round(d.pS)+'%'}</text>}

                {/* month label */}
                <text x={bw/2} y={innerH+14} textAnchor="middle" fontSize="10" fill="#64748b">{d.month}</text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
