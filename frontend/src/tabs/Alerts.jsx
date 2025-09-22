import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'

const Badge = ({text, color}) => (
  <span style={{
    display:'inline-block', padding:'2px 8px', borderRadius:999,
    background: color, color:'#fff', fontSize:12, fontWeight:700
  }}>{text}</span>
)

const Card = ({icon, title, subtitle, tone='#eef6ff', border='#d9ebff', children}) => (
  <div style={{background:tone, border:`1px solid ${border}`, borderRadius:12, padding:14}}>
    <div style={{display:'flex', gap:8, alignItems:'baseline'}}>
      <div style={{fontSize:18}}>{icon}</div>
      <div style={{fontWeight:700}}>{title}</div>
      {subtitle ? <div style={{fontSize:12, color:'#555'}}>· {subtitle}</div> : null}
    </div>
    <div style={{marginTop:8}}>{children}</div>
  </div>
)

function normalizeAlerts(raw){
  if (!raw) return {spikes:[], clusters:[], other:[]}
  const spikes   = Array.isArray(raw.spikes)   ? raw.spikes   : []
  const clusters = Array.isArray(raw.clusters) ? raw.clusters : []
  const items    = Array.isArray(raw.items)    ? raw.items
                  : Array.isArray(raw.alerts)  ? raw.alerts
                  : Array.isArray(raw)         ? raw : []
  const other = items.filter(x => !x?.type || (x.type!=='spike' && x.type!=='cluster'))
  return {spikes, clusters, other}
}

// --- robust % helper (accept 0–1 or 0–100) ---
const pct = (v) => {
  const n = Number(v ?? 0)
  if (!isFinite(n)) return 0
  return n > 1 ? n/100 : n
}

// --- synthesize alerts from monthly trends when backend has none ---
function synthesizeFromTrends(trendRows, params){
  const spikes=[], clusters=[]
  if (!Array.isArray(trendRows) || trendRows.length < 2) return {spikes, clusters}

  const ppThresh = Number(params.spike_pp ?? 20)
  const minSpikeTests = Number(params.spike_min_tests ?? 10)
  const minClusterR = Number(params.cluster_r ?? 3)
  const minClusterTests = Number(params.cluster_min_total ?? 5)

  // Spike: current %R − prev %R >= spike_pp (use larger of the two months' tests)
  for (let i=1;i<trendRows.length;i++){
    const prev = trendRows[i-1], cur = trendRows[i]
    const dpp = (pct(cur.pctR) - pct(prev.pctR)) * 100
    const maxTests = Math.max(Number(prev.tests||0), Number(cur.tests||0))
    if (dpp >= ppThresh && maxTests >= minSpikeTests){
      spikes.push({
        type:'spike',
        month: cur.month,
        delta_pctR: Math.round(dpp),
        tests: cur.tests,
        facility: 'All',
        organism: 'All',
        antibiotic: 'All',
        note: 'Derived from monthly trends'
      })
    }
  }

  // Cluster: any month with R cases >= cluster_r and total >= cluster_min_tests
  for (const r of trendRows){
    const tests = Number(r.tests||0)
    const rCases = Math.round(pct(r.pctR) * tests)
    if (rCases >= minClusterR && tests >= minClusterTests){
      clusters.push({
        type:'cluster',
        month: r.month,
        r_cases: rCases,
        total: tests,
        facility: 'All',
        organism: 'All',
        antibiotic: 'All',
        note: 'Derived from monthly trends'
      })
    }
  }
  return {spikes, clusters}
}

export default function Alerts({filters={}}){
  const [params, setParams] = useState({
    spike_pp: 20,
    spike_min_tests: 10,
    cluster_r: 3,
    cluster_min_total: 5,
    window_days: 30,
  })
  const [data, setData] = useState(null)
  const [err, setErr]   = useState(null)
  const [trend, setTrend] = useState([])

  const key = useMemo(()=>JSON.stringify({filters, params}), [filters, params])

  useEffect(()=>{
    let ok = true
    setErr(null)
    ;(async ()=>{
      try{
        const [alertsRes, trendRes] = await Promise.all([
          api.alertsFeed({...filters, ...params}).catch(()=>null),
          api.timeTrends(filters).catch(()=>({rows:[]})),
        ])
        if (!ok) return
        setData(alertsRes)
        setTrend(trendRes?.rows || [])
      }catch(e){
        if (!ok) return
        setErr(String(e))
        setData(null)
        setTrend([])
      }
    })()
    return ()=>{ ok = false }
  }, [key])

  const normalized = normalizeAlerts(data || {})
  const fallback = (normalized.spikes.length || normalized.clusters.length)
    ? {spikes:[], clusters:[]}
    : synthesizeFromTrends(trend, params)

  const spikes   = [...(normalized.spikes||[]), ...(fallback.spikes||[])]
  const clusters = [...(normalized.clusters||[]), ...(fallback.clusters||[])]
  const other    = normalized.other || []

  const nothing = (spikes.length===0 && clusters.length===0 && other.length===0)

  return (
    <div style={{display:'grid', gap:16}}>
      <Card icon="⚙️" title="Alert Parameters">
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12}}>
          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, color:'#555'}}>Spike (pp)</span>
            <input type="number" value={params.spike_pp} onChange={e=>setParams(p=>({...p, spike_pp:+e.target.value}))}
              style={{padding:'8px 10px', border:'1px solid #ddd', borderRadius:8}} />
          </label>
          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, color:'#555'}}>Spike min tests</span>
            <input type="number" value={params.spike_min_tests} onChange={e=>setParams(p=>({...p, spike_min_tests:+e.target.value}))}
              style={{padding:'8px 10px', border:'1px solid #ddd', borderRadius:8}} />
          </label>
          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, color:'#555'}}>Cluster R cases ≥</span>
            <input type="number" value={params.cluster_r} onChange={e=>setParams(p=>({...p, cluster_r:+e.target.value}))}
              style={{padding:'8px 10px', border:'1px solid #ddd', borderRadius:8}} />
          </label>
          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, color:'#555'}}>Cluster min tests</span>
            <input type="number" value={params.cluster_min_total} onChange={e=>setParams(p=>({...p, cluster_min_total:+e.target.value}))}
              style={{padding:'8px 10px', border:'1px solid #ddd', borderRadius:8}} />
          </label>
          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, color:'#555'}}>Window (days)</span>
            <input type="number" value={params.window_days} onChange={e=>setParams(p=>({...p, window_days:+e.target.value}))}
              style={{padding:'8px 10px', border:'1px solid #ddd', borderRadius:8}} />
          </label>
        </div>
        {nothing ? (
          <div style={{marginTop:10, fontSize:12, color:'#555'}}>
            Tip: Try <b>Spike (pp)=5</b>, <b>Spike min tests=1</b>, <b>Cluster R≥1</b>, <b>Cluster min tests=1</b> and widen your filters.
          </div>
        ) : null}
        {err ? <div style={{color:'#b00', marginTop:8}}>{err}</div> : null}
      </Card>

      <Card icon="📈" title="Spikes" subtitle="sudden %R increases" tone="#fff7ed" border="#ffe2c6">
        {spikes.length === 0 ? (
          <div style={{color:'#666'}}>No spike alerts for current filters.</div>
        ) : (
          <div style={{display:'grid', gap:10}}>
            {spikes.map((s,i)=>(
              <div key={i} style={{background:'#fff', border:'1px solid #fde2c5', borderRadius:10, padding:10}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8}}>
                  <div style={{fontWeight:700}}>
                    {(s.facility || 'All')} — {(s.organism || 'All')}/{(s.antibiotic || 'All')}
                  </div>
                  <Badge text={`+${s.delta_pctR ?? s.delta ?? '—'} pp`} color="#f97316" />
                </div>
                <div style={{fontSize:13, color:'#444', marginTop:4}}>
                  Month: {s.month || '—'} · Tests: {s.tests ?? s.n ?? '—'}
                </div>
                {s.note ? <div style={{fontSize:12, color:'#777', marginTop:4}}>{s.note}</div> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card icon="🧪" title="Clusters" subtitle="multiple R cases in short time" tone="#effdf5" border="#d6f5e6">
        {clusters.length === 0 ? (
          <div style={{color:'#666'}}>No cluster alerts for current filters.</div>
        ) : (
          <div style={{display:'grid', gap:10}}>
            {clusters.map((c,i)=>(
              <div key={i} style={{background:'#fff', border:'1px solid #cfeedd', borderRadius:10, padding:10}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8}}>
                  <div style={{fontWeight:700}}>
                    {(c.facility || 'All')} — {(c.organism || 'All')}/{(c.antibiotic || 'All')}
                  </div>
                  <Badge text={`${c.r_cases ?? c.r ?? '—'} R / ${c.total ?? c.n ?? '—'} tests`} color="#10b981" />
                </div>
                <div style={{fontSize:13, color:'#444', marginTop:4}}>
                  Month: {c.month || '—'} · Window: {c.window || '—'} days
                </div>
                {c.note ? <div style={{fontSize:12, color:'#777', marginTop:4}}>{c.note}</div> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card icon="🔔" title="Other Alerts" tone="#f5f3ff" border="#e6e1ff">
        {other.length === 0 ? (
          <div style={{color:'#666'}}>No other alerts.</div>
        ) : (
          <ul style={{margin:0, paddingLeft:18}}>
            {other.map((o,i)=>(
              <li key={i} style={{margin:'6px 0'}}>
                <b>{o.title || o.type || 'Alert'}:</b> {o.message || o.note || '—'}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
