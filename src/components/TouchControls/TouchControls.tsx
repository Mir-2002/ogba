import { useMemo } from 'react'
import { DPad } from './DPad'
import { ActionButtons } from './ActionButtons'
import { StartSelect } from './StartSelect'
import { ShoulderButtons } from './ShoulderButtons'

export function TouchControls() {
  const isTouchDevice = useMemo(
    () => window.matchMedia('(pointer: coarse)').matches,
    [],
  )
  if (!isTouchDevice) return null
  return (
    <div
      className="flex flex-col w-full max-w-[480px] touch-none select-none shrink-0 self-center gap-1"
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingTop: '8px',
        WebkitTouchCallout: 'none',
      } as React.CSSProperties}
    >
      {/* Shoulder buttons row */}
      <ShoulderButtons />

      {/* Main controls row */}
      <div className="flex justify-between items-center w-full px-4">
        <DPad />
        <StartSelect />
        <ActionButtons />
      </div>
    </div>
  )
}
