import React, { useEffect, useState } from "react";
import { api, qsFromFilters } from "./api";
import FilterBar from "./components/FilterBar";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const PIE_COLORS = ["#3b82f6","#f43f5e","#64748b"]; // M, F, Unknown

export default function SexAge() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [filters, setFilters] = useState({});

  useEffect(() => { api.sexAge(qsFromFilters(filters)).then(setData).catch(e => setErr(e.message)); }, [JSON.stringify(filters)]);

  if (err) return <div className="rounded bg-red-100 text-red-700 p-3">{err}</div>;
  if (!data) return <section><h2 className="text-xl font-bold mb-2">Sex & Age</h2><FilterBar onChange={setFilters}/><p>Loading…</p></section>;

  const sexData = data.sex || [];
  const ageBands = data.ageBands || [];

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">Sex & Age</h2>
      <FilterBar onChange={setFilters} />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white shadow p-4">
          <h3 className="font-semibold mb-2">By Sex</h3>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={sexData} dataKey="count" nameKey="label" outerRadius={100} label>
                  {sexData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white shadow p-4">
          <h3 className="font-semibold mb-2">By Age Band</h3>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={ageBands}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="band" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Count" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
