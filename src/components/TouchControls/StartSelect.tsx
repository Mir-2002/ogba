import { useTouchButton } from '@/hooks/useTouchButton'

const pillClass = 'px-4 py-1.5 rounded-full bg-surface border border-white/10 text-dim text-[0.65rem] font-mono tracking-wide touch-none appearance-none cursor-pointer active:bg-surface2 transition-colors duration-75 neu-button active:neu-button-pressed'

export function StartSelect() {
  const selectRef = useTouchButton('Select')
  const startRef  = useTouchButton('Start')

  return (
    <div className="flex flex-col gap-2 items-center touch-none select-none">
      <button type="button" ref={selectRef} className={pillClass} aria-label="Select">SELECT</button>
      <button type="button" ref={startRef}  className={pillClass} aria-label="Start">START</button>
    </div>
  )
}
