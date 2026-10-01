import { useRef, type ReactNode } from 'react'
import { GameScreen } from '@/components/GameScreen/GameScreen'
import { useGbaScale } from '@/hooks/useGbaScale'

interface DesktopViewProps {
  hasRom: boolean
  panel:  ReactNode
}

// Desktop has a keyboard, so no skin: just the screen, as large as fits at a
// crisp scale, next to the side panel.
export function DesktopView({ hasRom, panel }: DesktopViewProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const scale = useGbaScale(slotRef)

  return (
    <div className="flex h-full gap-6 p-6">
      <main ref={slotRef} className="flex-1 min-w-0 min-h-0 flex items-center justify-center">
        <GameScreen
          hasRom={hasRom}
          className="rounded-sm bezel-inset"
          style={{ width: 240 * scale, height: 160 * scale }}
        />
      </main>
      <aside className="w-72 xl:w-80 shrink-0 flex flex-col gap-3 p-5 overflow-y-auto bg-ink pixel-border text-paper rounded-sm">
        {panel}
      </aside>
    </div>
  )
}
