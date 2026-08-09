import { GBA_KEYS } from '@/types/gba'
import { useTouchButton } from '@/hooks/useTouchButton'

export function ActionButtons() {
  const aRef = useTouchButton(GBA_KEYS.A)
  const bRef = useTouchButton(GBA_KEYS.B)

  return (
    <div className="grid [grid-template-columns:48px_48px] [grid-template-rows:48px_48px] gap-1 touch-none select-none">
      <button
        ref={aRef} aria-label="A"
        className="[grid-column:2] [grid-row:1] rounded-full bg-accent text-white font-mono font-bold text-sm border-none touch-none appearance-none cursor-pointer shadow-[0_4px_14px_rgba(108,99,255,0.4)] active:scale-95 transition-transform duration-75"
      >
        A
      </button>
      <button
        ref={bRef} aria-label="B"
        className="[grid-column:1] [grid-row:2] rounded-full bg-surface2 border border-white/10 text-muted font-mono font-bold text-sm touch-none appearance-none cursor-pointer active:scale-95 transition-transform duration-75"
      >
        B
      </button>
    </div>
  )
}
