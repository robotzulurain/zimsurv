import { apiFetch } from '../api'

// Pull lab results and build distinct option sets for filters.
// Works even if backend doesn't have dedicated options endpoints.
export async function loadFilterOptions() {
  // If your backend pages results, you can add parameters here later.
  const res = await apiFetch('/api/lab-results/')
  const rows = Array.isArray(res?.results) ? res.results : res || []

  const toSet = (key) =>
    new Set(rows.map(r => (r[key] ?? '').toString().trim()).filter(Boolean))

  const hosts = toSet('host_type')
  const orgs  = toSet('organism')
  const abxs  = toSet('antibiotic')
  const city  = toSet('city')       // only if present in your rows
  const fac   = toSet('facility')   // only if present in your rows

  // Sorted arrays with "All"
  const toArr = (s) => ['All', ...Array.from(s).sort((a,b)=>a.localeCompare(b))]
  return {
    host: hosts.size ? toArr(hosts) : ['All'],
    organism: orgs.size ? toArr(orgs) : ['All'],
    antibiotic: abxs.size ? toArr(abxs) : ['All'],
    city: city.size ? toArr(city) : ['All'],
    facility: fac.size ? toArr(fac) : ['All'],
    _raw: rows
  }
}
