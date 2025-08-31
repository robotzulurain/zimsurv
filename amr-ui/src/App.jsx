import React from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Trends from './pages/Trends.jsx'
import Resistance from './pages/Resistance.jsx'
import SexAge from './pages/SexAge.jsx'
import DataQuality from './pages/DataQuality.jsx'
import LabResults from './pages/LabResults.jsx'
import DataEntry from './pages/DataEntry.jsx'
import Geo from './pages/Geo.jsx'
import Debug from './pages/Debug.jsx'
import './App.css'

export default function App(){
  const tabs = [
    { to:'/home', label:'Home', el:<Home/> },
    { to:'/trends', label:'Trends', el:<Trends/> },
    { to:'/resistance', label:'Resistance', el:<Resistance/> },
    { to:'/sex-age', label:'Sex & Age', el:<SexAge/> },
    { to:'/data-quality', label:'Data Quality', el:<DataQuality/> },
    { to:'/lab-results', label:'Lab Results', el:<LabResults/> },
    { to:'/data-entry', label:'Data Entry', el:<DataEntry/> },
    { to:'/geo', label:'Geo', el:<Geo/> },
    { to:'/debug', label:'Debug', el:<Debug/> },
  ]

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Zimbabwe AMR Surveillance</div>
        <nav className="tabs">
          {tabs.map(t=>(
            <NavLink key={t.to} to={t.to} className={({isActive})=>`tab ${isActive?'active':''}`}>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          {tabs.map(t=> <Route key={t.to} path={t.to} element={t.el} />)}
          <Route path="*" element={<Navigate to="/home" replace/>} />
        </Routes>
      </main>
    </div>
  )
}
