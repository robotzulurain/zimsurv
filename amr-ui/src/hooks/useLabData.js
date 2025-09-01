import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

// Normalize field names seen in the API defensively
const F = {
  id: 'id',
  patient: 'patient_id',
  sex: 'sex',
  age: 'age',
  specimen: 'specimen_type',
  organism: 'organism',
  antibiotic: 'antibiotic',
  ast: 'ast_result',
  date: 'test_date',
  host: 'host_type',
  facility: 'facility',
  city: 'city'
}

const val = (row, key) => row?.[key] ?? row?.[key.toLowerCase()] ?? ''

const monthKey = (isoDate) => {
  if (!isoDate) return 'Unknown'
  // expect YYYY-MM-DD
  const m = String(isoDate).slice(0,7)
  return m || 'Unknown'
}

export default function useLabData() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiFetch('/api/lab-results/')
      .then(r => {
        if (!mounted) return
        const arr = Array.isArray(r?.results) ? r.results : []
        setRows(arr)
        setError(null)
      })
      .catch(e => setError(String(e?.message || e)))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  // Distinct options
  const options = useMemo(() => {
    const pick = (k) => {
      const s = new Set()
      rows.forEach(row => {
        const v = val(row, F[k])
        if (v != null && String(v).trim() !== '') s.add(String(v))
      })
      return Array.from(s).sort((a,b)=>a.localeCompare(b))
    }
    return {
      host: pick('host'),
      organism: pick('organism'),
      antibiotic: pick('antibiotic'),
      city: pick('city'),
      facility: pick('facility'),
      sex: pick('sex')
    }
  }, [rows])

  // Filter function
  const filterData = (filters) => {
    const { host, organism, antibiotic, city, facility, sex } = (filters || {})
    return rows.filter(row => {
      if (host && host !== 'All' && val(row, F.host) !== host) return false
      if (organism && organism !== 'All' && val(row, F.organism) !== organism) return false
      if (antibiotic && antibiotic !== 'All' && val(row, F.antibiotic) !== antibiotic) return false
      if (city && city !== 'All' && val(row, F.city) !== city) return false
      if (facility && facility !== 'All' && val(row, F.facility) !== facility) return false
      if (sex && sex !== 'All' && val(row, F.sex) !== sex) return false
      return true
    })
  }

  // Aggregations
  const aggMonthly = (rowsFiltered) => {
    const byMonth = new Map()
    rowsFiltered.forEach(r => {
      const m = monthKey(val(r, F.date))
      const total = (byMonth.get(m)?.total || 0) + 1
      const resistant = (byMonth.get(m)?.resistant || 0) + (String(val(r, F.ast)).toUpperCase()==='R' ? 1 : 0)
      byMonth.set(m, { month: m, total, resistant, percent_R: total ? Math.round((resistant/total)*10000)/100 : 0 })
    })
    return Array.from(byMonth.values()).sort((a,b)=>a.month.localeCompare(b.month))
  }

  const aggHeatmap = (rowsFiltered) => {
    // organism x antibiotic with %R
    const key = (o, a) => `${o}||${a}`
    const map = new Map()
    const set = new Set()
    const ab = new Set()
    rowsFiltered.forEach(r => {
      const o = val(r, F.organism) || 'Unknown'
      const a = val(r, F.antibiotic) || 'Unknown'
      set.add(o); ab.add(a)
      const k = key(o,a)
      const cur = map.get(k) || { total:0, resistant:0 }
      cur.total += 1
      if (String(val(r, F.ast)).toUpperCase()==='R') cur.resistant += 1
      map.set(k, cur)
    })
    const organisms = Array.from(set).sort((a,b)=>a.localeCompare(b))
    const antibiotics = Array.from(ab).sort((a,b)=>a.localeCompare(b))
    // matrix with %R
    const matrix = organisms.map(o => antibiotics.map(a => {
      const m = map.get(key(o,a)) || { total:0, resistant:0 }
      const pct = m.total ? Math.round((m.resistant/m.total)*10000)/100 : 0
      return { o, a, total: m.total, resistant: m.resistant, percent_R: pct }
    }))
    return { organisms, antibiotics, matrix }
  }

  const aggSexAge = (rowsFiltered) => {
    const bands = [
      {label:'0-4', min:0, max:4},
      {label:'5-14', min:5, max:14},
      {label:'15-24', min:15, max:24},
      {label:'25-34', min:25, max:34},
      {label:'35-44', min:35, max:44},
      {label:'45-54', min:45, max:54},
      {label:'55-64', min:55, max:64},
      {label:'65+', min:65, max:200},
    ]
    const out = bands.map(b => ({ band:b.label, M:0, F:0, U:0, total:0 }))
    const findBand = (age) => {
      const n = Number(age)
      if (Number.isNaN(n)) return -1
      return bands.findIndex(b => n>=b.min && n<=b.max)
    }
    rowsFiltered.forEach(r=>{
      const i = findBand(val(r, F.age))
      if (i<0) return
      const s = (String(val(r, F.sex)).toUpperCase()[0] || 'U')
      const row = out[i]
      row[s] = (row[s]||0)+1
      row.total += 1
    })
    return out
  }

  return { rows, options, loading, error, filterData, aggMonthly, aggHeatmap, aggSexAge }
}
