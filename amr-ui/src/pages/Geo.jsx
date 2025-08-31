import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

const ZW_BBOX = { minLon:25.0, maxLon:33.1, minLat:-22.4, maxLat:-15.6 }

// ---- helpers ----
function pickFeatures(payload){
  if (!payload) return []
  if (payload.type==='FeatureCollection' && Array.isArray(payload.features)) return payload.features
  if (Array.isArray(payload.features)) return payload.features
  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload)) return payload
  if (payload.type==='Feature' || payload.geometry) return [payload]
  return []
}
function num(x){ if(x==null) return NaN; if(typeof x==='string') x=x.replace(',','.'); const v=Number(x); return Number.isFinite(v)?v:NaN }
function coerceLonLat(f){
  const props = f.properties || f
  const g = f.geometry || props.geometry || {}
  if (Array.isArray(g.coordinates) && g.coordinates.length>=2) return [num(g.coordinates[0]), num(g.coordinates[1])]
  if (Array.isArray(g.coords) && g.coords.length>=2) return [num(g.coords[0]), num(g.coords[1])]
  const cands = [
    [g.lon,g.lat],[g.long,g.lat],[g.longitude,g.latitude],[g.x,g.y],[g.lng,g.lat],
    [props.lon,props.lat],[props.long,props.lat],[props.longitude,props.latitude],[props.x,props.y],[props.lng,props.lat]
  ]
  for (const [lo,la] of cands){ const LON=num(lo), LAT=num(la); if(Number.isFinite(LON)&&Number.isFinite(LAT)) return [LON,LAT] }
  return [NaN,NaN]
}
function normalizeFeature(f){
  if(!f) return null
  const props = f.properties || f
  let [lon,lat] = coerceLonLat(f)
  const outRange = (lon<-180||lon>180||lat<-90||lat>90)
  const swap = !outRange && (Math.abs(lat)>40 && Math.abs(lon)<40)
  if (swap || outRange) [lon,lat] = [lat,lon]
  if(!Number.isFinite(lon)||!Number.isFinite(lat)) return null
  const name = props.facility || props.name || props.title || props.label || 'Facility'
  const total = num(props.total) || 0
  const pctR = num(props.pctR); // may be NaN
  const R = num(props.R)||0, I=num(props.I)||0, S=num(props.S)||0
  return { name, lon, lat, total, pctR: Number.isFinite(pctR)?pctR:null, R,I,S, _raw:f }
}
function extent(points, fallback=ZW_BBOX){
  if(!points.length) return fallback
  let minLon=Infinity,maxLon=-Infinity,minLat=Infinity,maxLat=-Infinity
  for(const p of points){ minLon=Math.min(minLon,p.lon); maxLon=Math.max(maxLon,p.lon); minLat=Math.min(minLat,p.lat); maxLat=Math.max(maxLat,p.lat) }
  if(!isFinite(minLon) || (maxLon-minLon)<1e-4 || (maxLat-minLat)<1e-4) return fallback
  const padLon=Math.max(0.2,(maxLon-minLon)*0.08), padLat=Math.max(0.2,(maxLat-minLat)*0.08)
  return { minLon:minLon-padLon, maxLon:maxLon+padLon, minLat:minLat-padLat, maxLat:maxLat+padLat }
}
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)) }
function colorFromPctR(p){ // 0%→green, 100%→red
  const pct = clamp((p??0), 0, 100)
  const hue = 120 - pct*1.2 // 120..0
  return `hsl(${hue},85%,50%)`
}
function sizeFromTotal(t){
  const base=4, max=18
  if(!t || t<=0) return base+2
  // sqrt scale for nicer spread
  const r = base + Math.min(max, Math.sqrt(t)*2.2)
  return r
}

// ---- component ----
export default function Geo(){
  const [raw,setRaw] = useState(null)
  const [error,setError] = useState(null)

  useEffect(()=>{
    apiFetch('/api/summary/facilities-geo/')
      .then(setRaw)
      .catch(e=>{ console.error(e); setError(String(e.message||e)) })
  },[])

  const feats = useMemo(()=> pickFeatures(raw), [raw])
  const points = useMemo(()=> feats.map(normalizeFeature).filter(Boolean), [feats])
  const bbox = useMemo(()=> extent(points, ZW_BBOX), [points])

  return (
    <section className="card">
      <h2 className="section-title">Facilities Map</h2>
      <div className="small">Points: {points.length}</div>
      {error && <div className="small" style={{color:'#b91c1c'}}>Failed to load: {error}</div>}

      <Map points={points} bbox={bbox} />

      <Legend />

      <details style={{marginTop:12}}>
        <summary className="small">Preview (first 10)</summary>
        <table className="table">
          <thead><tr><th>#</th><th>Name</th><th>Lon</th><th>Lat</th><th>N</th><th>%R</th></tr></thead>
          <tbody>
            {points.slice(0,10).map((p,i)=>
              <tr key={i}><td>{i+1}</td><td>{p.name}</td><td>{p.lon}</td><td>{p.lat}</td><td>{p.total}</td><td>{p.pctR==null?'—':Math.round(p.pctR)+'%'}</td></tr>
            )}
            {points.length===0 && <tr><td colSpan={6} className="small">No points yet</td></tr>}
          </tbody>
        </table>
      </details>
    </section>
  )
}

function Map({points, bbox}){
  const width = 840, height = 460, pad = 18
  const innerW = width - pad*2, innerH = height - pad*2
  const x = (lon)=> pad + ((lon - bbox.minLon)/(bbox.maxLon - bbox.minLon))*innerW
  const y = (lat)=> pad + (1 - ((lat - bbox.minLat)/(bbox.maxLat - bbox.minLat)))*innerH
  const [tip,setTip] = useState(null)

  return (
    <div style={{position:'relative', overflowX:'auto'}}>
      {tip && (
        <div className="tooltip" style={{left: tip.x, top: tip.y}}>
          <strong>{tip.name}</strong><br/>
          <span className="small">N:</span> {tip.total} &nbsp;
          <span className="small">%R:</span> {tip.pctR==null?'—':Math.round(tip.pctR)+'%'}<br/>
          <span className="small">S/I/R:</span> {tip.S}/{tip.I}/{tip.R}
        </div>
      )}

      <svg width={width} height={height} style={{maxWidth:'100%'}}>
        <defs>
          <filter id="softPanel" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodOpacity="0.15"/>
          </filter>
        </defs>
        <rect x="0" y="0" width={width} height={height} rx="12" fill="#eef2ff" filter="url(#softPanel)"/>

        {/* grid */}
        <g opacity="0.35">
          {[0,0.25,0.5,0.75,1].map((t,i)=>{
            const yy = pad + t*innerH
            const xx = pad + t*innerW
            return (
              <g key={i}>
                <line x1={pad} y1={yy} x2={pad+innerW} y2={yy} stroke="#dbeafe" strokeDasharray="4 4"/>
                <line x1={xx} y1={pad} x2={xx} y2={pad+innerH} stroke="#dbeafe" strokeDasharray="4 4"/>
              </g>
            )
          })}
        </g>

        {/* points */}
        <g>
          {points.length===0 && (
            <text x={width/2} y={height/2} textAnchor="middle" fontSize="12" fill="#64748b">
              Zimbabwe extent • awaiting facility points…
            </text>
          )}
          {points.map((p,i)=>{
            const cx = x(p.lon), cy = y(p.lat)
            if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null
            const r = sizeFromTotal(p.total)
            const fill = colorFromPctR(p.pctR)
            return (
              <g key={i} transform={`translate(${cx},${cy})`}
                 onMouseMove={(e)=>{
                   const box = e.currentTarget.closest('svg').getBoundingClientRect()
                   setTip({ x:e.clientX - box.left, y:e.clientY - box.top - 12, ...p })
                 }}
                 onMouseLeave={()=>setTip(null)}
              >
                <circle r={r+3} fill="none" stroke="#0ea5e926" />
                <circle r={r} fill={fill} stroke="#0f172a22" strokeWidth="1" />
                <text x={r+8} y="4" fontSize="11" fill="#0f172a">{p.name}</text>
              </g>
            )
          })}
        </g>

        {/* axes ticks */}
        <g fontSize="10" fill="#64748b">
          <text x={pad} y={height - 6}>{bbox.minLon.toFixed(1)}°</text>
          <text x={width - pad - 24} y={height - 6}>{bbox.maxLon.toFixed(1)}°</text>
          <text x={6} y={pad+10}>{bbox.maxLat.toFixed(1)}°</text>
          <text x={6} y={height - pad}>{bbox.minLat.toFixed(1)}°</text>
        </g>
      </svg>
    </div>
  )
}

function Legend(){
  return (
    <div className="legend" style={{marginTop:8, flexWrap:'wrap'}}>
      <span className="small" style={{marginRight:10}}><strong>Color</strong>: higher %R → redder</span>
      <span className="small"><strong>Size</strong>: larger N (total)</span>
    </div>
  )
}
