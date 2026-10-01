import { unzipSync, strFromU8 } from 'fflate'
import type { GbaButton } from '@/types/gba'

// Subset of the Delta skin format (info.json inside a .deltaskin zip) that a
// GBA skin uses. See https://noah978.gitbook.io/delta-docs/skins
export interface Rect { x: number; y: number; width: number; height: number }
export type Edges = Partial<Record<'top' | 'bottom' | 'left' | 'right', number>>

export type SkinInput = GbaButton | 'menu'

export interface SkinItem {
  // Buttons list their inputs; a D-pad maps directions to inputs.
  inputs:         string[] | Partial<Record<'up' | 'down' | 'left' | 'right', string>>
  frame:          Rect
  extendedEdges?: Edges
}

export interface SkinRepresentation {
  assets:           { resizable?: string; small?: string; medium?: string; large?: string }
  items:            SkinItem[]
  mappingSize:      { width: number; height: number }
  extendedEdges?:   Edges
  translucent?:     boolean
  screens?:         { outputFrame?: Rect }[]
  gameScreenFrame?: Rect
}

type Orientation = 'portrait' | 'landscape'
type DisplayType = 'standard' | 'edgeToEdge'

interface SkinInfo {
  name:               string
  identifier:         string
  gameTypeIdentifier: string
  representations:    Record<string, Partial<Record<DisplayType, Partial<Record<Orientation, SkinRepresentation>>>>>
}

export interface DeltaSkin {
  name:       string
  identifier: string
  info:       SkinInfo
  files:      Record<string, Uint8Array>
}

const GBA_GAME_TYPE = 'com.rileytestut.delta.game.gba'

export function parseDeltaSkin(bytes: Uint8Array): DeltaSkin {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new Error('Not a valid .deltaskin file')
  }
  const infoBytes = files['info.json']
  if (!infoBytes) throw new Error('Skin is missing info.json')

  const info = JSON.parse(strFromU8(infoBytes)) as SkinInfo
  if (info.gameTypeIdentifier !== GBA_GAME_TYPE) {
    throw new Error(`"${info.name ?? 'This skin'}" is not a GBA skin`)
  }
  return { name: info.name, identifier: info.identifier, info, files }
}

// Delta picks a representation per device + screen shape + orientation. We
// only get a viewport, so: tall phones (notch era, ~19.5:9) want edgeToEdge,
// older 16:9 shapes want standard, falling back to whatever the skin has.
export function pickRepresentation(skin: DeltaSkin, width: number, height: number): SkinRepresentation | null {
  const orientation: Orientation = height >= width ? 'portrait' : 'landscape'
  const aspect = Math.max(width, height) / Math.min(width, height)
  const displayOrder: DisplayType[] = aspect > 1.9 ? ['edgeToEdge', 'standard'] : ['standard', 'edgeToEdge']
  const devices = [skin.info.representations.iphone, skin.info.representations.ipad].filter(Boolean)

  for (const device of devices) {
    for (const display of displayOrder) {
      const rep = device?.[display]?.[orientation]
      if (rep) return rep
    }
  }
  return null
}

export function screenFrame(rep: SkinRepresentation): Rect | null {
  return rep.screens?.[0]?.outputFrame ?? rep.gameScreenFrame ?? null
}

const BUTTONS: Record<string, SkinInput> = {
  a: 'A', b: 'B', l: 'L', r: 'R',
  start: 'Start', select: 'Select',
  up: 'Up', down: 'Down', left: 'Left', right: 'Right',
  menu: 'menu',
}

function edge(item: SkinItem, rep: SkinRepresentation, side: keyof Edges): number {
  return item.extendedEdges?.[side] ?? rep.extendedEdges?.[side] ?? 0
}

function contains(r: Rect, x: number, y: number) {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
}

function distanceToRect(r: Rect, x: number, y: number) {
  const dx = Math.max(r.x - x, 0, x - (r.x + r.width))
  const dy = Math.max(r.y - y, 0, y - (r.y + r.height))
  return Math.hypot(dx, dy)
}

// Narrow ~22.5deg diagonal bands around each 45deg line, a small centre dead
// zone (relative to the pad size), cardinals everywhere else.
function dpadDirections(item: SkinItem, x: number, y: number): ('up' | 'down' | 'left' | 'right')[] {
  const { frame } = item
  const dx = (x - (frame.x + frame.width / 2)) / (frame.width / 2)
  const dy = (y - (frame.y + frame.height / 2)) / (frame.height / 2)
  if (Math.hypot(dx, dy) < 0.2) return []

  const angle = Math.atan2(-dy, dx) * (180 / Math.PI)
  if (angle > -33.75 && angle <= 33.75)    return ['right']
  if (angle > 33.75 && angle <= 56.25)     return ['up', 'right']
  if (angle > 56.25 && angle <= 123.75)    return ['up']
  if (angle > 123.75 && angle <= 146.25)   return ['up', 'left']
  if (angle > 146.25 || angle <= -146.25)  return ['left']
  if (angle > -146.25 && angle <= -123.75) return ['down', 'left']
  if (angle > -123.75 && angle <= -56.25)  return ['down']
  return ['down', 'right']
}

// Resolves a point (in mapping-size coordinates) to the inputs it presses.
// A touch inside an item's real frame wins; otherwise the nearest item whose
// extended edges reach the point, so generous hit areas don't double-press
// neighbours that overlap.
export function inputsAt(rep: SkinRepresentation, x: number, y: number): SkinInput[] {
  let hit: SkinItem | null = rep.items.find((item) => contains(item.frame, x, y)) ?? null

  if (!hit) {
    let best = Infinity
    for (const item of rep.items) {
      const f = item.frame
      const extended: Rect = {
        x:      f.x - edge(item, rep, 'left'),
        y:      f.y - edge(item, rep, 'top'),
        width:  f.width + edge(item, rep, 'left') + edge(item, rep, 'right'),
        height: f.height + edge(item, rep, 'top') + edge(item, rep, 'bottom'),
      }
      if (!contains(extended, x, y)) continue
      const d = distanceToRect(f, x, y)
      if (d < best) { best = d; hit = item }
    }
  }
  if (!hit) return []

  const { inputs } = hit
  const names = Array.isArray(inputs)
    ? inputs
    : dpadDirections(hit, x, y).map((dir) => inputs[dir]).filter((n): n is string => !!n)

  return names.map((n) => BUTTONS[n.toLowerCase()]).filter((n): n is SkinInput => !!n)
}
