import React from 'react';
export default function KpiCards({ total, patients, organisms, antibiotics }){
  const card = (label, value)=>(
    <div style={{padding:'10px 14px', background:'#121212', color:'#e7e7e7', borderRadius:10}}>
      <div style={{fontSize:12, opacity:.7}}>{label}</div>
      <div style={{fontSize:22, fontWeight:700}}>{value ?? '—'}</div>
    </div>
  );
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, margin:'8px 0 12px'}}>
      {card('Total results', total)}
      {card('Unique patients', patients)}
      {card('Organisms', organisms)}
      {card('Antibiotics', antibiotics)}
    </div>
  );
}
