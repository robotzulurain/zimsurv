import React from "react";
import { NavLink } from "react-router-dom";
import "./TopNav.css";

const tabs = [
  { to:"/home",        label:"Home" },
  { to:"/trends",      label:"Trends" },
  { to:"/resistance",  label:"Resistance" },
  { to:"/sex-age",     label:"Sex & Age" },
  { to:"/data-quality",label:"Data Quality" },
  { to:"/lab-results", label:"Lab Results" },
  { to:"/data-entry",  label:"Data Entry" },
  { to:"/geo",         label:"Geo" },
  { to:"/debug",       label:"Debug" },
];

export default function TopNav(){
  return (
    <header className="top">
      <div style={{fontWeight:900, marginRight:12}}>Zimbabwe AMR Surveillance</div>
      <nav className="tabs">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} className={({isActive}) => "tab" + (isActive ? " active" : "")}>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
