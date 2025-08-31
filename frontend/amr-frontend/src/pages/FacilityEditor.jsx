import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { apiFetch } from '../api';

function ClickCatcher({ onClick }) {
  useMapEvents({
    click(e) { onClick(e.latlng); }
  });
  return null;
}

export default function FacilityEditor(){
  const [facilities, setFacilities] = useState([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(()=>{
    apiFetch('/api/facilities/')
      .then(setFacilities)
      .catch(()=>setFacilities([]));
  },[]);

  const center = useMemo(()=>{
    if (lat && lon) return [parseFloat(lat), parseFloat(lon)];
    return [-19.0, 29.2]; // default center (ZW-ish)
  },[lat, lon]);

  function selectFacility(f){
    setName(f.name || '');
    setCity(f.city || '');
    setLat(f.lat ?? '');
    setLon(f.lon ?? '');
  }

  function onMapClick(ll){
    setLat(ll.lat.toFixed(5));
    setLon(ll.lng.toFixed(5));
  }

  async function save(){
    setMsg('Saving...');
    try{
      const j = await apiFetch('/api/facilities/set-coords/', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          name,
          city,
          lat: lat?parseFloat(lat):null,
          lon: lon?parseFloat(lon):null
        })
      });
      if(!res.ok){ setMsg(j.error || 'Save failed'); return; }
      setMsg('Saved ✔');
      const list = await apiFetch('/api/facilities/');
      setFacilities(list);
    }catch(e){
      setMsg('Save failed');
    }
  }

  return (
    <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:16}}>
      <div style={{height:'70vh', border:'1px solid #eee', borderRadius:12, overflow:'hidden'}}>
        <MapContainer center={center} zoom={6} style={{height:'100%', width:'100%'}}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher onClick={onMapClick} />
          {facilities.filter(f=>f.lat!=null && f.lon!=null).map(f=>(
            <Marker key={f.id} position={[f.lat, f.lon]}>
              <Popup>
                <div style={{minWidth:180}}>
                  <div style={{fontWeight:600}}>{f.name}{f.city?` — ${f.city}`:''}</div>
                  <div>Total results: {f.total}</div>
                  <button onClick={()=>selectFacility(f)} style={{marginTop:6}}>Edit in form</button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div>
        <h3 style={{margin:'8px 0'}}>Facility Editor</h3>
        <div style={{display:'grid', gap:8}}>
          <label>Facility name
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mpilo"/>
          </label>
          <label>City
            <input value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Bulawayo"/>
          </label>
          <label>Latitude
            <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="-20.15"/>
          </label>
          <label>Longitude
            <input value={lon} onChange={e=>setLon(e.target.value)} placeholder="28.58"/>
          </label>
          <button onClick={save}>Save</button>
          <div style={{minHeight:20, color:'#444'}}>{msg}</div>
        </div>

        <h3 style={{margin:'16px 0'}}>Facilities</h3>
        <div style={{maxHeight:'40vh', overflowY:'auto', border:'1px solid #eee', borderRadius:8}}>
          <table style={{width:'100%', fontSize:14}}>
            <thead>
              <tr>
                <th style={{textAlign:'left'}}>Name</th>
                <th>City</th>
                <th>Lat</th>
                <th>Lon</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {facilities.map(f=>(
                <tr key={f.id || f.name}>
                  <td>{f.name}</td>
                  <td style={{textAlign:'center'}}>{f.city||''}</td>
                  <td style={{textAlign:'center'}}>{f.lat ?? ''}</td>
                  <td style={{textAlign:'center'}}>{f.lon ?? ''}</td>
                  <td style={{textAlign:'center'}}>{f.total}</td>
                  <td><button onClick={()=>selectFacility(f)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
