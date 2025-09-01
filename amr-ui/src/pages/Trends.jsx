import React, { useMemo, useState } from 'react'
import useLabData from '../hooks/useLabData'
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

export default function Trends() {
  const { rows, options, loading, error, filterData, aggMonthly } = useLabData()
  const [f, setF] = useState({ host:'All', organism:'All', antibiotic:'All', city:'All', facility:'All' })
  const onF = (k,v)=> setF(s=>({...s,[k]:v}))

  const filtered = useMemo(()=>filterData(f), [rows, f, filterData])
  const monthly = useMemo(()=>aggMonthly(filtered), [filtered, aggMonthly])

  return (
    <div className="card">
      <h3>Monthly Resistance Trends</h3>
      <div className="row" style={{gap:12, marginBottom:12}}>
        <Select label="Host" value={f.host} onChange={v=>onF('host',v)} options={options.host}/>
        <Select label="Organism" value={f.organism} onChange={v=>onF('organism',v)} options={options.organism}/>
        <Select label="Antibiotic" value={f.antibiotic} onChange={v=>onF('antibiotic',v)} options={options.antibiotic}/>
        <Select label="City" value={f.city} onChange={v=>onF('city',v)} options={options.city}/>
        <Select label="Facility" value={f.facility} onChange={v=>onF('facility',v)} options={options.facility}/>
      </div>
      {loading && <div>Loading…</div>}
      {error && <div className="small" style={{color:'var(--bad)'}}>Error: {error}</div>}
      {!loading && monthly.length===0 && <div>No data</div>}
      {!loading && monthly.length>0 && (
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
      )}
    </div>
  )
}
