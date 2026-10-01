import { createContext, useContext } from 'react'
import type { GbaButton } from '@/types/gba'

export interface EmulatorState {
  ready:      boolean  // mGBA module created + FS mounted
  isRunning:  boolean  // a ROM is currently loaded
  isPaused:   boolean
  initError:  string | null
}

export interface EmulatorApi extends EmulatorState {
  // Attach to the <canvas> that mGBA renders into. Init happens once this fires.
  canvasRef:    (node: HTMLCanvasElement | null) => void
  loadRom:      (bytes: Uint8Array, fileName: string) => Promise<boolean>
  ejectRom:     () => void
  press:        (button: GbaButton) => void
  release:      (button: GbaButton) => void
  pause:        () => void
  resume:       () => void
  setVolume:    (volume: number) => void
  exportState:  () => Promise<Uint8Array<ArrayBuffer>>
  importState:  (bytes: Uint8Array<ArrayBuffer>) => Promise<boolean>
}

export const EmulatorContext = createContext<EmulatorApi | null>(null)

export function useEmulator(): EmulatorApi {
  const ctx = useContext(EmulatorContext)
  if (!ctx) throw new Error('useEmulator must be used within an EmulatorProvider')
  return ctx
}
