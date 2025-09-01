import React, { useMemo, useState } from 'react'
import useLabData from '../hooks/useLabData'
import Tabs from '../components/Tabs'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'

const Select = ({label, value, onChange, options=[]}) => (
  <label className="small" style={{display:'flex',flexDirection:'column',gap:4}}>
    {label}
    <select value={value} onChange={e=>onChange(e.target.value)}>
      <option>All</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </label>
)

function HeatCell({pct}) {
  const p = Number(pct) || 0
  // green = 0%R, red = 100%R; simple red gradient
  const color = `hsl(${Math.round(120 - 1.2*p)},70%,60%)` // 120->green to 0->red
  return (
    <div style={{
      textAlign:'center',
      padding:'8px 6px',
      background: color,
      color: '#000',
      borderRadius: 6,
      fontWeight:600
    }}>
      {p.toFixed(0)}%
    </div>
  )
}

export default function Resistance(){
  const { rows, options, filterData, aggMonthly, aggHeatmap, loading, error } = useLabData()
  const [tab, setTab] = useState('Heatmap')
  const [f, setF] = useState({ host:'All', organism:'All', antibiotic:'All', city:'All', facility:'All' })
  const onF = (k,v)=> setF(s=>({...s,[k]:v}))

  const filtered = useMemo(()=>filterData(f), [rows, f, filterData])

  // Compare (monthly bars)
  const monthly = useMemo(()=>aggMonthly(filtered), [filtered, aggMonthly])

  // Heatmap (organism x antibiotic => %R)
  const hm = useMemo(()=>aggHeatmap(filtered), [filtered, aggHeatmap])

  return (
    <div className="card">
      <h3>Resistance</h3>
      <div className="row" style={{gap:12, marginBottom:12}}>
        <Select label="Host" value={f.host} onChange={v=>onF('host',v)} options={options.host}/>
        <Select label="Organism" value={f.organism} onChange={v=>onF('organism',v)} options={options.organism}/>
        <Select label="Antibiotic" value={f.antibiotic} onChange={v=>onF('antibiotic',v)} options={options.antibiotic}/>
        <Select label="City" value={f.city} onChange={v=>onF('city',v)} options={options.city}/>
        <Select label="Facility" value={f.facility} onChange={v=>onF('facility',v)} options={options.facility}/>
      </div>

      <Tabs tabs={['Heatmap','Compare']} active={tab} onChange={setTab} />

      {loading && <div>Loading…</div>}
      {error && <div className="small" style={{color:'var(--bad)'}}>Error: {error}</div>}

      {!loading && tab==='Compare' && (
        monthly.length ? (
          <div style={{width:'100%', height:420}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="resistant" name="Resistant" fill="#d32f2f" />
                <Bar dataKey="total" name="Total" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <div>No data</div>
      )}

      {!loading && tab==='Heatmap' && (
        hm.matrix && hm.matrix.length ? (
          <div style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'separate', borderSpacing:8, width:'100%'}}>
              <thead>
                <tr>
                  <th style={{textAlign:'left'}}>Organism \\ Antibiotic</th>
                  {hm.antibiotics.map(a=> <th key={a} style={{textAlign:'center'}}>{a}</th>)}
                </tr>
              </thead>
              <tbody>
                {hm.organisms.map((o, i) => (
                  <tr key={o}>
                    <td style={{fontWeight:600}}>{o}</td>
                    {hm.matrix[i].map(cell => (
                      <td key={cell.a}>
                        <HeatCell pct={cell.percent_R} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div>No data</div>
      )}
    </div>
  )
}
