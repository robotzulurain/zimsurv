import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function LabResults(){
  const [rows,setRows] = useState([]);
  const [err,setErr] = useState("");

  useEffect(()=>{ api.lab().then(d=>setRows(d?.results||[])).catch(e=>setErr(String(e.message||e))); },[]);

  return (
    <section>
      <h2 className="section-title">Lab Results</h2>
      {err && <div className="error">{err}</div>}
      <div className="card" style={{overflowX:'auto'}}>
        <table className="table small">
          <thead>
            <tr><th>Date</th><th>Patient</th><th>Sex</th><th>Age</th><th>Specimen</th><th>Organism</th><th>Antibiotic</th><th>AST</th><th>Host</th></tr>
          </thead>
          <tbody>
            {rows.slice(0,50).map(r=>(
              <tr key={r.id}>
                <td>{r.test_date}</td>
                <td>{r.patient_id}</td>
                <td>{r.sex}</td>
                <td>{r.age}</td>
                <td>{r.specimen_type}</td>
                <td>{r.organism}</td>
                <td>{r.antibiotic}</td>
                <td>{r.ast_result}</td>
                <td>{r.host_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length>50 && <div className="small" style={{opacity:.7, marginTop:6}}>(Showing first 50)</div>}
      </div>
    </section>
  );
}
