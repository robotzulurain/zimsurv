import { useEffect, useMemo, useState } from "react"
import { timeTrends, qsFromFilters } from "../api"
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts"

const card = { background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }
const title = { fontSize:18, fontWeight:600, marginBottom:10 }

export default function Trends({ filters }) {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const key = useMemo(()=>JSON.stringify(qsFromFilters(filters)), [filters])

  useEffect(()=>{
    let alive = true
    timeTrends(filters).then(d=>{
      const arr = Array.isArray(d?.rows) ? d.rows : Array.isArray(d) ? d : []
      const mapped = arr.map(r => ({
        month: r.month ?? r.period ?? "",
        tests: Number(r.tests ?? r.count ?? 0),
        pctR:  (r.pctR != null ? Number(r.pctR) : (r.percent_resistant ?? 0)) * ( (r.pctR<=1)?100:1 )
      }))
      if (alive) setRows(mapped)
    }).catch(e => alive && setErr(String(e.message||e)))
    return ()=> { alive = false }
  }, [key])

  return (
    <div style={card}>
      <div style={title}>Monthly Trends</div>
      {err && <div style={{color:"#b00"}}>Failed to load: {err}</div>}
      {!rows.length ? (
        <div style={{opacity:.7}}>No data for current filters.</div>
      ) : (
        <div style={{height:360}}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{top:10,right:20,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="tests" orientation="left" tickFormatter={(v)=>`${v}`} />
              <YAxis yAxisId="pctR" orientation="right" domain={[0,100]} tickFormatter={(v)=>`${v}%`} />
              <Tooltip formatter={(val, name)=>
                name==='pctR' ? [`${Number(val).toFixed(0)}%`, '%R'] : [val, 'Tests']
              } />
              <Legend />
              <Bar yAxisId="tests" dataKey="tests" name="Tests" radius={[6,6,0,0]} />
              <Line yAxisId="pctR" dataKey="pctR" name="%R" strokeWidth={2} dot />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
