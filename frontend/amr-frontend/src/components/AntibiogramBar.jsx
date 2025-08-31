import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { apiFetch } from '../api';

export default function AntibiogramBar({ organism }){
  const [data, setData] = useState([]);
  useEffect(()=>{
    const q = organism ? `?organism=${encodeURIComponent(organism)}` : '';
    apiFetch(`/api/summary/antibiogram-percent/${q}`)
      .then(rows => {
        const filtered = Array.isArray(rows)
          ? rows.filter(x => x.organism && x.antibiotic).map(x => ({ name: x.antibiotic, pctR: x.pctR }))
          : [];
        setData(filtered);
      }).catch(()=>setData([]));
  },[organism]);

  return (
    <div style={{height:320}}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v)=>`${v}%`} />
          <Tooltip />
          <Bar dataKey="pctR" name="% Resistant" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
