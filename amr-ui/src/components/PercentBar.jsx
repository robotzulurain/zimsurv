import React from 'react'
export default function PercentBar({ value=0, max=100, height=10, label }) {
  const pct = Math.max(0, Math.min(100, (value/max)*100))
  return (
    <div style={{margin:'4px 0'}}>
      {label ? <div style={{fontSize:12,opacity:0.8,marginBottom:4}}>{label}</div> : null}
      <div style={{width:'100%',background:'#eee',borderRadius:8,overflow:'hidden',height}}>
        <div style={{width:`${pct}%`,height:'100%',background:'#3b82f6'}} />
      </div>
      <div style={{fontSize:12,opacity:0.7,marginTop:4}}>{Math.round(pct)}%</div>
    </div>
  )
}
