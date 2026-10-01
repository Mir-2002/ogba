import { useEffect, type RefObject } from 'react'
import { useGbaScale } from '@/hooks/useGbaScale'
import { useEmulator } from '@/emulator/useEmulator'
import { PauseButton } from './PauseButton'

interface GameScreenProps {
  hasRom: boolean
  volume: number
  // Mobile only: tap the empty screen to open the menu drawer, where the
  // ROM loader lives as the primary action.
  onRequestLoad: () => void
  // The slot ConsoleShell lays out for the screen — sized by flex layout,
  // independent of the canvas itself, so measuring it can't be circular.
  containerRef: RefObject<HTMLElement | null>
}

export function GameScreen({ hasRom, volume, onRequestLoad, containerRef }: GameScreenProps) {
  const scale = useGbaScale(containerRef)
  const { canvasRef, ready, initError, setVolume } = useEmulator()

  useEffect(() => {
    if (ready) setVolume(volume)
  }, [ready, volume, setVolume])

  return (
    <div className="rounded-sm bg-ink bezel-inset relative overflow-hidden leading-[0]">
      {!hasRom && !initError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center p-3">
          <span className="font-pixel text-paper text-[9px] sm:text-[10px] leading-relaxed select-none">
            NO CARTRIDGE
          </span>
          <button
            type="button"
            onClick={onRequestLoad}
            className="lg:hidden pointer-events-auto font-pixel text-[9px] text-ink bg-paper rounded-sm px-3 py-2 border-none cursor-pointer btn-raised active:btn-pressed"
          >
            LOAD ROM
          </button>
          <span className="hidden lg:block font-body text-muted text-xs select-none">
            Load a ROM to begin
          </span>
        </div>
      )}
      {initError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-center text-paper text-[10px] font-pixel leading-relaxed p-4 pointer-events-none select-none">
          {initError}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={240}
        height={160}
        style={{ width: 240 * scale, height: 160 * scale, imageRendering: 'pixelated' }}
      />
      <PauseButton />
    </div>
  )
}
