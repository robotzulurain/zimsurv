import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export function useLookup(endpoint){ // endpoint: '/lookups/organisms/' etc.
  const [items, setItems] = useState([]);
  useEffect(()=>{
    let ok = true;
    apiFetch('/api' + endpoint)
      .then(j=>{ if(ok && Array.isArray(j)) setItems(j); })
      .catch(()=>{ if(ok) setItems([]); });
    return ()=>{ ok=false; }
  },[endpoint]);
  return items;
}
