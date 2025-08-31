import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";

// WHO-ish simple bands
const AGE_BANDS = [
  [0, 4], [5, 14], [15, 24], [25, 34],
  [35, 44], [45, 54], [55, 64], [65, 200]
];

function bandLabel([a,b]) { return b >= 200 ? `${a}+` : `${a}-${b}`; }
function bandOf(age) {
  const n = Number(age);
  if (!Number.isFinite(n) || n < 0) return null;
  for (const rng of AGE_BANDS) { if (n >= rng[0] && n <= rng[1]) return bandLabel(rng); }
  return null;
}

export default function SexAge() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.lab().then(d => setRows(Array.isArray(d?.results) ? d.results : []));
  }, []);

  const table = useMemo(() => {
    const bands = AGE_BANDS.map(bandLabel);
    const init = Object.fromEntries(bands.map(k => [k, { M: 0, F: 0, U: 0 }]));
    const out = { ...init };

    for (const r of (rows || [])) {
      const sex = (r?.sex || "U").toUpperCase();
      const sKey = sex === "M" ? "M" : (sex === "F" ? "F" : "U");
      const age = r?.age;
      const bl = bandOf(age);
      if (!bl) continue;
      out[bl][sKey] += 1;
    }
    return out;
  }, [rows]);

  const bands = AGE_BANDS.map(bandLabel);

  return (
    <section className="card">
      <h2 className="section-title">Sex &amp; Age</h2>
      {rows.length === 0 ? (
        <div className="small">No data</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Age band</th><th>Male</th><th>Female</th><th>Unknown</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {bands.map(b => {
                const r = table[b] || { M:0, F:0, U:0 };
                const total = r.M + r.F + r.U;
                return (
                  <tr key={b}>
                    <td>{b}</td>
                    <td>{r.M}</td>
                    <td>{r.F}</td>
                    <td>{r.U}</td>
                    <td>{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
