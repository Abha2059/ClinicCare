import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../utils/helpers'

/**
 * Generic data-fetching hook giving every page a consistent
 * loading / error / data triple plus a retry handler.
 *
 * `fetcher` must be stable (wrap it in useCallback in the caller).
 */
export default function useFetch(fetcher, deps = [], { enabled = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (!cancelled && mounted.current) setData(result)
      })
      .catch((err) => {
        if (!cancelled && mounted.current) {
          setError(getErrorMessage(err))
          setData(initialData)
        }
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  return { data, loading, error, refetch, setData }
}
