import { useState, useCallback, useEffect, useRef } from 'react'
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
  const { ready, loadRom, getStoredRom, ejectRom: quitGame } = useEmulator()
  const [state, setState] = useState<RomLoaderState>({
    isLoading: false,
    error: null,
    hasRom: false,
    romId: null,
    romTitle: null,
  })

  const start = useCallback(async (romBuffer: Uint8Array, fileName: string) => {
    setState({ isLoading: true, error: null, hasRom: false, romId: null, romTitle: null })
    const { romId, romTitle } = getRomMeta(romBuffer)
    const success = await loadRom(romBuffer, fileName)
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
  }, [loadRom])

  // Put the player back into their last game after any reload, including the
  // sign-in redirect. mGBA then restores its auto-save state on top.
  const restoredRef = useRef(false)
  useEffect(() => {
    if (!ready || restoredRef.current) return
    restoredRef.current = true
    const stored = getStoredRom()
    if (stored) start(stored.bytes, stored.fileName).catch(() => {
      setState({ isLoading: false, error: null, hasRom: false, romId: null, romTitle: null })
    })
  }, [ready, getStoredRom, start])

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

      try {
        await start(new Uint8Array(await file.arrayBuffer()), file.name)
      } catch {
        setState({ isLoading: false, error: 'Failed to read file.', hasRom: false, romId: null, romTitle: null })
      }
    },
    [start],
  )

  const ejectRom = useCallback(() => {
    quitGame()
    setState({ isLoading: false, error: null, hasRom: false, romId: null, romTitle: null })
  }, [quitGame])

  const { romId, romTitle } = state
  return { state, loadFile, ejectRom, romId, romTitle }
}
