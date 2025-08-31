import React from "react";
import { NavLink } from "react-router-dom";
import "./tabs.css";

const items = [
  { to: "/",                 label: "Overview" },
  { to: "/trends",           label: "Trends" },
  { to: "/resistance",       label: "Resistance" },
  { to: "/heatmap",          label: "Heatmap" },
  { to: "/geo",              label: "Geo" },
  { to: "/data-quality",     label: "Data Quality" },
  { to: "/data-entry",       label: "Data Entry" },
  { to: "/lab-results",      label: "Lab Results" },
  { to: "/settings",         label: "Settings" },
];

export default function ScreenTabs(){
  return (
    <nav className="tabs-wrap">
      {items.map(x => (
        <NavLink
          key={x.to}
          to={x.to}
          end={x.to === '/'}
          className={({isActive}) => "tab-link" + (isActive ? " active" : "")}
        >
          {x.label}
        </NavLink>
      ))}
    </nav>
  );
}
