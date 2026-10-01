import { useTouchButton } from '@/hooks/useTouchButton'

const pillClass = 'px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-ink text-paper text-[0.5rem] sm:text-[0.55rem] font-pixel tracking-wide touch-none appearance-none cursor-pointer border-none transition-transform duration-75 btn-raised active:btn-pressed focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper'

export function StartSelect() {
  const selectRef = useTouchButton('Select')
  const startRef  = useTouchButton('Start')

  return (
    // Angled like the real buttons — but only where there's room to spare;
    // on narrow phones they stay level so the row doesn't need the wider
    // rotated bounding box.
    <div className="flex gap-2 items-center touch-none select-none lg:-rotate-[20deg]">
      <button type="button" ref={selectRef} className={pillClass} aria-label="Select">SELECT</button>
      <button type="button" ref={startRef}  className={pillClass} aria-label="Start">START</button>
    </div>
  )
}
