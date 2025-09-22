import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import FilterBar from "./components/FilterBar";
import { demoRows, applyFilters, calcOptions } from "./utils/fallback";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function Geo() {
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({});
  const [facilities, setFacilities] = useState([]); // [{name, lat, lon, total, resistant}]

  useEffect(() => {
    api.options().then(setOptions).catch(() => setOptions(calcOptions(demoRows)));
  }, []);

  useEffect(() => {
    api.facilities(filters)
      .then((d) => setFacilities(Array.isArray(d) ? d : []))
      .catch(() => {
        // fallback: compute simple counts per facility from demoRows
        const rows = applyFilters(demoRows, filters);
        const byFac = {};
        rows.forEach(r => {
          const k = r.facility || "Unknown";
          byFac[k] ||= { name: k, lat: r.lat || null, lon: r.lon || null, total: 0, resistant: 0 };
          byFac[k].total += 1;
          byFac[k].resistant += (r.ast === "R" ? 1 : 0);
        });
        setFacilities(Object.values(byFac));
      });
  }, [filters]);

  const withCoords = useMemo(() => facilities.filter(f => f.lat && f.lon), [facilities]);
  const center = useMemo(() => withCoords[0] ? [withCoords[0].lat, withCoords[0].lon] : [-17.83, 31.05], [withCoords]);

  return (
    <main>
      <FilterBar title="Geo" filters={filters} setFilters={setFilters} options={options} />
      <section className="p-4">
        {withCoords.length > 0 ? (
          <MapContainer center={center} zoom={6} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors" />
            {withCoords.map((f, idx) => {
              const pctR = f.total ? Math.round(100 * (f.resistant||0) / f.total) : 0;
              return (
                <Marker key={f.name + idx} position={[f.lat, f.lon]}>
                  <Popup>
                    <b>{f.name}</b><br/>
                    Tests: {f.total}<br/>
                    % Resistant: {pctR}%
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          <>
            <div className="mb-2">No geocoordinates available; showing list.</div>
            <ul className="list">
              {facilities.map((f,i) => {
                const pctR = f.total ? Math.round(100 * (f.resistant||0) / f.total) : 0;
                return <li key={f.name + i}>{f.name} — tests: {f.total}, %R: {pctR}%</li>;
              })}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
