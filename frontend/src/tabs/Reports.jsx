import { useEffect, useMemo, useState } from 'react'
import { reportsSummary, reportFacilityLeague, reportAntibiogram, qsFromFilters } from '../api'

const card  = { background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }
const title = { fontSize:18, fontWeight:600, marginBottom:10 }
const tabBtn = (on,disabled)=>({
  padding:"6px 10px", border:"1px solid #ddd", borderRadius:8, background:on?"#eef6ff":"#fff",
  opacity: disabled? .5:1, cursor: disabled? "not-allowed":"pointer"
})

export default function Reports({ filters }) {
  const [preset, setPreset] = useState('summary') // summary | league | abx
  const [rows, setRows] = useState([])
  const [err, setErr]   = useState(null)
  const key = useMemo(()=> JSON.stringify({ ...qsFromFilters(filters), preset }), [filters, preset])

  useEffect(()=>{
    let alive = true
    setErr(null); setRows([])
    const fetcher = preset==='summary' ? reportsSummary
                   : preset==='league' ? reportFacilityLeague
                   : reportAntibiogram
    fetcher(filters).then(d=>{
      const arr = Array.isArray(d?.rows) ? d.rows : Array.isArray(d) ? d : []
      if (alive) setRows(arr)
    }).catch(e=> alive && setErr(String(e.message||e)))
    return ()=>{ alive=false }
  }, [key])

  return (
    <div style={card}>
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:12}}>
        <div style={title}>Reports</div>
        <div style={{marginLeft:'auto', display:'flex', gap:8}}>
          <button style={tabBtn(preset==='summary')} onClick={()=>setPreset('summary')}>Summary (National)</button>
          <button style={tabBtn(preset==='league')}  onClick={()=>setPreset('league')}>Facility League</button>
          <button style={tabBtn(preset==='abx')}     onClick={()=>setPreset('abx')}>Antibiogram</button>
        </div>
      </div>

      {err && <div style={{color:'#b00'}}>Failed: {err}</div>}
      {!rows.length ? (
        <div style={{opacity:.7}}>No data for current filters.</div>
      ) : (
        preset==='summary' ? (
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead><tr>
              {['Month','Tests','%R'].map(h=> <th key={h} style={{textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #f4f4f4'}}>
                  <td style={{padding:'8px 10px'}}>{r.month ?? r.period ?? ''}</td>
                  <td style={{padding:'8px 10px'}}>{r.tests ?? r.count ?? 0}</td>
                  <td style={{padding:'8px 10px'}}>{Math.round(((r.pctR??0) <=1 ? (r.pctR||0)*100 : (r.pctR||0)))}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : preset==='league' ? (
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead><tr>
              {['Facility','Tests','%R','Completeness'].map(h=> <th key={h} style={{textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #f4f4f4'}}>
                  <td style={{padding:'8px 10px'}}>{r.facility ?? r.name ?? '—'}</td>
                  <td style={{padding:'8px 10px'}}>{r.tests ?? r.count ?? 0}</td>
                  <td style={{padding:'8px 10px'}}>{Math.round(((r.pctR??0) <=1 ? (r.pctR||0)*100 : (r.pctR||0)))}%</td>
                  <td style={{padding:'8px 10px'}}>{r.completeness != null ? `${Math.round(r.completeness)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead><tr>
              {['Organism','Antibiotic','R','I','S','Total','%R'].map(h=> <th key={h} style={{textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #f4f4f4'}}>
                  <td style={{padding:'8px 10px'}}>{r.organism}</td>
                  <td style={{padding:'8px 10px'}}>{r.antibiotic}</td>
                  <td style={{padding:'8px 10px'}}>{r.R ?? 0}</td>
                  <td style={{padding:'8px 10px'}}>{r.I ?? 0}</td>
                  <td style={{padding:'8px 10px'}}>{r.S ?? 0}</td>
                  <td style={{padding:'8px 10px'}}>{r.total ?? ((r.R||0)+(r.I||0)+(r.S||0))}</td>
                  <td style={{padding:'8px 10px'}}>{Math.round(((r.pctR??0) <=1 ? (r.pctR||0)*100 : (r.pctR||0)))}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  )
}
