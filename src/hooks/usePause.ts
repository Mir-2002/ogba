import { useContext, useState, useCallback } from 'react'
import { GbaContext } from 'react-gbajs'

export function usePause() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = useContext(GbaContext) as any
  const [isPaused, setIsPaused] = useState(false)

  const togglePause = useCallback(() => {
    if (!ctx?.pause || !ctx?.resume) return
    if (isPaused) {
      ctx.resume()
      setIsPaused(false)
    } else {
      ctx.pause()
      setIsPaused(true)
    }
  }, [ctx, isPaused])

  const hasPauseSupport = !!(ctx?.pause && ctx?.resume)

  return { isPaused, togglePause, hasPauseSupport }
}
