import { useTouchButton } from '@/hooks/useTouchButton'

export function ShoulderButtons() {
  const lRef = useTouchButton('L')
  const rRef = useTouchButton('R')

  const pillClass = 'px-5 py-1.5 rounded-sm bg-ink text-paper text-[0.6rem] font-pixel tracking-wide touch-none appearance-none cursor-pointer border-none transition-transform duration-75 btn-raised active:btn-pressed focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper'

  return (
    <div className="flex justify-between w-full touch-none select-none">
      <button type="button" ref={lRef} className={pillClass} aria-label="Left shoulder (L)">L</button>
      <button type="button" ref={rRef} className={pillClass} aria-label="Right shoulder (R)">R</button>
    </div>
  )
}
