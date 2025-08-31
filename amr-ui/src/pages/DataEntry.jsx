import React, { useMemo, useState } from 'react'
import { apiFetch } from '../api'

const OPTIONS = {
  sex: ['M','F','U'],
  ast: ['S','I','R'],
  host: ['human','animal','environment'],
  specimen: ['urine','blood','stool','sputum','wound'],
  organism: ['E. coli','K. pneumoniae','S. aureus','P. aeruginosa','Salmonella spp.'],
  antibiotic: ['Ciprofloxacin','Ceftriaxone','Amoxicillin','Gentamicin','Meropenem'],
}

function ToggleField({ label, name, value, onChange, options=[], type='text' }) {
  const [useDropdown, setUseDropdown] = useState(true)
  return (
    <div className="field">
      <label className="lbl">
        {label}
        <button type="button" className="mini" onClick={()=>setUseDropdown(x=>!x)}>
          {useDropdown ? 'Type' : 'Pick'}
        </button>
      </label>
      {useDropdown && options.length>0 ? (
        <select value={value||''} onChange={e=>onChange(name, e.target.value)}>
          <option value="">— select —</option>
          {options.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value||''} onChange={e=>onChange(name, e.target.value)} />
      )}
    </div>
  )
}

export default function DataEntry(){
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    patient_id: '',
    sex: '',
    age: '',
    specimen: '',
    organism: '',
    antibiotic: '',
    ast: '',
    host: 'human',
    facility: '',
  })
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)

  const requiredLabels = useMemo(()=>({
    patient_id: 'Patient ID',
    specimen: 'Specimen',
    organism: 'Organism',
    antibiotic: 'Antibiotic',
    ast: 'AST',
    date: 'Date',
  }),[])
  const missing = useMemo(()=> Object.entries(requiredLabels)
    .filter(([k]) => !String(form[k]||'').trim())
    .map(([,label])=>label)
  ,[form,requiredLabels])

  function setField(k,v){ setForm(f=>({...f,[k]:v})) }

  async function handleSubmit(e){
    e.preventDefault()
    setNote(null)
    setBusy(true) // Submit ENABLED by default, only disabled while sending
    try{
      const payload = { ...form, age: form.age===''? null : Number(form.age) }
      const r = await apiFetch('/api/data-entry/', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      })
      setNote({ ok:true, msg:'Saved ✓', detail:r })
      setForm(f=>({ ...f, organism:'', antibiotic:'', ast:'' })) // quick next entry
    }catch(err){
      const msg = String(err)
      const hint = /404|405/.test(msg)
        ? 'Backend route missing. Add POST /api/data-entry/ (and /bulk) to your API.'
        : ''
      setNote({ ok:false, msg:`Submit failed: ${msg}`, hint })
    }finally{
      setBusy(false)
    }
  }

  // CSV upload
  const [csvRows, setCsvRows] = useState([])
  const [csvErr, setCsvErr] = useState(null)
  const [csvBusy, setCsvBusy] = useState(false)
  const [csvNote, setCsvNote] = useState(null)

  function parseCSVText(text){
    // Simple CSV (no quoted commas). Expected headers (any order):
    // patient_id, sex, age, specimen, organism, antibiotic, ast, date, host, facility
    const lines = text.split(/\r?\n/).filter(l=>l.trim().length>0)
    if (!lines.length) return []
    const header = lines[0].split(',').map(h=>h.trim().toLowerCase())
    const idx = (name) => header.indexOf(name)
    const rows = []
    for (let i=1;i<lines.length;i++){
      const cols = lines[i].split(',').map(c=>c.trim())
      if(cols.every(c=>!c)) continue
      rows.push({
        patient_id: cols[idx('patient_id')] || '',
        sex: cols[idx('sex')] || '',
        age: cols[idx('age')] || '',
        specimen: cols[idx('specimen')] || '',
        organism: cols[idx('organism')] || '',
        antibiotic: cols[idx('antibiotic')] || '',
        ast: cols[idx('ast')] || '',
        date: cols[idx('date')] || '',
        host: cols[idx('host')] || '',
        facility: cols[idx('facility')] || '',
      })
    }
    return rows
  }

  function handleCSVFile(file){
    setCsvErr(null); setCsvRows([]); setCsvNote(null)
    const reader = new FileReader()
    reader.onload = (e)=>{
      try{
        const rows = parseCSVText(String(e.target.result||''))
        if(!rows.length) throw new Error('No data rows found')
        setCsvRows(rows)
      }catch(err){ setCsvErr(String(err)) }
    }
    reader.onerror = ()=> setCsvErr('Failed to read file')
    reader.readAsText(file)
  }

  async function uploadCSV(){
    setCsvBusy(true); setCsvNote(null)
    try{
      const r = await apiFetch('/api/data-entry/bulk/', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ rows: csvRows })
      })
      setCsvNote({ ok:true, msg:`Uploaded ${csvRows.length} rows ✓`, detail:r })
      setCsvRows([])
    }catch(err){
      const msg = String(err)
      const hint = /404|405/.test(msg)
        ? 'Bulk route missing. Add POST /api/data-entry/bulk/ that accepts {rows:[...]}.'
        : ''
      setCsvNote({ ok:false, msg:`Upload failed: ${msg}`, hint })
    }finally{
      setCsvBusy(false)
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">Data Entry</h2>

      <form onSubmit={handleSubmit} className="grid grid-2" style={{alignItems:'start'}}>
        <div className="card" style={{display:'grid', gap:10}}>
          <h3 className="section-title" style={{marginTop:0}}>Single record</h3>

          <div className="field">
            <label className="lbl">Date</label>
            <input type="date" value={form.date||''} onChange={e=>setField('date', e.target.value)} />
          </div>

          <div className="field">
            <label className="lbl">Patient ID</label>
            <input type="text" value={form.patient_id||''} onChange={e=>setField('patient_id', e.target.value)} />
          </div>

          <ToggleField label="Sex" name="sex" value={form.sex} onChange={setField} options={OPTIONS.sex} />
          <div className="field">
            <label className="lbl">Age (years)</label>
            <input type="number" min="0" step="1" value={form.age||''} onChange={e=>setField('age', e.target.value)} />
          </div>

          <ToggleField label="Specimen" name="specimen" value={form.specimen} onChange={setField} options={OPTIONS.specimen} />
          <ToggleField label="Organism" name="organism" value={form.organism} onChange={setField} options={OPTIONS.organism} />
          <ToggleField label="Antibiotic" name="antibiotic" value={form.antibiotic} onChange={setField} options={OPTIONS.antibiotic} />
          <ToggleField label="AST (S/I/R)" name="ast" value={form.ast} onChange={setField} options={OPTIONS.ast} />

          <ToggleField label="Host" name="host" value={form.host} onChange={setField} options={OPTIONS.host} />
          <div className="field">
            <label className="lbl">Facility</label>
            <input type="text" value={form.facility||''} onChange={e=>setField('facility', e.target.value)} />
          </div>

          {missing.length>0 && (
            <div className="small" style={{color:'#b45309'}}>
              Missing: {missing.join(', ')}
            </div>
          )}

          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button type="submit" className="btn" disabled={busy}>
              {busy? 'Submitting…':'Submit'}
            </button>
            {note && (
              <span className="small" style={{color: note.ok? '#047857' : '#b91c1c'}}>
                {note.msg}{note.hint? ` — ${note.hint}`:''}
              </span>
            )}
          </div>
        </div>

        <div className="card" style={{display:'grid', gap:10}}>
          <h3 className="section-title" style={{marginTop:0}}>CSV upload</h3>
          <p className="small">
            Expected headers (any order):
            <code> patient_id, sex, age, specimen, organism, antibiotic, ast, date, host, facility </code>
          </p>
          <input type="file" accept=".csv,text/csv" onChange={e=> e.target.files?.[0] && handleCSVFile(e.target.files[0])} />
          {csvErr && <div className="small" style={{color:'#b91c1c'}}>CSV error: {csvErr}</div>}

          {csvRows.length>0 && (
            <>
              <div className="small">{csvRows.length} rows parsed. Preview first 5:</div>
              <div style={{overflowX:'auto', maxHeight:200, border:'1px solid #e5e7eb', borderRadius:8}}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Patient</th><th>Sex</th><th>Age</th>
                      <th>Specimen</th><th>Organism</th><th>Antibiotic</th><th>AST</th>
                      <th>Host</th><th>Facility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(0,5).map((r,i)=>(
                      <tr key={i}>
                        <td>{r.date}</td><td>{r.patient_id}</td><td>{r.sex}</td><td>{r.age}</td>
                        <td>{r.specimen}</td><td>{r.organism}</td><td>{r.antibiotic}</td><td>{r.ast}</td>
                        <td>{r.host}</td><td>{r.facility}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <button type="button" className="btn" onClick={uploadCSV} disabled={csvBusy}>
                  {csvBusy? 'Uploading…' : `Upload CSV (${csvRows.length})`}
                </button>
                {csvNote && (
                  <span className="small" style={{color: csvNote.ok? '#047857' : '#b91c1c'}}>
                    {csvNote.msg}{csvNote.hint? ` — ${csvNote.hint}`:''}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </form>
    </section>
  )
}
