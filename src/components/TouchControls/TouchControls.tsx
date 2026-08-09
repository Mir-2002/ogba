import { useMemo } from 'react'
import { DPad } from './DPad'
import { ActionButtons } from './ActionButtons'
import { StartSelect } from './StartSelect'

export function TouchControls() {
  const isTouchDevice = useMemo(
    () => window.matchMedia('(pointer: coarse)').matches,
    [],
  )
  if (!isTouchDevice) return null
  return (
    <div
      className="flex justify-between items-center w-full max-w-[480px] px-4 touch-none select-none shrink-0 self-center"
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingTop: '8px',
      }}
    >
      <DPad />
      <StartSelect />
      <ActionButtons />
    </div>
  )
}
