import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Laboratories() {
  const [labs, setLabs] = useState([]);

  useEffect(() => {
    axios.get('/api/laboratories/')
      .then(res => setLabs(res.data))
      .catch(err => console.error('Lab fetch failed', err));
  }, []);

  return (
    <div>
      <h2>Laboratories</h2>
      <ul>
        {labs.map(lab => (
          <li key={lab.id}>
            {lab.name} – Lat: {lab.location.coordinates[1]}, Lng: {lab.location.coordinates[0]}
          </li>
        ))}
      </ul>
    </div>
  );
}
