import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'

const Row = (p)=><div style={{display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', ...p.style}}>{p.children}</div>
const Group = ({label, children})=>(
  <label style={{display:'flex', flexDirection:'column', gap:4, fontSize:12, color:'#334155'}}>
    <span>{label}</span>
    {children}
  </label>
)
const Select = (p)=><select {...p} style={{minWidth:180, padding:'6px 8px', border:'1px solid #ddd', borderRadius:8, background:'#fff'}} />

const HOST_TYPES = ['All','HUMAN','ANIMAL','ENVIRONMENT']
const PATIENT_TYPES = ['All','INPATIENT','OUTPATIENT','UNKNOWN']

export default function Filters({value, onChange}){
  const [opts, setOpts] = useState({ facilities:[], organisms:[], antibiotics:[] })
  const key = useMemo(()=>JSON.stringify(value||{}), [value])

  useEffect(()=>{
    let alive = true
    api.options().then(o=>{ if(alive) setOpts(o||{facilities:[], organisms:[], antibiotics:[]}) })
                 .catch(()=> setOpts({facilities:[], organisms:[], antibiotics:[]}))
    return ()=>{ alive=false }
  }, [])

  const v = value || {}
  const upd = (k,val)=> onChange && onChange({ ...v, [k]: val })

  return (
    <div style={{border:'1px solid #e5e7eb', borderRadius:12, padding:12, background:'#fafafa', margin:'8px 0 16px'}}>
      <Row>
        <Group label="Facility">
          <Select value={v.facility ?? 'All'} onChange={e=>upd('facility', e.target.value)}>
            <option>All</option>
            {(opts.facilities||[]).map((f,i)=><option key={i} value={f}>{f}</option>)}
          </Select>
        </Group>

        <Group label="Organism">
          <Select value={v.organism ?? 'All'} onChange={e=>upd('organism', e.target.value)}>
            <option>All</option>
            {(opts.organisms||[]).map((o,i)=><option key={i} value={o}>{o}</option>)}
          </Select>
        </Group>

        <Group label="Antibiotic">
          <Select value={v.antibiotic ?? 'All'} onChange={e=>upd('antibiotic', e.target.value)}>
            <option>All</option>
            {(opts.antibiotics||[]).map((a,i)=><option key={i} value={a}>{a}</option>)}
          </Select>
        </Group>

        <Group label="Host Type">
          <Select value={v.host ?? 'All'} onChange={e=>upd('host', e.target.value)}>
            {HOST_TYPES.map(h=> <option key={h} value={h}>{h}</option>)}
          </Select>
        </Group>

        <Group label="Patient Type">
          <Select value={v.patient_type ?? 'All'} onChange={e=>upd('patient_type', e.target.value)}>
            {PATIENT_TYPES.map(p=> <option key={p} value={p}>{p}</option>)}
          </Select>
        </Group>
      </Row>
    </div>
  )
}
