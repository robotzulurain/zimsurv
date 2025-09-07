import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import Overview from "./Overview";
import Trends from "./Trends";
import Antibiogram from "./Antibiogram";
import SexAge from "./SexAge";
import Geo from "./Geo";
import DataEntry from "./DataEntry";
import Alerts from "./Alerts.jsx";
import Reports from "./Reports";

const tabs = [
  { label: "Overview", path: "/overview", Component: Overview },
  { label: "Trends", path: "/trends", Component: Trends },
  { label: "Antibiogram", path: "/antibiogram", Component: Antibiogram },
  { label: "Sex & Age", path: "/sex-age", Component: SexAge },
  { label: "Geo", path: "/geo", Component: Geo },
  { label: "Data Entry", path: "/data-entry", Component: DataEntry },
  { label: "Alerts", path: "/alerts", Component: Alerts },
  { label: "Reports", path: "/reports", Component: Reports },
];

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-teal-600 text-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold mr-4">AMR Surveillance</h1>
            <nav className="flex flex-wrap gap-2">
              {tabs.map(t => (
                <NavLink
                  key={t.path}
                  to={t.path}
                  className={({ isActive }) =>
                    "px-3 py-1 rounded-md hover:bg-teal-700 " + (isActive ? "bg-teal-800 font-semibold" : "bg-teal-600")
                  }
                  end
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            {tabs.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
