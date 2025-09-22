import { useEffect, useState } from "react";
import { timeTrends } from "../api";
import { useFilters, applyFilters } from "../filters";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

function normalize(payload) {
  const rows = Array.isArray(payload) ? payload
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.results) ? payload.results
    : [];
  return rows.map(r => ({
    date: r.date ?? r.month ?? r.period ?? "",
    tests: Number(r.tests ?? r.n ?? r.count ?? 0),
    pct_r: Number(r.pct_r ?? r.percent_resistant ?? r.resistant_pct ?? 0),
  }));
}

export default function Trends() {
  const { filters } = useFilters();
  const [gran, setGran] = useState("month"); // month|quarter|year
  const [data, setData] = useState([]);

  useEffect(() => {
    const params = applyFilters(filters, { period: gran });
    timeTrends(params).then(res => setData(normalize(res))).catch(console.error);
  }, [filters, gran]);

  return (
    <div>
      <h2>Trends</h2>
      <div style={{ marginBottom: 8 }}>
        <label style={{ marginRight: 8 }}>Group by:</label>
        <select value={gran} onChange={e=>setGran(e.target.value)}>
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly</option>
          <option value="year">Yearly</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-30} textAnchor="end" height={50}/>
          <YAxis yAxisId="left" label={{ value: "Tests", angle: -90, position: "insideLeft" }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: "%R", angle: -90, position: "insideRight" }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="tests" yAxisId="left" />
          <Line type="monotone" dataKey="pct_r" yAxisId="right" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
