import { useEffect, useRef, useState, useCallback } from 'react'
import { apiFetch } from '../api'   // ✅ correct named export

// Generic GET hook with abort + refetch
export default function useApi(path, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const res = await apiFetch(path, { signal: ctrl.signal })
      setData(res)
    } catch (e) {
      if (e.name !== 'AbortError') setError(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.length ? deps : [path])

  return { data, error, loading, refetch: load }
}
