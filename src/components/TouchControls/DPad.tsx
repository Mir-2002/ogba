import { GBA_KEYS } from '@/types/gba'
import { useTouchButton } from '@/hooks/useTouchButton'

export function DPad() {
  const upRef = useTouchButton(GBA_KEYS.UP)
  const downRef = useTouchButton(GBA_KEYS.DOWN)
  const leftRef = useTouchButton(GBA_KEYS.LEFT)
  const rightRef = useTouchButton(GBA_KEYS.RIGHT)

  const base = 'bg-surface border border-white/10 p-0 cursor-pointer touch-none appearance-none active:bg-surface2 transition-colors duration-75'

  return (
    <div className="grid [grid-template-columns:repeat(3,44px)] [grid-template-rows:repeat(3,44px)] touch-none select-none">
      <button ref={upRef}    className={`${base} [grid-column:2] [grid-row:1] rounded-t`}    aria-label="Up" />
      <button ref={leftRef}  className={`${base} [grid-column:1] [grid-row:2] rounded-l`}  aria-label="Left" />
      <button ref={rightRef} className={`${base} [grid-column:3] [grid-row:2] rounded-r`} aria-label="Right" />
      <button ref={downRef}  className={`${base} [grid-column:2] [grid-row:3] rounded-b`}  aria-label="Down" />
    </div>
  )
}
