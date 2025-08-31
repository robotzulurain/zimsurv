import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

/**
 * Loads the current user (e.g., { username, role }) from /api/me/
 * Returns null while loading, or an object once loaded.
 */
export function useMe() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    let alive = true;
    apiFetch('/api/me/')
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive) setMe(j || {}); })
      .catch(() => { if (alive) setMe({}); });
    return () => { alive = false; };
  }, []);

  return me;
}
