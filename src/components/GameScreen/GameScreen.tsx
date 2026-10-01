import type { CSSProperties } from 'react'
import { useEmulator } from '@/emulator/useEmulator'
import { PauseButton } from './PauseButton'

interface GameScreenProps {
  hasRom: boolean
  // Mobile: tapping LOAD ROM opens the menu drawer, where the loader lives.
  // Desktop omits it — the side panel's loader is always visible.
  onRequestLoad?: () => void
  className?: string
  style?: CSSProperties
}

// A box that holds the emulator's shared canvas (see screenHostRef) plus the
// empty / error / pause overlays. Callers size and position it.
export function GameScreen({ hasRom, onRequestLoad, className = '', style }: GameScreenProps) {
  const { screenHostRef, initError } = useEmulator()

  return (
    <div className={`relative bg-ink overflow-hidden leading-0 ${className}`} style={style}>
      <div ref={screenHostRef} className="absolute inset-0" />

      {!hasRom && !initError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center p-3 bg-ink">
          <span className="font-pixel text-paper text-[9px] sm:text-[10px] leading-relaxed select-none">
            NO CARTRIDGE
          </span>
          {onRequestLoad ? (
            <button
              type="button"
              onClick={onRequestLoad}
              className="font-pixel text-[9px] text-ink bg-paper rounded-sm px-3 py-2 border-none cursor-pointer btn-raised active:btn-pressed"
            >
              LOAD ROM
            </button>
          ) : (
            <span className="font-body text-muted text-xs select-none">Load a ROM to begin</span>
          )}
        </div>
      )}
      {initError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-center text-paper text-[10px] font-pixel leading-relaxed p-4 pointer-events-none select-none bg-ink">
          {initError}
        </div>
      )}
      <PauseButton />
    </div>
  )
}
