import { useContext, useEffect } from 'react'
import ReactGbaJs, { GbaContext } from 'react-gbajs'
import { GBA_KEYS } from '@/types/gba'
import { useGbaScale } from '@/hooks/useGbaScale'

interface GameScreenProps {
  hasRom: boolean
}

export function GameScreen({ hasRom }: GameScreenProps) {
  const { gba } = useContext(GbaContext)
  const scale = useGbaScale(hasRom)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(gba as any)?.keypad?.keyDown(GBA_KEYS.SELECT)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(gba as any)?.keypad?.keyUp(GBA_KEYS.SELECT)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [gba])

  return (
    <div className="rounded-2xl bg-surface gba-card p-4 lg:p-5 shrink-0">
      <div className="rounded-lg bg-[#050508] screen-bezel relative overflow-hidden leading-[0]">
        {!hasRom && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-dim text-xs font-mono pointer-events-none select-none">
            Load a ROM to begin
          </div>
        )}
        <ReactGbaJs scale={scale} volume={0.5} />
      </div>
    </div>
  )
}
