export default function OneHealthAnimation({ height = 220 }) {
  return (
    <svg width="100%" height={height} viewBox="0 0 640 260" role="img" aria-label="One Health animated diagram">
      <style>{`
        .node { fill: #ffffff; stroke: #94a3b8; stroke-width: 2; filter: drop-shadow(0 2px 4px rgba(0,0,0,.12)); }
        .title { font: 700 14px system-ui, sans-serif; fill: #0f172a; }
        .note  { font: 12px system-ui, sans-serif; fill: #334155; }
        .core  { fill: #e2e8f0; stroke: #64748b; stroke-width: 1.5; }
        .arrow { stroke: #475569; stroke-width: 1.8; fill: none; marker-end: url(#tri); opacity: .9; }
        .flow  { stroke: #0ea5e9; stroke-width: 2; fill: none; marker-end: url(#triBlue); opacity: .85; }
        .dot   { fill: #ef4444; opacity:.9; }
      `}</style>

      <defs>
        <marker id="tri" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
        </marker>
        <marker id="triBlue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" />
        </marker>
      </defs>

      {/* central AMR core */}
      <circle cx="320" cy="130" r="54" className="core"/>
      <text x="320" y="128" textAnchor="middle" className="title">AMR</text>
      <text x="320" y="146" textAnchor="middle" className="note">resistance genes</text>

      {/* three nodes */}
      <g transform="translate(120,40)">
        <rect x="-70" y="-22" rx="12" ry="12" width="140" height="44" className="node"/>
        <text x="0" y="-2" textAnchor="middle" className="title">HUMANS</text>
        <text x="0" y="14" textAnchor="middle" className="note">clinical care</text>
      </g>

      <g transform="translate(520,40)">
        <rect x="-70" y="-22" rx="12" ry="12" width="140" height="44" className="node"/>
        <text x="0" y="-2" textAnchor="middle" className="title">ANIMALS</text>
        <text x="0" y="14" textAnchor="middle" className="note">livestock & pets</text>
      </g>

      <g transform="translate(320,220)">
        <rect x="-70" y="-22" rx="12" ry="12" width="140" height="44" className="node"/>
        <text x="0" y="-2" textAnchor="middle" className="title">ENVIRONMENT</text>
        <text x="0" y="14" textAnchor="middle" className="note">water, soil, waste</text>
      </g>

      {/* static arrows */}
      <path className="arrow" d="M 120,60 C 180,60 240,100 266,118" />
      <path className="arrow" d="M 520,60 C 460,60 400,100 374,118" />
      <path className="arrow" d="M 320,198 C 320,178 320,164 320,158" />

      {/* animated flows */}
      <g>
        <circle r="4" className="dot">
          <animateMotion dur="3.4s" repeatCount="indefinite" path="M 120,60 C 180,60 240,100 266,118" />
        </circle>
        <circle r="4" className="dot">
          <animateMotion dur="3.8s" repeatCount="indefinite" path="M 520,60 C 460,60 400,100 374,118" />
        </circle>
        <circle r="4" className="dot">
          <animateMotion dur="3.0s" repeatCount="indefinite" path="M 320,198 C 320,178 320,164 320,158" />
        </circle>

        <path className="flow" d="M 374,142 C 340,168 220,122 150,78" />
        <circle r="3.6" className="dot">
          <animateMotion dur="3.6s" repeatCount="indefinite" path="M 374,142 C 340,168 220,122 150,78" />
        </circle>

        <path className="flow" d="M 266,142 C 300,168 420,122 490,78" />
        <circle r="3.6" className="dot">
          <animateMotion dur="3.6s" repeatCount="indefinite" path="M 266,142 C 300,168 420,122 490,78" />
        </circle>

        <path className="flow" d="M 150,82 C 200,130 260,160 300,188" />
        <circle r="3.2" className="dot">
          <animateMotion dur="4s" repeatCount="indefinite" path="M 150,82 C 200,130 260,160 300,188" />
        </circle>

        <path className="flow" d="M 490,82 C 440,130 380,160 340,188" />
        <circle r="3.2" className="dot">
          <animateMotion dur="4.2s" repeatCount="indefinite" path="M 490,82 C 440,130 380,160 340,188" />
        </circle>
      </g>
    </svg>
  );
}
