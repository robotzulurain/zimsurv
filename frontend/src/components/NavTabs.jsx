import { NavLink } from "react-router-dom";

const tabs = [
  ["Overview","/"],
  ["Trends","/trends"],
  ["Monthly Compare","/monthly-compare"],
  ["Antibiogram","/antibiogram"],
  ["Sex & Age","/sex-age"],
  ["Data Quality","/quality"],
  ["Geo","/geo"],
  ["Data Entry","/data-entry"],
  ["Settings","/settings"],
];

export default function NavTabs(){
  return (
    <nav style={{display:"flex", gap:12, padding:"12px 16px", borderBottom:"1px solid #eee", position:"sticky", top:0, background:"#fff", zIndex:10}}>
      {tabs.map(([label, to])=>(
        <NavLink key={to} to={to}
          style={({isActive})=>({
            padding:"8px 12px",
            borderRadius:12,
            textDecoration:"none",
            color:isActive?"#0a6":"#333",
            border:isActive?"1px solid #0a6":"1px solid #ddd",
            fontWeight:isActive?700:500
          })}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
