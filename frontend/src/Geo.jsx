import "leaflet/dist/leaflet.css";
import React, { useEffect, useState, useMemo } from "react";
import { api, qsFromFilters } from "./api";
import FilterBar from "./components/FilterBar";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({ iconUrl: markerIconPng, shadowUrl: markerShadowPng });

function colorByPct(p){ // 0 -> green, 100 -> red
  const t = Math.max(0, Math.min(100, p))/100;
  const r = Math.round(255*t);
  const g = Math.round(255*(1-t));
  return `rgb(${r},${g},80)`;
}

export default function Geo() {
  const [features, setFeatures] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [err, setErr] = useState("");
  const [filters, setFilters] = useState({});

  const qs = useMemo(() => qsFromFilters(filters), [JSON.stringify(filters)]);

  useEffect(() => {
    api.facilities(qs).then(d => setFeatures(d.features || [])).catch(e => setErr(e.message));
    api.alerts(qs).then(d => setAlerts(d.alerts || [])).catch(() => {});
  }, [qs]);

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">Geo</h2>
      <FilterBar onChange={setFilters} />
      {err && <div className="mb-4 rounded bg-red-100 text-red-700 p-3">{err}</div>}
      <div className="rounded-xl bg-white shadow p-4">
        <div className="flex items-center gap-4 mb-2 text-sm">
          <span className="inline-flex items-center"><span className="inline-block w-3 h-3 mr-2 rounded" style={{background:"#10b981"}}></span>Low %R</span>
          <span className="inline-flex items-center"><span className="inline-block w-3 h-3 mr-2 rounded" style={{background:"#f59e0b"}}></span>Mid %R</span>
          <span className="inline-flex items-center"><span className="inline-block w-3 h-3 mr-2 rounded" style={{background:"#ef4444"}}></span>High %R</span>
          <span className="ml-auto text-gray-500">Circles = facilities; ⚠ markers = alerts</span>
        </div>
        <MapContainer center={[-19.0, 29.8]} zoom={6} scrollWheelZoom={true} style={{height: 520, width:"100%", borderRadius: "0.75rem"}}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Facilities as circle markers sized by samples, colored by %R */}
          {features.map((f, i) => {
            const p = f.resistance_pct ?? 0;
            const fill = colorByPct(p);
            const radius = Math.max(6, Math.min(18, (f.samples||1) ** 0.5 * 3));
            return (
              <CircleMarker key={i} center={[f.lat, f.lng]} radius={radius}
                            pathOptions={{ color: fill, fillColor: fill, fillOpacity: 0.65 }}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{f.facility}</div>
                    <div>Samples: {f.samples}</div>
                    <div>Resistance: {p}%</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
          {/* Alerts overlay as default markers with popup */}
          {alerts.map((a, i) => (
            (a.lat && a.lng) ? (
              <Marker key={`al${i}`} position={[a.lat, a.lng]}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">⚠ {a.type}</div>
                    {a.organism && a.antibiotic && <div>{a.organism} vs {a.antibiotic}</div>}
                    {a.facility && <div>Facility: {a.facility}</div>}
                    {a.month && <div>Month: {a.month}</div>}
                    {a.count_last_14d && <div>Last 14d: {a.count_last_14d}</div>}
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>
      </div>
    </section>
  );
}
