import React, { useState } from 'react'
import api, { apiFetch } from '../api'

const SUGGEST = {
  sex: ['M','F','U'],
  specimen: ['urine','blood','stool','csf','sputum','water'],
  organism: ['E. coli','Klebsiella','S. aureus','Pseudomonas','Enterococcus'],
  antibiotic: ['Ciprofloxacin','Ceftriaxone','Gentamicin','Ampicillin','Meropenem','Amoxicillin'],
  ast: ['S','I','R'],
  host: ['human','animal','environment'],
}

export default function DataEntry(){
  const [form,setForm]=useState({
    date:'', patient_id:'', sex:'', age:'', specimen:'', organism:'',
    antibiotic:'', ast:'', host:'human', facility:''
  })
  const [msg,setMsg]=useState(null)

  const onChange = (k,v)=> setForm(f=>({...f,[k]:v}))

  // helper to POST JSON using apiFetch
  const postJSON = (url, body) =>
    apiFetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    })

  const send = async ()=>{
    setMsg('Submitting…')
    const payload = {...form}
    if (payload.age==='' || payload.age==null || Number.isNaN(Number(payload.age))) delete payload.age
    else payload.age = Number(payload.age)
    try{
      const r = await postJSON('/api/data-entry/', payload)
      setMsg(`Saved #${r.id}`)
    }catch(e){ setMsg('Submit failed: '+String(e)) }
  }

  const onCSV = async (file)=>{
    setMsg('Parsing CSV…')
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (!lines.length) return setMsg('CSV is empty')
    const headers = lines[0].split(',').map(h=>h.trim())
    const rows = lines.slice(1).map(l=>{
      const cols = l.split(',')
      const obj = {}; headers.forEach((h,i)=>obj[h]=cols[i])
      if (obj.age==='' || obj.age==null || Number.isNaN(Number(obj.age))) delete obj.age
      else obj.age = Number(obj.age)
      return obj
    })
    try{
      const res = await postJSON('/api/data-entry/bulk/', {rows})
      setMsg(`Bulk created: ${res.created_count}, errors: ${res.errors_count}`)
    }catch(e){ setMsg('Bulk failed: '+String(e)) }
  }

  const Text = ({label,k,placeholder=''})=>(
    <label className="input"><span className="small">{label}</span>
      <input
        value={form[k]||''}
        onChange={e=>onChange(k,e.target.value)}
        placeholder={placeholder}
        style={{color:'var(--text, #111)'}}
      />
    </label>
  )
  const Pick = ({label,k,opts})=>(
    <label className="input"><span className="small">{label}</span>
      <select
        value={form[k]||''}
        onChange={e=>onChange(k,e.target.value)}
        style={{color:'var(--text, #111)'}}
      >
        <option value="">—</option>
        {opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )

  return (
    <div className="grid" style={{gridTemplateColumns:'1.2fr .8fr'}}>
      <div className="card">
        <h3>Single record</h3>
        <div className="row">
          <Text label="Date (YYYY-MM-DD)" k="date" placeholder="2025-08-31"/>
          <Text label="Patient ID" k="patient_id"/>
          <Pick label="Sex" k="sex" opts={SUGGEST.sex}/>
          <Text label="Age" k="age" placeholder="(optional)"/>
          <Pick label="Specimen" k="specimen" opts={SUGGEST.specimen}/>
          <Pick label="Organism" k="organism" opts={SUGGEST.organism}/>
          <Pick label="Antibiotic" k="antibiotic" opts={SUGGEST.antibiotic}/>
          <Pick label="AST (S/I/R)" k="ast" opts={SUGGEST.ast}/>
          <Pick label="Host" k="host" opts={SUGGEST.host}/>
          <Text label="Facility" k="facility" />
        </div>
        <div className="row" style={{marginTop:12, gap:12}}>
          <button className="btn primary" onClick={send}>Submit</button>
          <span className="small">{msg}</span>
        </div>
      </div>

      <div className="card">
        <h3>CSV upload</h3>
        <div className="small">
          Columns accepted: date/test_date, patient_id, sex, age, specimen/specimen_type,
          organism, antibiotic, ast/ast_result, host/host_type, facility
        </div>
        <div className="row" style={{marginTop:12}}>
          <input type="file" accept=".csv,text/csv" onChange={e=> e.target.files?.[0] && onCSV(e.target.files[0]) }/>
        </div>
      </div>
    </div>
  )
}
