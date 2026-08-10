import ReactGbaJs from 'react-gbajs'
import { useGbaScale } from '@/hooks/useGbaScale'
import { useKeyboardControls } from '@/hooks/useKeyboardControls'
import { PauseButton } from './PauseButton'

interface GameScreenProps {
  hasRom: boolean
  volume: number
}

export function GameScreen({ hasRom, volume }: GameScreenProps) {
  const scale = useGbaScale(hasRom)
  useKeyboardControls(hasRom)

  return (
    <div className="rounded-2xl bg-surface gba-card p-4 lg:p-5 shrink-0 relative">
      {/* Shoulder notch decorations */}
      <div className="absolute top-0 left-4 w-6 h-2 bg-surface2 rounded-b" />
      <div className="absolute top-0 right-4 w-6 h-2 bg-surface2 rounded-b" />

      {/* Speaker grille — right side */}
      <div
        className="absolute right-3 top-1/2 -translate-y-1/2 grid gap-[3px]"
        style={{ gridTemplateColumns: 'repeat(3, 4px)', gridTemplateRows: 'repeat(10, 4px)' }}
        aria-hidden="true"
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="bg-dim opacity-20 rounded-full w-1 h-1" />
        ))}
      </div>

      <div className="rounded-lg bg-[#050508] screen-bezel relative overflow-hidden leading-[0]">
        {!hasRom && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-dim text-xs font-mono pointer-events-none select-none">
            Load a ROM to begin
          </div>
        )}
        <ReactGbaJs scale={scale} volume={volume} />
        <PauseButton />
      </div>
    </div>
  )
}
