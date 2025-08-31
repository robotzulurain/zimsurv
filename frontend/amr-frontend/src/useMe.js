import { useEffect, useState } from 'react';
import { apiFetch } from './api';

export default function useMe(){
  const [me, setMe] = useState(null);
  useEffect(()=>{
    let alive = true;
    apiFetch('/api/me/')
      .then(j=>{ if(alive) setMe(j); })
      .catch(()=>{ if(alive) setMe(null); });
    return ()=>{ alive=false; }
  },[]);
  return me; // { username, role, groups, ... }
}
