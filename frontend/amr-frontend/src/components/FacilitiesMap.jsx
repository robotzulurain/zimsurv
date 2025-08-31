import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function FacilitiesMap({ points=[] }) {
  const center = [-19.0, 29.15]; // Zimbabwe default
  const markers = points.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  return (
    <div style={{height: 360, borderRadius: 8, overflow:'hidden', border:'1px solid #222'}}>
      <MapContainer center={center} zoom={6} style={{height:'100%', width:'100%'}}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m, i)=>(
          <Marker key={i} position={[m.lat, m.lon]}>
            <Popup>
              <b>{m.facility}</b><br/>
              Samples: {m.count}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
