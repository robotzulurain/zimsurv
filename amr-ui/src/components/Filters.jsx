import React from 'react';

export function Select({label, value, onChange, options, allowAll=true, name}) {
  const list = allowAll ? ['All', ...options] : options;
  return (
    <label className="filter">
      <div className="small">{label}</div>
      <select value={value} onChange={e=>onChange(e.target.value)} name={name}>
        {list.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </label>
  );
}

const PALETTE = [
  '#2563eb', '#16a34a', '#dc2626', '#a855f7', '#ea580c', '#0891b2',
  '#ca8a04', '#db2777', '#0ea5e9', '#22c55e', '#f97316', '#e11d48'
];

export function colorFor(key) {
  // simple deterministic color by string
  let h = 0;
  for (let i=0; i<key.length; i++) h = (h*31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
