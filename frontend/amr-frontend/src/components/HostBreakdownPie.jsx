import React from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function HostBreakdownPie({ data=[] }){
  const pretty = data.map(d => ({
    name: d.host_type ? d.host_type : 'unknown',
    value: d.count
  }));
  return (
    <div style={{height: 320, border:'1px solid #222', borderRadius:8, padding:8}}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie dataKey="value" data={pretty} label />
          <Tooltip />
          {pretty.map((_, i)=><Cell key={i} />)}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
