import { useContext, useLayoutEffect, useRef } from 'react'
import { GbaContext } from 'react-gbajs'
import type { GbaKeyIndex } from '@/types/gba'

export function useTouchButton(keyIndex: GbaKeyIndex) {
  const { gba } = useContext(GbaContext)
  const ref = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const onPress = (e: Event) => {
      e.preventDefault()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(gba as any)?.keypad?.keyDown(keyIndex)
    }
    const onRelease = (e: Event) => {
      e.preventDefault()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(gba as any)?.keypad?.keyUp(keyIndex)
    }

    const opts: AddEventListenerOptions = { passive: false }
    el.addEventListener('touchstart', onPress, opts)
    el.addEventListener('touchend', onRelease, opts)
    el.addEventListener('touchcancel', onRelease, opts)
    el.addEventListener('mousedown', onPress, opts)
    el.addEventListener('mouseup', onRelease, opts)
    el.addEventListener('mouseleave', onRelease, opts)

    return () => {
      el.removeEventListener('touchstart', onPress)
      el.removeEventListener('touchend', onRelease)
      el.removeEventListener('touchcancel', onRelease)
      el.removeEventListener('mousedown', onPress)
      el.removeEventListener('mouseup', onRelease)
      el.removeEventListener('mouseleave', onRelease)
    }
  }, [gba, keyIndex])

  return ref
}
