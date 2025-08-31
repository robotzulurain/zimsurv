import React, { useState } from 'react';
import { apiFetch } from '../api';
import useMe from '../useMe';

export default function Upload(){
  const me = useMe();
  const role = me?.role || 'Viewer';
  const readOnly = role === 'Viewer';

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e){
    e.preventDefault();
    if(readOnly){ setError('Read-only: your role is Viewer.'); return; }
    setResult(null); setError(null);
    if(!file){ setError('Choose a CSV file first.'); return; }
    try{
      setBusy(true);
      const fd = new FormData();
      fd.append('file', file);
      const json = await apiFetch('/api/upload-csv/', { method: 'POST', body: fd });
      if(!res.ok){
        setError(json?.errors ? (Array.isArray(json.errors)? json.errors.join('\n') : String(json.errors)) : 'Upload failed');
      }else{
        setResult(json);
      }
    }catch(err){
      setError('Network or server error.');
    }finally{
      setBusy(false);
    }
  }

  return (
    <div style={{maxWidth:800, margin:'0 auto', padding:'1rem'}}>
      <h2>Upload CSV</h2>
      {readOnly && <div style={{margin:'8px 0', color:'#ff9a9a'}}>Read-only mode (Viewer)</div>}

      <p style={{opacity:.85, marginBottom:8}}>
        Required: <code>patient_id, sex, age, specimen_type, organism, antibiotic, ast_result, test_date</code>. Optional: <code>host_type</code>, <code>facility</code>.
      </p>

      <div style={{display:'flex', gap:12, marginBottom:12}}>
        <a href="/api/template/csv/" target="_blank" rel="noreferrer">
          <button type="button" style={{padding:'8px 12px', borderRadius:8}}>Download template</button>
        </a>
      </div>

      <form onSubmit={handleSubmit} style={{display:'grid', gap:12}}>
        <input type="file" accept=".csv,text/csv" onChange={e=>setFile(e.target.files?.[0]||null)} disabled={busy||readOnly} />
        <button disabled={busy||readOnly} style={{padding:'8px 12px', borderRadius:8}}>
          {busy ? 'Uploading…' : 'Upload CSV'}
        </button>
      </form>

      {error && <div style={{marginTop:16, color:'#ff7878', whiteSpace:'pre-wrap'}}>{error}</div>}
      {result && (
        <div style={{marginTop:16}}>
          <div style={{marginBottom:8}}>Saved: <b>{result.saved}</b></div>
          {result.errors?.length ? (
            <details open style={{background:'#111', padding:12, borderRadius:8}}>
              <summary>{result.errors.length} error(s) — expand</summary>
              <ul>
                {result.errors.map((e,i)=><li key={i} style={{margin:'6px 0'}}>{e}</li>)}
              </ul>
            </details>
          ) : <div>No errors 🎉</div>}
        </div>
      )}
    </div>
  );
}
