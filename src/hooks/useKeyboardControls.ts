import { useContext, useEffect } from 'react'
import { GbaContext } from 'react-gbajs'
import { GBA_KEYS } from '@/types/gba'

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

const KEY_MAP: Record<string, number> = {
  ArrowUp:    GBA_KEYS.UP,
  ArrowDown:  GBA_KEYS.DOWN,
  ArrowLeft:  GBA_KEYS.LEFT,
  ArrowRight: GBA_KEYS.RIGHT,
  z:          GBA_KEYS.B,
  x:          GBA_KEYS.A,
  Enter:      GBA_KEYS.START,
  Backspace:  GBA_KEYS.SELECT,
  Shift:      GBA_KEYS.SELECT,
  q:          GBA_KEYS.L,
  e:          GBA_KEYS.R,
}

export function useKeyboardControls(enabled: boolean) {
  const { gba } = useContext(GbaContext)

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (ARROW_KEYS.has(e.key)) e.preventDefault()
      const keyIndex = KEY_MAP[e.key]
      if (keyIndex !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(gba as any)?.keypad?.keyDown(keyIndex)
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (ARROW_KEYS.has(e.key)) e.preventDefault()
      const keyIndex = KEY_MAP[e.key]
      if (keyIndex !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(gba as any)?.keypad?.keyUp(keyIndex)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [gba, enabled])
}
