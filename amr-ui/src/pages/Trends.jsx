import React, { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

export default function Trends(){
  const [data, setData] = useState([])
  const [filters, setFilters] = useState({host:'', organism:'', antibiotic:'', city:'', facility:''})

  const load = async()=>{
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k,v])=>{ if(v && v!=='All') params.append(k,v) })
    const res = await apiFetch('/api/summary/resistance-time-trend/?'+params.toString())
    setData(Array.isArray(res)?res:[])
  }
  useEffect(()=>{ load() },[filters])

  const onChange=(k,v)=> setFilters(f=>({...f,[k]:v}))

  return (
    <div className="container">
      <div className="card">
        <h3>Monthly Resistance Trends</h3>
        <div className="row" style={{marginBottom:12}}>
          {['host','organism','antibiotic','city','facility'].map(k=>(
            <label key={k} className="input" style={{minWidth:160}}>
              <span>{k}</span>
              <select value={filters[k]} onChange={e=>onChange(k,e.target.value)}>
                <option value="">All</option>
                {/* replace static options with dynamic ones later */}
                {k==='host' && ['human','animal','environment'].map(x=><option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          ))}
        </div>

        <div className="chart-360">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="resistant" name="Resistant" fill="#d32f2f" />
              <Bar dataKey="total" name="Total" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!data.length && <div className="small" style={{marginTop:8}}>No data</div>}
      </div>
    </div>
  )
}
