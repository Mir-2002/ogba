import { useEffect, useLayoutEffect, useRef } from 'react'
import { useEmulator } from '@/emulator/useEmulator'
import type { GbaButton } from '@/types/gba'

export function useTouchButton(button: GbaButton) {
  const { press, release } = useEmulator()
  const ref = useRef<HTMLButtonElement>(null)
  const apiRef = useRef({ press, release })
  const pressedRef = useRef(false)

  // Keep apiRef current without re-binding listeners on every render
  useEffect(() => { apiRef.current = { press, release } }, [press, release])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const doPress = () => {
      if (pressedRef.current) return
      pressedRef.current = true
      apiRef.current.press(button)
    }
    const doRelease = () => {
      if (!pressedRef.current) return
      pressedRef.current = false
      apiRef.current.release(button)
    }

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      el.setPointerCapture(e.pointerId)
      doPress()
    }
    const onContextMenu = (e: Event) => e.preventDefault()

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerup', doRelease)
    el.addEventListener('pointercancel', doRelease)
    el.addEventListener('lostpointercapture', doRelease)
    el.addEventListener('contextmenu', onContextMenu)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointerup', doRelease)
      el.removeEventListener('pointercancel', doRelease)
      el.removeEventListener('lostpointercapture', doRelease)
      el.removeEventListener('contextmenu', onContextMenu)
      doRelease() // don't leave the button stuck pressed if we unmount mid-press
    }
  }, [button]) // press/release intentionally excluded — use apiRef instead

  return ref
}
