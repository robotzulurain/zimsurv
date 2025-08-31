import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function LabResultsTable({ q, specimen, organism, antibiotic, dateFrom, dateTo }){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (specimen) params.set('specimen_type', specimen);
    if (organism) params.set('organism', organism);
    if (antibiotic) params.set('antibiotic', antibiotic);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    setLoading(true);
    apiFetch(`/api/lab-results/?${params.toString()}`)
      .then(data=>setRows(Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : [])))
      .catch(()=>setRows([]))
      .finally(()=>setLoading(false));
  },[q, specimen, organism, antibiotic, dateFrom, dateTo]);

  return (
    <div style={{overflow:'auto', border:'1px solid #222', borderRadius:8}}>
      <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
        <thead style={{background:'#0f0f0f', color:'#ddd'}}>
          <tr>
            {['Patient ID','Sex','Age','Specimen','Organism','Antibiotic','AST','Test Date'].map(h=>
              <th key={h} style={{textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #222'}}>{h}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="8" style={{padding:12}}>Loading…</td></tr>
          ) : rows.length===0 ? (
            <tr><td colSpan="8" style={{padding:12}}>No data</td></tr>
          ) : rows.map((r,i)=>(
            <tr key={i} style={{borderTop:'1px solid #181818'}}>
              <td style={{padding:'6px 10px'}}>{r.patient_id}</td>
              <td style={{padding:'6px 10px'}}>{r.sex}</td>
              <td style={{padding:'6px 10px'}}>{r.age}</td>
              <td style={{padding:'6px 10px'}}>{r.specimen_type}</td>
              <td style={{padding:'6px 10px'}}>{r.organism}</td>
              <td style={{padding:'6px 10px'}}>{r.antibiotic}</td>
              <td style={{padding:'6px 10px'}}>{r.ast_result}</td>
              <td style={{padding:'6px 10px'}}>{r.test_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
