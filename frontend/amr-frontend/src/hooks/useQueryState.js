import { useEffect, useMemo, useState } from 'react';

export default function useQueryState(init = {}){
  const params = useMemo(()=> new URLSearchParams(window.location.search), []);
  const [state, setState] = useState(()=>{
    const s = {...init};
    for (const k of Object.keys(init)){
      const v = params.get(k);
      if (v !== null) s[k] = v;
    }
    return s;
  });

  useEffect(()=>{
    const p = new URLSearchParams();
    for (const [k,v] of Object.entries(state)){
      if (v) p.set(k, v);
    }
    const q = p.toString();
    const newUrl = q ? `?${q}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  },[state]);

  return [state, setState];
}
