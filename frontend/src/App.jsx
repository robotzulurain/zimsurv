import { useState } from "react";
import Overview from "./components/Overview.jsx";
import Trends from "./components/Trends.jsx";
import Antibiogram from "./components/Antibiogram.jsx";
import SexAge from "./components/SexAge.jsx";
import GeoTab from "./components/Geo.jsx";
import Reports from "./components/Reports.jsx";
import Alerts from "./components/Alerts.jsx";
import DataEntry from "./components/DataEntry.jsx";
import FilterBar from "./components/FilterBar.jsx";
import { FiltersProvider } from "./filters.jsx";

const TABS = ["Overview","Trends","Antibiogram","Sex & Age","Geo","Data Entry","Alerts","Reports"];

export default function App() {
  const [tab, setTab] = useState("Overview");

  return (
    <FiltersProvider>
      <div className="app">
        <h1>AMR Surveillance Dashboard</h1>

        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab ${tab===t ? "active":""}`} onClick={()=>setTab(t)}>{t}</button>
          ))}
        </div>

        {/* Global filter bar */}
        <FilterBar />

        <div className="panel">
          {tab==="Overview" && <Overview/>}
          {tab==="Trends" && <Trends/>}
          {tab==="Antibiogram" && <Antibiogram/>}
          {tab==="Sex & Age" && <SexAge/>}
          {tab==="Geo" && <GeoTab/>}
          {tab==="Data Entry" && <DataEntry/>}
          {tab==="Alerts" && <Alerts/>}
          {tab==="Reports" && <Reports/>}
        </div>

        <style>{`
          .app { font-family: system-ui, sans-serif; padding: 16px; }
          .tabs { display:flex; gap:8px; flex-wrap: wrap; margin: 8px 0 16px; }
          .tab { padding:8px 12px; border-radius:10px; border:1px solid #ddd; background:#f9fafb; cursor:pointer; }
          .tab.active { background:#e6f2ff; border-color:#93c5fd; }
          .panel { background:white; border:1px solid #eee; border-radius:12px; padding:12px; }
        `}</style>
      </div>
    </FiltersProvider>
  );
}
