import React from "react";

export default function SelectField({ label, value, onChange, options, placeholder="All", style }) {
  return (
    <label style={{display:"grid", gap:6, fontSize:13, color:"#374151", ...style}}>
      <span style={{fontWeight:600}}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          height:36, borderRadius:8, border:"1px solid #d1d5db", padding:"0 10px",
          background:"#fff", fontSize:14, color:"#111827"
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
