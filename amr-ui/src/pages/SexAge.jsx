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

export default function SexAge(){
  const { rows, options, loading, error, filterData, aggSexAge } = useLabData()
  const [f, setF] = useState({ host:'All', organism:'All', antibiotic:'All', city:'All', facility:'All' })
  const onF = (k,v)=> setF(s=>({...s,[k]:v}))

  const filtered = useMemo(()=>filterData(f), [rows, f, filterData])
  const matrix = useMemo(()=>aggSexAge(filtered), [filtered, aggSexAge])

  return (
    <div className="card">
      <h3>Sex & Age</h3>
      <div className="row" style={{gap:12, marginBottom:12}}>
        <Select label="Host" value={f.host} onChange={v=>onF('host',v)} options={options.host}/>
        <Select label="Organism" value={f.organism} onChange={v=>onF('organism',v)} options={options.organism}/>
        <Select label="Antibiotic" value={f.antibiotic} onChange={v=>onF('antibiotic',v)} options={options.antibiotic}/>
        <Select label="City" value={f.city} onChange={v=>onF('city',v)} options={options.city}/>
        <Select label="Facility" value={f.facility} onChange={v=>onF('facility',v)} options={options.facility}/>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="small" style={{color:'var(--bad)'}}>Error: {error}</div>}

      <div style={{width:'100%', height:420, marginBottom:16}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={matrix}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="band" />
            <YAxis allowDecimals={false}/>
            <Tooltip />
            <Legend />
            <Bar dataKey="M" name="Male" fill="#1976d2" />
            <Bar dataKey="F" name="Female" fill="#7b1fa2" />
            <Bar dataKey="U" name="Unknown" fill="#9e9e9e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{overflowX:'auto'}}>
        <table className="table" style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left'}}>Age band</th>
              <th>Male</th>
              <th>Female</th>
              <th>Unknown</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map(r=>(
              <tr key={r.band}>
                <td>{r.band}</td>
                <td style={{textAlign:'center'}}>{r.M}</td>
                <td style={{textAlign:'center'}}>{r.F}</td>
                <td style={{textAlign:'center'}}>{r.U}</td>
                <td style={{textAlign:'center', fontWeight:600}}>{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
