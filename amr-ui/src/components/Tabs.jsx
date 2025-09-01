import React from 'react'

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="row" style={{ gap: 8, marginBottom: 12 }}>
      {tabs.map(t => (
        <button
          key={t}
          className="btn"
          onClick={() => onChange(t)}
          style={{
            background: active === t ? 'var(--accent)' : undefined,
            color: active === t ? '#fff' : undefined,
            fontWeight: active === t ? 600 : 500
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
