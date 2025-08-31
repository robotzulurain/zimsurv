import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

function fitBoundsFeatures(features){
  // Return [ [southWestLat, southWestLng], [northEastLat, northEastLng] ]
  let minLat=  90, minLng= 180, maxLat=-90, maxLng=-180;
  features.forEach(f=>{
    const [lng,lat] = f.geometry.coordinates;
    if(lat<minLat) minLat=lat;
    if(lat>maxLat) maxLat=lat;
    if(lng<minLng) minLng=lng;
    if(lng>maxLng) maxLng=lng;
  });
  if(features.length===0){
    // Zimbabwe-ish default
    return [[-22, 25], [-15, 33]];
  }
  return [[minLat, minLng],[maxLat, maxLng]];
}

export default function MapPage(){
  const [geo, setGeo] = useState({features:[], unsited:[]});
  const [loading, setLoading] = useState(true);
  const [organism, setOrganism] = useState('');
  const [antibiotic, setAntibiotic] = useState('');

  useEffect(()=>{
    setLoading(true);
    const q = new URLSearchParams();
    if(organism) q.set('organism', organism);
    if(antibiotic) q.set('antibiotic', antibiotic);

    fetch('/api/summary/facilities-geo/' + (q.toString() ? `?${q}` : ''), { credentials:'include' })
      .then(r=>r.json())
      .then(j=> setGeo(j))
      .catch(()=> setGeo({features:[],unsited:[]}))
      .finally(()=> setLoading(false));
  }, [organism, antibiotic]);

  const bounds = useMemo(()=>fitBoundsFeatures(geo.features||[]), [geo]);

  function radiusForTotal(total){
    // scale visually: 6 to 22 px
    if(!total) return 6;
    const r = Math.min(22, 6 + Math.sqrt(total)*2.5);
    return r;
  }

  return (
    <div style={{padding:'1rem'}}>
      <h2>Facility Map</h2>
      <div style={{display:'flex', gap:8, margin:'8px 0', flexWrap:'wrap'}}>
        <input placeholder="Filter organism (e.g., E.coli)" value={organism} onChange={e=>setOrganism(e.target.value)} />
        <input placeholder="Filter antibiotic (e.g., Ciprofloxacin)" value={antibiotic} onChange={e=>setAntibiotic(e.target.value)} />
      </div>

      <div style={{height:'65vh', border:'1px solid #222', borderRadius:12, overflow:'hidden'}}>
        <MapContainer
          bounds={bounds}
          style={{height:'100%', width:'100%'}}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {(geo.features||[]).map((f, i)=>{
            const [lng, lat] = f.geometry.coordinates;
            const p = f.properties;
            const r = radiusForTotal(p.total);
            // color: more resistant => redder; simple thresholding
            const color = p.pctR >= 50 ? '#ff5252' : (p.pctR >= 20 ? '#ffb84d' : '#5cd65c');
            return (
              <CircleMarker key={i} center={[lat, lng]} radius={r} pathOptions={{color, weight:1, fillOpacity:0.6}}>
                <Popup>
                  <div style={{minWidth:220}}>
                    <div style={{fontWeight:600}}>{p.facility}</div>
                    {p.city ? <div style={{opacity:.8}}>{p.city}</div> : null}
                    <div style={{marginTop:6}}>
                      <div>Total: <b>{p.total}</b></div>
                      <div>Resistant (R): <b>{p.R}</b></div>
                      <div>Intermediate (I): <b>{p.I}</b></div>
                      <div>Susceptible (S): <b>{p.S}</b></div>
                      <div>%R: <b>{p.pctR}%</b></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {(geo.unsited?.length||0) > 0 && (
        <details style={{marginTop:12}}>
          <summary>{geo.unsited.length} facility/facilities missing coordinates</summary>
          <ul>
            {geo.unsited.map((u,i)=>(
              <li key={i}>{u.facility} — total {u.total}, %R {u.pctR}%</li>
            ))}
          </ul>
        </details>
      )}
      {loading && <div style={{marginTop:8, opacity:.7}}>Loading map…</div>}
    </div>
  );
}
