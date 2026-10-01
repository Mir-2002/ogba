import { useTouchButton } from '@/hooks/useTouchButton'

export function ShoulderButtons() {
  const lRef = useTouchButton('L')
  const rRef = useTouchButton('R')

  const pillClass = 'px-5 py-1.5 rounded-full bg-surface border border-white/10 text-dim text-[0.65rem] font-mono tracking-wide touch-none appearance-none cursor-pointer active:bg-surface2 transition-colors duration-75 neu-button active:neu-button-pressed'

  return (
    <div className="flex justify-between w-full px-1 touch-none select-none">
      <button type="button" ref={lRef} className={pillClass} aria-label="Left shoulder (L)">L</button>
      <button type="button" ref={rRef} className={pillClass} aria-label="Right shoulder (R)">R</button>
    </div>
  )
}
