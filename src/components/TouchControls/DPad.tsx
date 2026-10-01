import { useLayoutEffect, useRef, useState } from 'react'
import { useEmulator } from '@/emulator/useEmulator'
import type { GbaButton } from '@/types/gba'

type Direction = Extract<GbaButton, 'Up' | 'Down' | 'Left' | 'Right'>

const DEAD_ZONE_PX = 14

// Diagonals are a narrow ~22.5deg band centred on each 45deg line; the rest of
// each quadrant (~67.5deg either side of a cardinal) resolves to that single
// cardinal direction. Angles follow standard math convention (0=right, 90=up).
function directionsFromOffset(dx: number, dy: number): Direction[] {
  if (Math.hypot(dx, dy) < DEAD_ZONE_PX) return []

  const angle = Math.atan2(-dy, dx) * (180 / Math.PI)

  if (angle > -33.75 && angle <= 33.75)   return ['Right']
  if (angle > 33.75 && angle <= 56.25)    return ['Up', 'Right']
  if (angle > 56.25 && angle <= 123.75)   return ['Up']
  if (angle > 123.75 && angle <= 146.25)  return ['Up', 'Left']
  if (angle > 146.25 || angle <= -146.25) return ['Left']
  if (angle > -146.25 && angle <= -123.75) return ['Down', 'Left']
  if (angle > -123.75 && angle <= -56.25)  return ['Down']
  return ['Down', 'Right'] // -56.25 < angle <= -33.75
}

export function DPad() {
  const { press, release } = useEmulator()
  const apiRef = useRef({ press, release })
  useLayoutEffect(() => { apiRef.current = { press, release } }, [press, release])

  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<Set<Direction>>(new Set())
  const [activeDirs, setActiveDirs] = useState<ReadonlySet<Direction>>(new Set())

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const applyDirections = (next: Direction[]) => {
      const nextSet = new Set(next)
      for (const dir of activeRef.current) {
        if (!nextSet.has(dir)) apiRef.current.release(dir)
      }
      for (const dir of nextSet) {
        if (!activeRef.current.has(dir)) apiRef.current.press(dir)
      }
      activeRef.current = nextSet
      setActiveDirs(nextSet)
    }

    const releaseAll = () => applyDirections([])

    const updateFromPoint = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      applyDirections(directionsFromOffset(clientX - cx, clientY - cy))
    }

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      el.setPointerCapture(e.pointerId)
      updateFromPoint(e.clientX, e.clientY)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!el.hasPointerCapture(e.pointerId)) return
      updateFromPoint(e.clientX, e.clientY)
    }
    const onContextMenu = (e: Event) => e.preventDefault()

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', releaseAll)
    el.addEventListener('pointercancel', releaseAll)
    el.addEventListener('lostpointercapture', releaseAll)
    el.addEventListener('contextmenu', onContextMenu)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', releaseAll)
      el.removeEventListener('pointercancel', releaseAll)
      el.removeEventListener('lostpointercapture', releaseAll)
      el.removeEventListener('contextmenu', onContextMenu)
      releaseAll()
    }
  }, [])

  const armClass = (dir: Direction, position: string) =>
    [
      'bg-surface border border-white/10 pointer-events-none transition-colors duration-75 neu-button',
      position,
      activeDirs.has(dir) ? 'neu-button-pressed bg-surface2' : '',
    ].join(' ')

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="D-pad"
      className="relative grid [grid-template-columns:repeat(3,44px)] [grid-template-rows:repeat(3,44px)] touch-none select-none cursor-pointer"
    >
      <div className={armClass('Up', '[grid-column:2] [grid-row:1] rounded-t')} />
      {/* Center disc */}
      <div className="[grid-column:2] [grid-row:2] flex items-center justify-center pointer-events-none">
        <div className="w-8 h-8 bg-[#0a0c12] rounded-full" />
      </div>
      <div className={armClass('Left', '[grid-column:1] [grid-row:2] rounded-l')} />
      <div className={armClass('Right', '[grid-column:3] [grid-row:2] rounded-r')} />
      <div className={armClass('Down', '[grid-column:2] [grid-row:3] rounded-b')} />
    </div>
  )
}
