import { useCallback } from 'react'
import { useEmulator } from '@/emulator/useEmulator'

export function usePause() {
  const { ready, isRunning, isPaused, pause, resume } = useEmulator()

  const togglePause = useCallback(() => {
    if (isPaused) resume()
    else pause()
  }, [isPaused, pause, resume])

  const hasPauseSupport = ready && isRunning

  return { isPaused, togglePause, hasPauseSupport }
}
