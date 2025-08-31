import { useEffect, useState } from "react";

export function useLoad(loader, deps=[]) {
  const [data, setData] = useState(null);
  const [err, setErr]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const d = await loader();
        if (!dead) setData(d);
      } catch (e) {
        if (!dead) setErr(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, err, loading };
}
