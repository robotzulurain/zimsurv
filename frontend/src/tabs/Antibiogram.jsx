import { useEffect, useMemo, useState } from "react"
import { antibiogram } from "../api"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from "recharts"

const COLORS = { R:"#e74c3c", I:"#f1c40f", S:"#2ecc71" }

function fmtPct(x){ return (x==null? "—" : Math.round(x*100)+"%") }
function keyFor(filters){ return JSON.stringify(filters||{}) }

export default function Antibiogram({ filters }) {
  const [rows, setRows]   = useState([])
  const [err, setErr]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [focus, setFocus] = useState(null) // "R" | "I" | "S" | null
  const [active, setActive] = useState(null) // the clicked bar row

  const k = useMemo(()=>keyFor(filters), [filters])

  useEffect(()=>{
    let alive = true
    setLoading(true); setErr(null)
    antibiogram(filters||{})
      .then(d => {
        if (!alive) return
        const list = Array.isArray(d?.rows) ? d.rows : []
        // normalise
        setRows(list.map(r => ({
          label: `${r.organism} · ${r.antibiotic}`,
          organism: r.organism, antibiotic: r.antibiotic,
          R: r.R||0, I: r.I||0, S: r.S||0,
          total: r.total|| (r.R||0)+(r.I||0)+(r.S||0),
          pctR: r.pctR ?? (r.total? (r.R||0)/r.total : null)
        })))
      })
      .catch(e => setErr(String(e.message||e)))
      .finally(()=> setLoading(false))
    return ()=>{ alive=false }
  }, [k])

  // When a legend segment is clicked, toggle focus
  function handleLegendClick(o){
    const code = o?.value   // "R"|"I"|"S"
    setActive(null)
    setFocus(prev => prev===code ? null : code)
  }

  // on bar click, capture row to show counts panel
  function handleBarClick(data){
    setActive(data?.activePayload?.[0]?.payload || null)
  }

  const data = useMemo(()=>{
    if (!focus) return rows
    return rows.map(r => ({
      ...r,
      R: focus==="R" ? r.R : 0,
      I: focus==="I" ? r.I : 0,
      S: focus==="S" ? r.S : 0
    }))
  }, [rows, focus])

  if (loading) return <div style={{opacity:.7}}>Loading antibiogram…</div>
  if (err) return <div style={{color:"#b00"}}>Failed: {err}</div>
  if (!data.length) return <div style={{opacity:.7}}>No data for current filters.</div>

  return (
    <div style={{display:"grid", gap:16}}>
      <div style={{fontWeight:600}}>Antibiogram (stacked R/I/S). Click legend to drill; click a bar to see counts.</div>
      <div style={{height:420, background:"#fff", border:"1px solid #eee", borderRadius:12, padding:8}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            onClick={handleBarClick}
            margin={{ top: 10, right: 10, bottom: 70, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" interval={0} tick={{fontSize:11}} angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip
              formatter={(v, n, p)=> [v, n]}
              labelFormatter={(l)=> l}
            />
            <Legend
              verticalAlign="top"
              onClick={handleLegendClick}
              payload={[
                { value:"R", type:"square", color:COLORS.R },
                { value:"I", type:"square", color:COLORS.I },
                { value:"S", type:"square", color:COLORS.S },
              ]}
              wrapperStyle={{ cursor:"pointer" }}
            />
            <Bar dataKey="R" stackId="rs" fill={COLORS.R} name="R (Resistant)" />
            <Bar dataKey="I" stackId="rs" fill={COLORS.I} name="I (Intermediate)" />
            <Bar dataKey="S" stackId="rs" fill={COLORS.S} name="S (Susceptible)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 320px", gap:16}}>
        <div style={{opacity:.8, fontSize:13}}>
          {focus ? (
            <div>Focused on: <b>{focus}</b> — showing only that segment in the stacks. Click the legend again to reset.</div>
          ) : (
            <div>Tip: click “R / I / S” legend to drill down; click a bar for details at right.</div>
          )}
        </div>

        <div style={{border:"1px solid #eee", borderRadius:12, padding:"12px 14px", background:"#fff"}}>
          <div style={{fontWeight:700, marginBottom:6}}>Row details</div>
          {!active ? (
            <div style={{opacity:.7}}>Click a bar to see counts here.</div>
          ) : (
            <div>
              <div style={{fontWeight:600}}>{active.organism} • {active.antibiotic}</div>
              <div style={{marginTop:8, display:"grid", gridTemplateColumns:"auto 1fr auto", gap:6, fontFamily:"ui-monospace, monospace"}}>
                <div style={{color:COLORS.R}}>R</div><div>Resistant</div><div>{active.R}</div>
                <div style={{color:COLORS.I}}>I</div><div>Intermediate</div><div>{active.I}</div>
                <div style={{color:COLORS.S}}>S</div><div>Susceptible</div><div>{active.S}</div>
                <div>∑</div><div>Total</div><div>{active.total}</div>
                <div> %R</div><div>Percent Resistant</div><div>{fmtPct(active.pctR)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
