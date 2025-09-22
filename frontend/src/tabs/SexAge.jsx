import { useEffect, useMemo, useState } from "react"
import { sexAge, qsFromFilters } from "../api"
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from "recharts"

const card  = { background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }
const title = { fontSize:18, fontWeight:600, marginBottom:10 }
const COLORS = ["#4c9aff","#ff6a88","#7fd1ae","#f2c94c","#9b51e0","#2d9cdb"]

function normSex(d){
  const src = Array.isArray(d?.sex) ? d.sex : Array.isArray(d?.by_sex) ? d.by_sex : []
  return src.map((r,i)=>({
    label: r.label ?? r.sex ?? r.name ?? (i===0?'Male':'Female'),
    tests: Number(r.tests ?? r.count ?? 0),
    pctR:  (r.pctR!=null ? Number(r.pctR) : (r.percent_resistant ?? 0)) * ((r.pctR<=1)?100:1),
  })).filter(x=>x.tests>0)
}

function normAge(d){
  const src = Array.isArray(d?.age) ? d.age : Array.isArray(d?.by_age) ? d.by_age : []
  return src.map((r,i)=>{
    let label = r.label ?? r.range ?? r.age ?? r.bucket ?? `Group ${i+1}`
    if (/^0-9$/.test(label) && i>0) label = `${i*10}-${i*10+9}` // fix duplicate 0-9 bug
    return {
      label,
      tests: Number(r.tests ?? r.count ?? 0),
      pctR:  (r.pctR!=null ? Number(r.pctR) : (r.percent_resistant ?? 0)) * ((r.pctR<=1)?100:1),
    }
  })
}

export default function SexAge({ filters }) {
  const [data, setData] = useState({ sex:[], age:[] })
  const [err, setErr]   = useState(null)
  const key = useMemo(()=>JSON.stringify(qsFromFilters(filters)), [filters])

  useEffect(()=>{
    let alive = true
    sexAge(filters).then(d=>{
      if (!alive) return
      setData({ sex: normSex(d), age: normAge(d) })
    }).catch(e => alive && setErr(String(e.message||e)))
    return ()=>{ alive=false }
  }, [key])

  return (
    <div style={{display:"grid", gap:16}}>
      <div style={card}>
        <div style={title}>Sex distribution <span style={{opacity:.6}}>(labels show %R)</span></div>
        {err && <div style={{color:"#b00"}}>Failed to load: {err}</div>}
        {!data.sex.length ? (
          <div style={{opacity:.7}}>No sex breakdown for current filters.</div>
        ) : (
          <div style={{height:320}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(v, n)=> n==='pctR' ? [`${Math.round(v)}%`, '%R'] : [v, n]} />
                <Legend />
                <Pie data={data.sex} dataKey="tests" nameKey="label" innerRadius="45%" outerRadius="75%" paddingAngle={2}>
                  {data.sex.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  <LabelList dataKey="pctR" position="outside" formatter={(v)=>`${Math.round(v)}%`} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={card}>
        <div style={title}>Age distribution <span style={{opacity:.6}}>(bar height = tests, label shows %R)</span></div>
        {!data.age.length ? (
          <div style={{opacity:.7}}>No age breakdown for current filters.</div>
        ) : (
          <div style={{height:360}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.age} margin={{top:10,right:20,left:10,bottom:40}}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0}/>
                <YAxis />
                <Tooltip formatter={(v, n)=> n==='pctR' ? [`${Math.round(v)}%`, '%R'] : [v, 'Tests']} />
                <Bar dataKey="tests" radius={[6,6,0,0]} fill="#4c9aff">
                  <LabelList dataKey="pctR" position="top" formatter={(v)=>`${Math.round(v)}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
