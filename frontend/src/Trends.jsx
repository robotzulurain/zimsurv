import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import FilterBar from "./components/FilterBar";
import { demoRows, applyFilters, calcOptions, calcTrends } from "./utils/fallback";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line,
} from "recharts";

export default function Trends() {
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]); // [{month:"2025-09", tests:10, percent_resistant:40}, ...]

  // load options
  useEffect(() => {
    api.options().then(setOptions).catch(() => setOptions(calcOptions(demoRows)));
  }, []);

  // load trends
  useEffect(() => {
    api.trends(filters)
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows(calcTrends(applyFilters(demoRows, filters))));
  }, [filters]);

  const data = useMemo(() => rows.map(r => ({
    month: r.month,
    tests: Number(r.tests || 0),
    percent_resistant: Number(r.percent_resistant ?? 0),
  })), [rows]);

  const totalTests = useMemo(() => data.reduce((a,b)=>a + (b.tests||0), 0), [data]);

  return (
    <main>
      <FilterBar title="Trends" filters={filters} setFilters={setFilters} options={options} />
      <section className="p-4">
        <h3 style={{ margin: "8px 0" }}>Monthly tests</h3>
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tests" name="Tests" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <h3 style={{ margin: "16px 0 8px" }}>% resistant</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0,100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="percent_resistant" name="% Resistant" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: 12, opacity: 0.8 }}>Total tests in range: {totalTests}</div>
      </section>
    </main>
  );
}
