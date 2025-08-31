import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

/**
 * SmartInput
 * - strict=true  -> <select>
 * - strict=false -> <input list=...> with <datalist> suggestions (user can also type anything)
 */
function SmartInput({ label, value, onChange, options=[], placeholder='', strict=true, name, type='text' }) {
  const id = `dl-${name}`
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,minWidth:220}}>
      <span className="small" style={{fontWeight:700}}>{label}</span>
      {strict ? (
        <select value={value} onChange={e=>onChange(e.target.value)}>
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <>
          <input
            type={type}
            list={type==='date' ? undefined : id}
            value={value}
            placeholder={placeholder || `Type or pick ${label}`}
            onChange={e=>onChange(e.target.value)}
            style={{padding:'8px 10px', border:'1px solid #cbd5e1', borderRadius:8}}
          />
          {type!=='date' && (
            <datalist id={id}>
              {options.map(opt=> <option key={opt} value={opt} />)}
            </datalist>
          )}
        </>
      )}
    </div>
  )
}

export default function DataEntry(){
  const [data,setData]=useState(null)
  useEffect(()=>{ apiFetch('/api/lab-results/?limit=200').then(setData).catch(console.error)},[])
  const rows = data?.results || []

  const uniq = (arr)=> Array.from(new Set(arr.filter(Boolean).map(s=>String(s).trim()))).sort()

  // Suggestion lists from existing data
  const patientIds = useMemo(()=> uniq(rows.map(r=>r.patient_id)), [rows])
  const facilities = useMemo(()=> uniq(rows.map(r=>r.facility)), [rows])
  const organisms  = useMemo(()=> uniq(rows.map(r=>r.organism)), [rows])
  const antibiotics= useMemo(()=> uniq(rows.map(r=>r.antibiotic)), [rows])
  const specimens  = useMemo(()=> uniq(rows.map(r=>r.specimen)), [rows])

  // UI mode toggle
  const [strict, setStrict] = useState(false) // false = typing + suggestions

  const [form,setForm] = useState({
    host:'Human', facility:'', patient_id:'', sex:'', age_band:'',
    specimen:'', organism:'', antibiotic:'', ast:'', date:''
  })
  const update = (k,v)=> setForm(f=>({...f,[k]:v}))

  const ageBands = ['0-4','5-14','15-24','25-44','45-64','65+']

  return (
    <section className="card">
      <h2 className="section-title">Manual Entry</h2>
      <div className="small">
        Mode:&nbsp;
        <button className={`subtab ${strict ? 'active':''}`} onClick={()=>setStrict(true)}>Strict dropdowns</button>
        <button className={`subtab ${!strict ? 'active':''}`} onClick={()=>setStrict(false)} style={{marginLeft:6}}>Type + suggestions</button>
      </div>

      <div className="grid grid-2" style={{marginTop:12}}>
        <div className="selects" style={{alignItems:'flex-start'}}>
          <SmartInput label="Host" name="host" value={form.host} onChange={v=>update('host',v)} options={['Human','Animal','Environment']} strict={true}/>
          <SmartInput label="Facility" name="facility" value={form.facility} onChange={v=>update('facility',v)} options={facilities} strict={strict}/>
          <SmartInput label="Patient ID" name="patient_id" value={form.patient_id} onChange={v=>update('patient_id',v)} options={patientIds} strict={strict}/>
          <SmartInput label="Sex" name="sex" value={form.sex} onChange={v=>update('sex',v)} options={['F','M','U']} strict={true}/>
          <SmartInput label="Age band" name="age_band" value={form.age_band} onChange={v=>update('age_band',v)} options={ageBands} strict={true}/>
        </div>

        <div className="selects" style={{alignItems:'flex-start'}}>
          <SmartInput label="Specimen" name="specimen" value={form.specimen} onChange={v=>update('specimen',v)} options={specimens} strict={strict}/>
          <SmartInput label="Organism" name="organism" value={form.organism} onChange={v=>update('organism',v)} options={organisms} strict={strict}/>
          <SmartInput label="Antibiotic" name="antibiotic" value={form.antibiotic} onChange={v=>update('antibiotic',v)} options={antibiotics} strict={strict}/>
          <SmartInput label="AST" name="ast" value={form.ast} onChange={v=>update('ast',v)} options={['S','I','R']} strict={true}/>
          <SmartInput label="Test date" name="date" type="date" value={form.date} onChange={v=>update('date',v)} options={[]} strict={false}/>
        </div>
      </div>

      <div style={{marginTop:12,display:'flex',alignItems:'center',gap:12}}>
        <button className="subtab" title="Demo only" disabled>Submit (disabled)</button>
        <span className="small">Demo UI only — backend POST wiring later.</span>
        <span className="badge">Mode: {strict ? 'Strict dropdowns' : 'Type + suggestions'}</span>
      </div>

      <details style={{marginTop:12}}>
        <summary className="small">Preview payload</summary>
        <pre>{JSON.stringify(form,null,2)}</pre>
      </details>
    </section>
  )
}
