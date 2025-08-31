import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

ChartJS.register(BarElement, CategoryScale, LinearScale);

export default function Dashboard() {
  const [resData, setResData] = useState({ antibiotics: [], counts: [] });
  const [geoData, setGeoData] = useState([]);

  useEffect(() => {
    axios.get('/api/labresults/')
      .then(res => {
        const agg = {};
        res.data.forEach(r => {
          if (r.result === 'R') {
            agg[r.antibiotic] = (agg[r.antibiotic] || 0) + 1;
          }
        });
        setResData({
          antibiotics: Object.keys(agg),
          counts: Object.values(agg),
        });
      })
      .catch(err => console.error('LabResult fetch failed', err));

    axios.get('/api/laboratories/')
      .then(res => {
        setGeoData(res.data.map(l => [
          l.location.coordinates[1],
          l.location.coordinates[0],
        ]));
      })
      .catch(err => console.error('Laboratory fetch failed', err));
  }, []);

  return (
    <div>
      <h2>Resistance Chart</h2>
      <Bar
        data={{
          labels: resData.antibiotics,
          datasets: [{
            label: 'Resistant Count',
            data: resData.counts,
            backgroundColor: '#ff6666',
          }],
        }}
      />
      <h2 style={{ marginTop: '20px' }}>Lab Locations</h2>
      <MapContainer center={[-19, 29]} zoom={6} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData.map((pos, i) => (
          <CircleMarker key={i} center={pos} radius={8} fillOpacity={0.6} />
        ))}
      </MapContainer>
    </div>
  );
}
