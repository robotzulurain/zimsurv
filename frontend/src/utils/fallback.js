/**
 * Demo/fallback dataset and helpers.
 * These keep visuals working when the API is empty/unavailable.
 */

export const demoRows = [
  { facility:"Harare Central Lab", lat:-17.8292, lon:31.0522, date:"2025-08-12", month:"2025-08", organism:"Escherichia coli",      antibiotic:"Ciprofloxacin", ast:"R", sex:"F", age:34, host:"HUMAN" },
  { facility:"Harare Central Lab", lat:-17.8292, lon:31.0522, date:"2025-08-18", month:"2025-08", organism:"Staphylococcus aureus", antibiotic:"Ceftriaxone",  ast:"S", sex:"M", age:3,  host:"HUMAN" },
  { facility:"Harare Central Lab", lat:-17.8292, lon:31.0522, date:"2025-09-01", month:"2025-09", organism:"Escherichia coli",      antibiotic:"Ciprofloxacin", ast:"S", sex:"F", age:28, host:"HUMAN" },
  { facility:"Harare Central Lab", lat:-17.8292, lon:31.0522, date:"2025-09-02", month:"2025-09", organism:"Escherichia coli",      antibiotic:"Amoxicillin",   ast:"R", sex:"M", age:45, host:"HUMAN" },
  { facility:"Bulawayo Vic Lab",   lat:-20.1578, lon:28.5880, date:"2025-09-05", month:"2025-09", organism:"Klebsiella pneumoniae", antibiotic:"Ceftriaxone",  ast:"R", sex:"F", age:63, host:"HUMAN" },
  { facility:"Gweru Gen Lab",      lat:-19.4570, lon:29.8167, date:"2025-09-06", month:"2025-09", organism:"Salmonella enterica",   antibiotic:"Ciprofloxacin", ast:"S", sex:"M", age:15, host:"HUMAN" },
  { facility:"Gweru Gen Lab",      lat:-19.4570, lon:29.8167, date:"2025-09-10", month:"2025-09", organism:"Staphylococcus aureus", antibiotic:"Ceftriaxone",  ast:"R", sex:"F", age:52, host:"HUMAN" },
];

export function applyFilters(rows, f = {}) {
  const isAll = (v) => !v || v === "All";
  const inRange = (d) => {
    if (!f.start_date && !f.end_date) return true;
    if (f.start_date && d < f.start_date) return false;
    if (f.end_date   && d > f.end_date)   return false;
    return true;
  };
  return rows.filter(r =>
    (isAll(f.facility)   || r.facility   === f.facility) &&
    (isAll(f.organism)   || r.organism   === f.organism) &&
    (isAll(f.antibiotic) || r.antibiotic === f.antibiotic) &&
    (isAll(f.host)       || r.host       === f.host) &&
    inRange(r.date)
  );
}

export function calcOptions(rows) {
  const uniq = (arr)=> [...new Set(arr)].filter(Boolean);
  return {
    facility:   uniq(["All", ...rows.map(r=>r.facility)]),
    organism:   uniq(["All", ...rows.map(r=>r.organism)]),
    antibiotic: uniq(["All", ...rows.map(r=>r.antibiotic)]),
    host:       uniq(["All", ...rows.map(r=>r.host || "HUMAN")]),
  };
}

export function calcTrends(rows) {
  // returns [{month, tests, percent_resistant}]
  const by = {};
  rows.forEach(r => {
    const k = r.month || (r.date ? r.date.slice(0,7) : "unknown");
    by[k] ||= { month:k, tests:0, resistant:0 };
    by[k].tests += 1;
    by[k].resistant += (r.ast === "R" ? 1 : 0);
  });
  return Object.values(by)
    .sort((a,b)=> a.month.localeCompare(b.month))
    .map(o => ({ month:o.month, tests:o.tests, percent_resistant: o.tests ? Math.round(100*o.resistant/o.tests) : 0 }));
}

export function calcSexAge(rows) {
  // Age buckets
  const buckets = ["0-4","5-14","15-24","25-44","45-64","65+"];
  const bucketOf = (age) => {
    if (age==null || isNaN(age)) return "25-44";
    if (age<=4) return "0-4";
    if (age<=14) return "5-14";
    if (age<=24) return "15-24";
    if (age<=44) return "25-44";
    if (age<=64) return "45-64";
    return "65+";
  };

  const ageMap = {};
  const sexMap = {};
  rows.forEach(r => {
    const b = bucketOf(Number(r.age));
    ageMap[b] ||= { bucket:b, tests:0, resistant:0 };
    ageMap[b].tests += 1;
    ageMap[b].resistant += (r.ast === "R" ? 1 : 0);

    const s = r.sex || "Unknown";
    sexMap[s] ||= { sex:s, tests:0, resistant:0 };
    sexMap[s].tests += 1;
    sexMap[s].resistant += (r.ast === "R" ? 1 : 0);
  });

  const age = buckets.map(b => ageMap[b] || { bucket:b, tests:0, resistant:0 });
  const sex = Object.values(sexMap);
  return { age, sex };
}

/**
 * Antibiogram:
 * Returns a FLAT array so components can do rows.map(...)
 * Each item: { organism, antibiotic, n, pctS }
 */
export function calcAntibiogram(rows) {
  const key = (o,a) => `${o}||${a}`;
  const by = {};
  const organisms = new Set();
  const antibiotics = new Set();

  rows.forEach(r => {
    if (!r.organism || !r.antibiotic) return;
    organisms.add(r.organism);
    antibiotics.add(r.antibiotic);
    const k = key(r.organism, r.antibiotic);
    by[k] ||= { organism:r.organism, antibiotic:r.antibiotic, n:0, s:0 };
    by[k].n += 1;
    if (r.ast === "S") by[k].s += 1;
  });

  const flat = Object.values(by).map(o => ({
    organism: o.organism,
    antibiotic: o.antibiotic,
    n: o.n,
    pctS: o.n ? Math.round((o.s * 100) / o.n) : 0,
  }));

  // attach handy lists if a component wants them
  flat.organisms = [...organisms].sort();
  flat.antibiotics = [...antibiotics].sort();
  return flat;
}

/**
 * Facilities rollup for Geo/list: { facility, lat, lon, tests, percent_resistant }
 */
export function calcFacilities(rows) {
  const map = {};
  rows.forEach(r => {
    if (!r.facility) return;
    const f = r.facility;
    map[f] ||= { facility:f, lat:r.lat, lon:r.lon, tests:0, resistant:0 };
    map[f].tests += 1;
    map[f].resistant += (r.ast === "R" ? 1 : 0);
  });
  return Object.values(map).map(o => ({
    ...o,
    percent_resistant: o.tests ? Math.round(100 * o.resistant / o.tests) : 0
  }));
}
