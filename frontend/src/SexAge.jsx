import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import FilterBar from "./components/FilterBar";
import { demoRows, applyFilters, calcOptions, calcSexAge } from "./utils/fallback";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f"];

export default function SexAge() {
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({});
  const [age, setAge] = useState([]);   // [{bucket:'0-4', tests: n, resistant: m}]
  const [sex, setSex] = useState([]);   // [{sex:'M', tests:n, resistant:m}, ...]

  useEffect(() => {
    api.options().then(setOptions).catch(() => setOptions(calcOptions(demoRows)));
  }, []);

  useEffect(() => {
    api.sexAge(filters)
      .then((d) => {
        setAge(Array.isArray(d?.age) ? d.age : []);
        setSex(Array.isArray(d?.sex) ? d.sex : []);
      })
      .catch(() => {
        const d = calcSexAge(applyFilters(demoRows, filters));
        setAge(d.age);
        setSex(d.sex);
      });
  }, [filters]);

  const ageData = useMemo(() => age.map(a => ({
    bucket: a.bucket,
    tests: Number(a.tests||0),
    percent_resistant: a.tests ? Math.round(100*(a.resistant||0)/a.tests) : 0
  })), [age]);

  const sexData = useMemo(() => sex.map(s => ({
    name: s.sex || "Unknown",
    value: Number(s.tests||0),
    percent_resistant: s.tests ? Math.round(100*(s.resistant||0)/s.tests) : 0
  })), [sex]);

  return (
    <main>
      <FilterBar title="Sex & Age" filters={filters} setFilters={setFilters} options={options} />

      <section className="p-4">
        <h3 style={{ marginBottom: 8 }}>Tests by Age Group (bar) with %R tooltip</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip formatter={(v, name, ctx) => {
                if (name === "tests") return [v, "Tests"];
                return [ctx.payload.percent_resistant + "% R", "% Resistant"];
              }} />
              <Legend />
              <Bar dataKey="tests" name="Tests" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <h3 style={{ margin: "18px 0 8px" }}>By Sex (pie). Hover shows %R</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={(v, name, ctx) => {
                return [`${v} tests — ${ctx.payload.percent_resistant}% R`, name];
              }} />
              <Legend />
              <Pie data={sexData} dataKey="value" nameKey="name" outerRadius={100}>
                {sexData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}
