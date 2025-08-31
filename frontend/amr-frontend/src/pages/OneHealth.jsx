import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import HostBreakdownPie from '../components/HostBreakdownPie';
import FacilitiesMap from '../components/FacilitiesMap';

export default function OneHealth(){
  const [hosts, setHosts] = useState([]);
  const [facilities, setFacilities] = useState([]);

  useEffect(()=>{
    apiFetch('/api/summary/host-breakdown/').then(setHosts).catch(()=>setHosts([]));
    apiFetch('/api/summary/facilities-geo/').then(setFacilities).catch(()=>setFacilities([]));
  },[]);

  return (
    <div style={{maxWidth:1100, margin:'0 auto', padding:'1rem'}}>
      <h2>One Health Overview</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        <div>
          <h3 style={{margin:'6px 0'}}>Host Breakdown</h3>
          <HostBreakdownPie data={hosts}/>
        </div>
        <div>
          <h3 style={{margin:'6px 0'}}>Facilities Map</h3>
          <FacilitiesMap points={facilities}/>
        </div>
      </div>
    </div>
  );
}
