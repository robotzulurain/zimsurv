import React, { useMemo, useState } from 'react'
import { apiFetch } from '../api'

const SUGGEST = {
  sex: ['M','F'],
  specimen: ['urine','blood','stool','csf','sputum'],
  organism: ['E. coli','Klebsiella','S. aureus','Pseudomonas','Enterococcus'],
  antibiotic: ['Ciprofloxacin','Ceftriaxone','Gentamicin','Ampicillin','Meropenem'],
  ast: ['S','I','R'],
  host: ['human','animal','environment'],
}

function SmartInput({label, name, value, onChange, list=[], placeholder, type='text'}) {
  const [mode,setMode] = useState(list.length ? 'pick' : 'type')
  return (
    <label className="card" style={{gap:6}}>
      <div className="small" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span>{label}</span>
        {list.length>0 && (
          <span className="subtabs">
            <button type="button" className={`subtab ${mode==='pick'?'active':''}`} onClick={()=>setMode('pick')}>Pick</button>
            <button type="button" className={`subtab ${mode==='type'?'active':''}`} onClick={()=>setMode('type')}>Type</button>
          </span>
        )}
      </div>
      {mode==='pick' && list.length>0 ? (
        <select value={value||''} onChange={e=>onChange(name, e.target.value)}>
          <option value="">— select —</option>
          {list.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input value={value||''} onChange={e=>onChange(name, e.target.value)} placeholder={placeholder||''}
               type={type} style={{padding:8,border:'1px solid #cbd5e1',borderRadius:8}} />
      )}
    </label>
  )
}

export default function DataEntry(){
  const [form,setForm]=useState({
    date: new Date().toISOString().slice(0,10),
    patient_id:'', sex:'', age:'', specimen:'', organism:'',
    antibiotic:'', ast:'', host:'', facility:''
  })
  const [busy,setBusy]=useState(false)
  const [msg,setMsg]=useState(null)

  const canSubmit = useMemo(()=>{
    return !!(form.date && form.patient_id && form.sex && form.specimen && form.organism && form.antibiotic && form.ast && form.host && form.facility)
  },[form])

  function setField(k,v){ setForm(s=>({...s,[k]:v})) }

  async function submitSingle(){
    setBusy(true); setMsg(null)
    try{
      const payload = {...form}
      if (payload.age === '' || payload.age === null || Number.isNaN(Number(payload.age))) {
        delete payload.age
      } else {
        payload.age = Number(payload.age)
      }
      const r = await apiFetch('/api/data-entry/', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      setMsg({ok:true, text:`Saved record for ${r.patient_id} (${r.organism}/${r.antibiotic})`})
    }catch(e){
      setMsg({ok:false, text:`Submit failed: ${e}`})
    }finally{ setBusy(false) }
  }

  const [csvRows,setCsvRows]=useState([])
  function parseCSV(text){
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean)
    const headers = headerLine.split(',').map(h=>h.trim())
    const rows = lines.map(line=>{
      const vals = line.split(',').map(v=>v.trim())
      const obj = {}
      headers.forEach((h,i)=> obj[h]=vals[i]??'')
      return obj
    })
    setCsvRows(rows)
  }
  async function submitCSV(){
    if (!csvRows.length){ setMsg({ok:false, text:'No CSV rows parsed.'}); return }
    setBusy(true); setMsg(null)
    try{
      const rows = csvRows.map(r=>{
        const row = {...r}
        if (row.age === '' || row.age === null || Number.isNaN(Number(row.age))) delete row.age
        else row.age = Number(row.age)
        return row
      })
      const r = await apiFetch('/api/data-entry/bulk/', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({rows})
      })
      setMsg({ok:true, text:`Bulk: created ${r.created_count}, errors ${r.errors_count}`})
    }catch(e){
      setMsg({ok:false, text:`Bulk failed: ${e}`})
    }finally{ setBusy(false) }
  }

  return (
    <section className="grid">
      <div className="card">
        <h2 className="section-title">Single record</h2>
        <div className="grid grid-2">
          <SmartInput label="Date" name="date" value={form.date} onChange={setField} type="date" />
          <SmartInput label="Patient ID" name="patient_id" value={form.patient_id} onChange={setField} placeholder="e.g. P123" />
          <SmartInput label="Sex" name="sex" value={form.sex} onChange={setField} list={SUGGEST.sex}/>
          <SmartInput label="Age (years)" name="age" value={form.age} onChange={setField} type="number" />
          <SmartInput label="Specimen" name="specimen" value={form.specimen} onChange={setField} list={SUGGEST.specimen}/>
          <SmartInput label="Organism" name="organism" value={form.organism} onChange={setField} list={SUGGEST.organism}/>
          <SmartInput label="Antibiotic" name="antibiotic" value={form.antibiotic} onChange={setField} list={SUGGEST.antibiotic}/>
          <SmartInput label="AST (S/I/R)" name="ast" value={form.ast} onChange={setField} list={SUGGEST.ast}/>
          <SmartInput label="Host" name="host" value={form.host} onChange={setField} list={SUGGEST.host}/>
          <SmartInput label="Facility" name="facility" value={form.facility} onChange={setField} placeholder="e.g. Mpilo" />
        </div>
        <div style={{marginTop:12, display:'flex', gap:8}}>
          <button className="subtab" disabled={!canSubmit || busy} onClick={submitSingle}>Submit</button>
          {msg && <span className="small" style={{color: msg.ok?'#065f46':'#b91c1c'}}>{msg.text}</span>}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">CSV upload</h2>
        <div className="small" style={{marginBottom:8}}>
          Expected headers: <code>date,patient_id,sex,age,specimen,organism,antibiotic,ast,host,facility</code>
        </div>
        <input type="file" accept=".csv,text/csv" onChange={async e=>{
          const f=e.target.files?.[0]; if(!f) return
          const text = await f.text(); parseCSV(text)
        }} />
        {csvRows.length>0 && (
          <div className="small" style={{marginTop:8}}>
            Parsed {csvRows.length} rows. <button className="subtab" disabled={busy} onClick={submitCSV}>Send</button>
          </div>
        )}
      </div>
    </section>
  )
}
