import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import { geoFacilities } from "../api";
import { useFilters, applyFilters } from "../filters";

const defaultCenter = [-19.02, 29.15]; // Zimbabwe-ish

// Convert 0..1 -> heat color (cool to hot)
function colorFromRatio(t) {
  const x = Math.max(0, Math.min(1, Number(t) || 0)); // clamp
  if (x < 0.25) {
    // 0.00..0.25  #06b6d4 -> #22c55e
    const k = x / 0.25;
    return mix("#06b6d4", "#22c55e", k);
  } else if (x < 0.5) {
    // 0.25..0.50  #22c55e -> #eab308
    const k = (x - 0.25) / 0.25;
    return mix("#22c55e", "#eab308", k);
  } else if (x < 0.75) {
    // 0.50..0.75  #eab308 -> #f97316
    const k = (x - 0.5) / 0.25;
    return mix("#eab308", "#f97316", k);
  } else {
    // 0.75..1.00  #f97316 -> #ef4444
    const k = (x - 0.75) / 0.25;
    return mix("#f97316", "#ef4444", k);
  }
}

// hex mix utility
function mix(a, b, t) {
  const ah = a.replace("#","");
  const bh = b.replace("#","");
  const ar = parseInt(ah.slice(0,2),16), ag = parseInt(ah.slice(2,4),16), ab = parseInt(ah.slice(4,6),16);
  const br = parseInt(bh.slice(0,2),16), bg = parseInt(bh.slice(2,4),16), bb = parseInt(bh.slice(4,6),16);
  const r = Math.round(ar + (br-ar)*t).toString(16).padStart(2,"0");
  const g = Math.round(ag + (bg-ag)*t).toString(16).padStart(2,"0");
  const b2= Math.round(ab + (bb-ab)*t).toString(16).padStart(2,"0");
  return `#${r}${g}${b2}`;
}

function normalize(payload) {
  const rows = Array.isArray(payload?.facilities) ? payload.facilities
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload) ? payload : [];
  return rows
    .map(f => ({
      id: f.id ?? f.code ?? f.name,
      name: f.name ?? f.label ?? "Facility",
      lat: Number(f.lat ?? f.latitude),
      lng: Number(f.lng ?? f.longitude),
      province: f.province ?? f.region ?? "",
      count: Number(f.count ?? f.tests ?? 0),
    }))
    .filter(f => !Number.isNaN(f.lat) && !Number.isNaN(f.lng));
}

// Reusable pulsing icon (CSS below)
const pulseIcon = L.divIcon({
  className: "pulse-icon",
  html: '<div class="pulse-dot"></div><div class="pulse-ring"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function GeoTab() {
  const { filters } = useFilters();
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    geoFacilities(applyFilters(filters, {}))
      .then(res => setFacilities(normalize(res)))
      .catch(console.error);
  }, [filters]);

  const maxCount = useMemo(() => Math.max(1, ...facilities.map(f => f.count || 0)), [facilities]);

  // compute percentile threshold for “hottest” pulse (top 10%)
  const topThreshold = useMemo(() => {
    if (!facilities.length) return Infinity;
    const counts = [...facilities.map(f => f.count || 0)].sort((a,b)=>a-b);
    const idx = Math.floor(0.9 * (counts.length - 1));
    return counts[idx];
  }, [facilities]);

  return (
    <div>
      {/* inject CSS for pulse */}
      <style>{`
        .pulse-icon { position: relative; }
        .pulse-dot {
          position: absolute;
          width: 12px; height: 12px;
          left: 6px; top: 6px;
          border-radius: 9999px;
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239,68,68,0.8);
        }
        .pulse-ring {
          position: absolute;
          left: 12px; top: 12px;
          width: 0; height: 0;
          border-radius: 9999px;
          box-shadow: 0 0 0 0 rgba(239,68,68,0.5);
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
          70%  { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        .legend {
          position: absolute; right: 12px; bottom: 12px;
          background: rgba(255,255,255,0.9);
          border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 8px 10px; font-size: 12px;
        }
        .legend .row { display:flex; align-items:center; gap:6px; margin:4px 0; }
        .legend .swatch { width:16px; height:8px; border-radius: 2px; border: 1px solid #e5e7eb; }
      `}</style>

      <h2>Geo (heat by intensity)</h2>
      <div style={{ height: 440, borderRadius: 8, overflow: "hidden", border: "1px solid #eee", position: "relative" }}>
        <MapContainer center={defaultCenter} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {facilities.map(f => {
            const ratio = (f.count || 0) / maxCount;         // 0..1
            const color = colorFromRatio(ratio);
            const radius = 5 + (22 * ratio);                 // 5..27
            const opacity = 0.3 + 0.5 * ratio;               // 0.3..0.8
            const isHot = (f.count || 0) >= topThreshold && f.count > 0;

            return (
              <div key={f.id}>
                <CircleMarker
                  center={[f.lat, f.lng]}
                  radius={radius}
                  pathOptions={{ color, fillColor: color, fillOpacity: opacity, opacity }}
                >
                  <Popup>
                    <strong>{f.name}</strong><br/>
                    {f.province ? `${f.province} · ` : ""}{f.count} tests
                  </Popup>
                </CircleMarker>

                {/* Pulse “fire/glow” for the hottest 10% */}
                {isHot && (
                  <Marker
                    position={[f.lat, f.lng]}
                    icon={pulseIcon}
                    keyboard={false}
                    interactive={false}
                  />
                )}
              </div>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="legend">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Intensity</div>
          <div className="row"><span className="swatch" style={{ background: "#06b6d4" }}></span> Low</div>
          <div className="row"><span className="swatch" style={{ background: "#22c55e" }}></span> —</div>
          <div className="row"><span className="swatch" style={{ background: "#eab308" }}></span> —</div>
          <div className="row"><span className="swatch" style={{ background: "#f97316" }}></span> —</div>
          <div className="row">
            <span className="swatch" style={{ background: "#ef4444" }}></span>
            High <span style={{ marginLeft: 6 }}>(pulses = top 10%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
