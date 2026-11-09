import { useEffect, useState } from 'react'
import { isBuenFinActive, getNextBuenFinBoundary, getServerTime } from '../data/buenFin2026'

// Fail closed until the hosting server supplies a date. No dependence on the
// visitor's wall clock, build date, local cron, or an always-on workstation.
export default function useBuenFin() {
  const [active, setActive] = useState(false)
  useEffect(() => {
    let disposed = false
    let boundaryTimer
    let controller
    const sync = async () => {
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      try {
        const response = await fetch(`/buen-fin-clock.txt?t=${Date.now()}`, {
          method: 'HEAD', cache: 'no-store', signal,
        })
        if (!response.ok) throw new Error('Clock unavailable')
        const now = getServerTime(response.headers.get('date'), response.headers.get('age'))
        if (now === null) throw new Error('Invalid server date')
        if (disposed || signal.aborted) return
        clearTimeout(boundaryTimer)
        setActive(isBuenFinActive(now))
        const next = getNextBuenFinBoundary(now)
        if (next !== null) {
          boundaryTimer = setTimeout(() => {
            // Close immediately at expiry, even when the next fetch fails.
            setActive(false)
            sync()
          }, Math.min(next - now, 2147483647))
        }
      } catch (error) {
        if (!disposed && !signal.aborted) setActive(false)
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') sync() }
    sync()
    const refresh = setInterval(sync, 60000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', sync)
    return () => {
      disposed = true
      controller?.abort()
      clearTimeout(boundaryTimer)
      clearInterval(refresh)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', sync)
    }
  }, [])
  return active
}
