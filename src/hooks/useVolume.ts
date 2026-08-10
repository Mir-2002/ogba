import { useState, useCallback } from 'react'

const STORAGE_KEY = 'ogba:volume'

function readStoredVolume(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed = parseFloat(raw)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed
    }
  } catch {
    // localStorage unavailable
  }
  return 0.5
}

export function useVolume() {
  const [volume, setVolumeState] = useState<number>(readStoredVolume)
  const [isMuted, setIsMuted] = useState(false)

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped))
    } catch {
      // localStorage unavailable
    }
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  return { volume, setVolume, isMuted, toggleMute }
}
