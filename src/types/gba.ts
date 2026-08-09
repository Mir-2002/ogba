export interface GbaKeypad {
  keyDown(index: number): void
  keyUp(index: number): void
  eatInput: boolean
}

export interface GbaInstance {
  keypad: GbaKeypad
}

export const GBA_KEYS = {
  A: 0,
  B: 1,
  SELECT: 2,
  START: 3,
  RIGHT: 4,
  LEFT: 5,
  UP: 6,
  DOWN: 7,
  R: 8,
  L: 9,
} as const

export type GbaKeyIndex = (typeof GBA_KEYS)[keyof typeof GBA_KEYS]
