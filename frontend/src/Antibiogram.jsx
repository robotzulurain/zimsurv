import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import FilterBar from "./components/FilterBar";
import { demoRows, applyFilters, calcOptions, calcAntibiogram } from "./utils/fallback";

export default function Antibiogram() {
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.options().then(setOptions).catch(() => setOptions(calcOptions(demoRows)));
  }, []);

  useEffect(() => {
    api.antibiogram(filters)
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows(calcAntibiogram(applyFilters(demoRows, filters))));
  }, [filters]);

  const orgs = useMemo(() => [...new Set(rows.map((r) => r.organism))], [rows]);
  const abxs = useMemo(() => [...new Set(rows.map((r) => r.antibiotic))], [rows]);
  const cell = (o, a) =>
    rows.find((r) => r.organism === o && r.antibiotic === a)?.percent_susceptible ?? null;

  return (
    <main>
      <FilterBar title="Antibiogram" filters={filters} setFilters={setFilters} options={options} />
      <section className="p-4">
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Organism \\ Antibiotic</th>
                {abxs.map((a) => (
                  <th key={a} style={{ textAlign: "center" }}>
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o}>
                  <td style={{ padding: "6px 8px" }}>{o}</td>
                  {abxs.map((a) => {
                    const v = cell(o, a);
                    const bg =
                      v == null
                        ? "#f7f7f7"
                        : v >= 80
                        ? "#d1fadf"
                        : v >= 60
                        ? "#e6ffb0"
                        : v >= 40
                        ? "#fff4b8"
                        : v >= 20
                        ? "#ffe0b3"
                        : "#ffd1d1";
                    return (
                      <td
                        key={a}
                        style={{ textAlign: "center", padding: "6px 8px", background: bg }}
                      >
                        {v == null ? "–" : `${v}% S`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
