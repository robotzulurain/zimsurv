import React from 'react'

export default function ChartCard({title, subtitle, actions, children}){
  return (
    <div className="card" style={{display:'grid', gap:8}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
        <div>
          <h3 style={{margin:0}}>{title}</h3>
          {subtitle && <div className="small" style={{opacity:.8}}>{subtitle}</div>}
        </div>
        {actions && <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>{actions}</div>}
      </div>
      <div style={{overflowX:'auto', paddingTop:4}}>
        {children}
      </div>
    </div>
  )
}
