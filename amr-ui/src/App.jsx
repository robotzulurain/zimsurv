import "./fix-inputs.css";
import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Trends from './pages/Trends.jsx'
import Resistance from './pages/Resistance.jsx'
import SexAge from './pages/SexAge.jsx'
import DataQuality from './pages/DataQuality.jsx'
import LabResults from './pages/LabResults.jsx'
import DataEntry from './pages/DataEntry.jsx'
import Geo from './pages/Geo.jsx'
import Debug from './pages/Debug.jsx'

const tabs = [
  ['/', 'Home'],
  ['/trends', 'Trends'],
  ['/resistance', 'Resistance'],
  ['/sex-age', 'Sex & Age'],
  ['/data-quality', 'Data Quality'],
  ['/lab-results', 'Lab Results'],
  ['/data-entry', 'Data Entry'],
  ['/geo', 'Geo'],
  ['/debug', 'Debug'],
]

export default function App(){
  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <div className="brand">
            <span className="dot"></span> Zimbabwe AMR Surveillance <small>prototype</small>
          </div>
          <nav className="nav">
            {tabs.map(([to,label])=>(
              <NavLink key={to} to={to} end className={({isActive})=> 'tab '+(isActive?'active':'')}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <div className="container page">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/trends" element={<Trends/>} />
          <Route path="/resistance" element={<Resistance/>} />
          <Route path="/sex-age" element={<SexAge/>} />
          <Route path="/data-quality" element={<DataQuality/>} />
          <Route path="/lab-results" element={<LabResults/>} />
          <Route path="/data-entry" element={<DataEntry/>} />
          <Route path="/geo" element={<Geo/>} />
          <Route path="/debug" element={<Debug/>} />
        </Routes>
      </div>
    </>
  )
}
