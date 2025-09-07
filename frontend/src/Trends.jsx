import React, { useEffect, useState } from "react";
import { api, qsFromFilters } from "./api";
import FilterBar from "./components/FilterBar";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function Trends() {
  const [series, setSeries] = useState([]);
  const [err, setErr] = useState("");
  const [filters, setFilters] = useState({});

  useEffect(() => {
    api.trends(qsFromFilters(filters)).then(d => setSeries(d.series || [])).catch(e => setErr(e.message));
  }, [JSON.stringify(filters)]);

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">Trends</h2>
      <FilterBar onChange={setFilters} />
      {err && <div className="mb-4 rounded bg-red-100 text-red-700 p-3">{err}</div>}

      <div className="grid gap-6">
        <div className="rounded-xl bg-white shadow p-4">
          <h3 className="font-semibold mb-2">Monthly Tests</h3>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tests" name="Tests" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white shadow p-4">
          <h3 className="font-semibold mb-2">% Resistant</h3>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0,100]} tickFormatter={(v)=>`${v}%`} />
                <Tooltip formatter={(v)=>`${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="percent_resistant" name="% Resistant" stroke="#ef4444" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
