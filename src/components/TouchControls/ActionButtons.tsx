import { useTouchButton } from '@/hooks/useTouchButton'

export function ActionButtons() {
  const aRef = useTouchButton('A')
  const bRef = useTouchButton('B')

  return (
    <div className="grid [grid-template-columns:44px_44px] [grid-template-rows:44px_44px] gap-1 touch-none select-none">
      <button
        type="button" ref={aRef} aria-label="A"
        className="[grid-column:2] [grid-row:1] rounded-full bg-shell text-paper font-pixel text-xs border-none touch-none appearance-none cursor-pointer btn-raised active:btn-pressed focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
      >
        A
      </button>
      <button
        type="button" ref={bRef} aria-label="B"
        className="[grid-column:1] [grid-row:2] rounded-full bg-shell text-paper font-pixel text-xs touch-none appearance-none cursor-pointer btn-raised active:btn-pressed focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
      >
        B
      </button>
    </div>
  )
}
