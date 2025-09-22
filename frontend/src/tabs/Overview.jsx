import { useEffect, useMemo, useState } from "react"
import { countsSummary, timeTrends } from "../api"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

function keyFor(filters){ return JSON.stringify(filters||{}) }
function pct(x){ return x==null ? "—" : Math.round(x*100)+"%" }

const card = {
  boxShadow:"0 1px 2px rgba(0,0,0,.05)",
  border:"1px solid #eee",
  borderRadius:14, padding:"14px 16px", background:"#fff"
}

export default function Overview({ filters }) {
  const [sum, setSum] = useState(null)
  const [trend, setTrend] = useState([])
  const [err, setErr] = useState(null)
  const k = useMemo(()=>keyFor(filters), [filters])

  useEffect(()=>{
    let alive = true
    setErr(null)
    countsSummary(filters||{}).then(d => { if (alive) setSum(d||{}) }).catch(e => setErr(String(e.message||e)))
    timeTrends({ ...(filters||{}), agg:"month" })
      .then(d => { if (alive) setTrend(Array.isArray(d?.rows)? d.rows : []) })
      .catch(e => setErr(String(e.message||e)))
    return ()=>{ alive=false }
  }, [k])

  if (err) return <div style={{color:"#b00"}}>Failed: {err}</div>
  if (!sum) return <div style={{opacity:.7}}>Loading overview…</div>

  return (
    <div style={{display:"grid", gap:16}}>
      <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))"}}>
        <div style={card}>
          <div style={{opacity:.6, fontSize:13}}>Total results</div>
          <div style={{fontWeight:800, fontSize:28}}>{sum.total_results ?? "—"}</div>
        </div>
        <div style={card}>
          <div style={{opacity:.6, fontSize:13}}>Unique patients</div>
          <div style={{fontWeight:800, fontSize:28}}>{sum.unique_patients ?? "—"}</div>
        </div>
        <div style={card}>
          <div style={{opacity:.6, fontSize:13}}>Facilities reporting</div>
          <div style={{fontWeight:800, fontSize:28}}>{sum.facilities_reporting ?? "—"}</div>
        </div>
        <div style={card}>
          <div style={{opacity:.6, fontSize:13}}>% Resistant (overall)</div>
          <div style={{fontWeight:800, fontSize:28}}>{pct(sum.pctR)}</div>
        </div>
      </div>

      <div style={{...card, height:320}}>
        <div style={{fontWeight:700, marginBottom:6}}>Monthly Trends</div>
        <div style={{height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top:10, right:10, bottom:10, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{fontSize:12}} />
              <YAxis />
              <Tooltip formatter={(v,n)=> n==="pctR" ? [Math.round(v*100)+"%", "%R"] : [v, "Tests"]} />
              <Line type="monotone" dataKey="tests" stroke="#8884d8" dot={false} />
              <Line type="monotone" dataKey="pctR" stroke="#e74c3c" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
