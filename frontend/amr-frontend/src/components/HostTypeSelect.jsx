import React from 'react';

export default function HostTypeSelect({ value, onChange }) {
  return (
    <label style={{display:'inline-block', marginRight:12}}>
      Host Type
      <select value={value} onChange={e=>onChange(e.target.value)} style={{marginLeft:8}}>
        <option value="">All</option>
        <option value="human">Human</option>
        <option value="animal">Animal</option>
        <option value="environment">Environment</option>
      </select>
    </label>
  );
}
