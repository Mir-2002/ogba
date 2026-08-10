import { useContext, useEffect, useLayoutEffect, useRef } from 'react'
import { GbaContext } from 'react-gbajs'
import type { GbaKeyIndex } from '@/types/gba'

export function useTouchButton(keyIndex: GbaKeyIndex) {
  const { gba } = useContext(GbaContext)
  const ref = useRef<HTMLButtonElement>(null)
  const gbaRef = useRef(gba)

  // Keep gbaRef current without triggering the layout effect
  useEffect(() => { gbaRef.current = gba }, [gba])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const onPress = (e: PointerEvent) => {
      e.preventDefault()
      el.setPointerCapture(e.pointerId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(gbaRef.current as any)?.keypad?.keyDown(keyIndex)
    }
    const onRelease = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(gbaRef.current as any)?.keypad?.keyUp(keyIndex)
    }

    el.addEventListener('pointerdown', onPress)
    el.addEventListener('pointerup', onRelease)
    el.addEventListener('pointercancel', onRelease)
    el.addEventListener('pointerleave', onRelease)

    return () => {
      el.removeEventListener('pointerdown', onPress)
      el.removeEventListener('pointerup', onRelease)
      el.removeEventListener('pointercancel', onRelease)
      el.removeEventListener('pointerleave', onRelease)
    }
  }, [keyIndex]) // gba intentionally removed — use gbaRef instead

  return ref
}
