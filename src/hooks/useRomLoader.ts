import { useState, useCallback } from 'react'
import { useEmulator } from '@/emulator/useEmulator'
import { getRomMeta } from '@/lib/romId'

interface RomLoaderState {
  isLoading: boolean
  error: string | null
  hasRom: boolean
  romId: string | null
  romTitle: string | null
}

const MAX_ROM_SIZE = 32 * 1024 * 1024

export function useRomLoader() {
  const { loadRom, ejectRom: quitGame } = useEmulator()
  const [state, setState] = useState<RomLoaderState>({
    isLoading: false,
    error: null,
    hasRom: false,
    romId: null,
    romTitle: null,
  })

  const loadFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.gba')) {
        setState((s) => ({ ...s, error: 'Please select a valid .gba ROM file.' }))
        return
      }
      if (file.size > MAX_ROM_SIZE) {
        setState((s) => ({
          ...s,
          error: `File too large (max 32 MB). This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
        }))
        return
      }

      setState({ isLoading: true, error: null, hasRom: false, romId: null, romTitle: null })

      try {
        const buffer = await file.arrayBuffer()
        const romBuffer = new Uint8Array(buffer)
        const { romId, romTitle } = getRomMeta(romBuffer)
        const success = await loadRom(romBuffer, file.name)
        if (!success) {
          setState({
            isLoading: false,
            error: 'Failed to start emulator. The ROM may be invalid or corrupt.',
            hasRom: false,
            romId: null,
            romTitle: null,
          })
        } else {
          setState({ isLoading: false, error: null, hasRom: true, romId, romTitle })
        }
      } catch {
        setState({ isLoading: false, error: 'Failed to read file.', hasRom: false, romId: null, romTitle: null })
      }
    },
    [loadRom],
  )

  const ejectRom = useCallback(() => {
    quitGame()
    setState({ isLoading: false, error: null, hasRom: false, romId: null, romTitle: null })
  }, [quitGame])

  const { romId, romTitle } = state
  return { state, loadFile, ejectRom, romId, romTitle }
}
