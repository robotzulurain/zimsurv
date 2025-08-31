import React from 'react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to:'/home', label:'Home' },
  { to:'/trends', label:'Trends' },
  { to:'/resistance', label:'Resistance' },
  { to:'/sex-age', label:'Sex & Age' },
  { to:'/data-quality', label:'Data Quality' },
  { to:'/lab-results', label:'Lab Results' },
  { to:'/data-entry', label:'Data Entry' },
  { to:'/geo', label:'Geo' },
  { to:'/debug', label:'Debug' },
]

export default function TopNav(){
  return (
    <header style={{ background:'#0ea5e9', color:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'12px 16px' }}>
        <div style={{ fontWeight:800, letterSpacing:.2, marginBottom:8 }}>Zimbabwe AMR Surveillance</div>
        <nav style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {tabs.map(t => (
            <NavLink key={t.to} to={t.to}
              style={({isActive}) => ({
                padding:'8px 12px', borderRadius:10,
                textDecoration:'none', color:isActive?'#0ea5e9':'#0f172a',
                background:isActive?'#fff':'rgba(255,255,255,0.85)',
                fontWeight:700
              })}>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
