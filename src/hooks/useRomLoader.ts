import { useContext, useState, useCallback } from 'react'
import { GbaContext } from 'react-gbajs'
import { getRomMeta } from '@/lib/romId'

interface RomLoaderState {
  isLoading: boolean
  error: string | null
  hasRom: boolean
  romId: string | null
  romTitle: string | null
}

const MAX_ROM_SIZE = 32 * 1024 * 1024

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

export function useRomLoader() {
  const { play } = useContext(GbaContext)
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
        const buffer = await readFileAsArrayBuffer(file)
        const newRomBuffer = new Uint8Array(buffer)
        const { romId, romTitle } = getRomMeta(newRomBuffer)
        const success = play({ newRomBuffer, restoreState: undefined })
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
    [play],
  )

  const ejectRom = useCallback(() => {
    setState({ isLoading: false, error: null, hasRom: false, romId: null, romTitle: null })
  }, [])

  const { romId, romTitle } = state
  return { state, loadFile, ejectRom, romId, romTitle }
}
