import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useEmulator } from '@/emulator/useEmulator'
import { GameScreen } from '@/components/GameScreen/GameScreen'
import { inputsAt, pickRepresentation, screenFrame, type DeltaSkin, type SkinInput } from '@/skins/deltaSkin'
import { renderSkinAsset } from '@/skins/renderSkinAsset'
import type { GbaButton } from '@/types/gba'

interface SkinViewProps {
  skin:          DeltaSkin | null
  skinError:     string | null
  hasRom:        boolean
  onMenu:        () => void
}

interface Box { left: number; top: number; width: number; height: number }

const GBA_ASPECT = 240 / 160

function fitScreen(area: Box): Box {
  const width  = Math.min(area.width, area.height * GBA_ASPECT)
  const height = width / GBA_ASPECT
  return { left: area.left + (area.width - width) / 2, top: area.top + (area.height - height) / 2, width, height }
}

const toStyle = (b: Box): CSSProperties => ({ position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height })

// Mobile layout: the game screen plus a Delta skin drawn over/under it, with
// the skin's own item frames driving input. Delta skins come in three shapes:
// - an explicit screen frame (screens/gameScreenFrame) inside the artwork,
// - translucent overlays (landscape): screen fills the view, skin on top,
// - controller-only (portrait): skin pinned to the bottom, screen above it.
export function SkinView({ skin, skinError, hasRom, onMenu }: SkinViewProps) {
  const { press, release } = useEmulator()
  const rootRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0, safeTop: 0 })

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      const safeTop = parseFloat(getComputedStyle(el).getPropertyValue('--safe-top')) || 0
      setViewport({ width: el.clientWidth, height: el.clientHeight, safeTop })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rep = useMemo(
    () => (skin && viewport.width ? pickRepresentation(skin, viewport.width, viewport.height) : null),
    [skin, viewport.width, viewport.height],
  )

  const layout = useMemo(() => {
    const { width: vw, height: vh, safeTop } = viewport
    if (!rep || !vw || !vh) {
      return { scale: 0, skinBox: null, screenBox: fitScreen({ left: 0, top: safeTop, width: vw, height: vh * 0.45 }), skinOnTop: false }
    }
    const { width: mw, height: mh } = rep.mappingSize
    const frame = screenFrame(rep)

    if (frame || rep.translucent) {
      const scale = Math.min(vw / mw, vh / mh)
      const skinBox = { left: (vw - mw * scale) / 2, top: (vh - mh * scale) / 2, width: mw * scale, height: mh * scale }
      const screenBox = frame
        ? { left: skinBox.left + frame.x * scale, top: skinBox.top + frame.y * scale, width: frame.width * scale, height: frame.height * scale }
        : fitScreen(skinBox)
      return { scale, skinBox, screenBox, skinOnTop: !!rep.translucent }
    }

    const scale = vw / mw
    const skinH = mh * scale
    const skinBox = { left: 0, top: vh - skinH, width: vw, height: skinH }
    // Centred in the space between the safe-area top and the skin, so any
    // spare height on tall phones splits evenly above and below the screen.
    const screenBox = fitScreen({ left: 0, top: safeTop, width: vw, height: Math.max(0, vh - skinH - safeTop) })
    return { scale, skinBox, screenBox, skinOnTop: false }
  }, [rep, viewport])

  // Rasterize the artwork at the box's device-pixel width (rounded so small
  // resizes reuse the cached render).
  const [artUrl, setArtUrl] = useState<string | null>(null)
  const [artError, setArtError] = useState<string | null>(null)
  const pixelWidth = layout.skinBox ? Math.ceil((layout.skinBox.width * (window.devicePixelRatio || 1)) / 64) * 64 : 0
  useEffect(() => {
    if (!skin || !rep || !pixelWidth) return
    let cancelled = false
    renderSkinAsset(skin, rep, pixelWidth)
      .then((url) => { if (!cancelled) { setArtUrl(url); setArtError(null) } })
      .catch((e) => { if (!cancelled) setArtError(e instanceof Error ? e.message : 'Failed to draw skin') })
    return () => { cancelled = true }
  }, [skin, rep, pixelWidth])

  // --- Input -----------------------------------------------------------------
  const overlayRef  = useRef<HTMLDivElement>(null)
  const apiRef      = useRef({ press, release, onMenu })
  const repRef      = useRef(rep)
  const scaleRef    = useRef(layout.scale)
  const pointersRef = useRef(new Map<number, Set<SkinInput>>())
  const heldRef     = useRef(new Set<GbaButton>())
  const [held, setHeld] = useState<ReadonlySet<SkinInput>>(new Set())

  useEffect(() => { apiRef.current = { press, release, onMenu } }, [press, release, onMenu])
  useEffect(() => { repRef.current = rep; scaleRef.current = layout.scale }, [rep, layout.scale])

  const hasSkinBox = layout.skinBox !== null
  useLayoutEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const pointers = pointersRef.current

    const sync = () => {
      const next = new Set<GbaButton>()
      const all = new Set<SkinInput>()
      for (const inputs of pointers.values()) {
        for (const input of inputs) {
          all.add(input)
          if (input !== 'menu') next.add(input)
        }
      }
      let pressedNew = false
      for (const b of heldRef.current) if (!next.has(b)) apiRef.current.release(b)
      for (const b of next) if (!heldRef.current.has(b)) { apiRef.current.press(b); pressedNew = true }
      if (pressedNew) navigator.vibrate?.(8)
      heldRef.current = next
      setHeld(all)
    }

    const update = (e: PointerEvent) => {
      const r = repRef.current
      const scale = scaleRef.current
      if (!r || !scale) return
      const rect = el.getBoundingClientRect()
      const inputs = new Set(inputsAt(r, (e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale))
      const prev = pointers.get(e.pointerId)
      if (inputs.has('menu') && !prev?.has('menu')) apiRef.current.onMenu()
      pointers.set(e.pointerId, inputs)
      sync()
    }

    const onDown = (e: PointerEvent) => {
      e.preventDefault()
      // Capture keeps moves flowing to us when a thumb slides off the skin;
      // it can throw for pointers the browser no longer tracks, so don't let
      // that swallow the press.
      try { el.setPointerCapture(e.pointerId) } catch { /* still handle the press */ }
      update(e)
    }
    const onMove = (e: PointerEvent) => {
      if (pointers.has(e.pointerId)) update(e)
    }
    const onUp = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return
      sync()
    }
    const onContextMenu = (e: Event) => e.preventDefault()

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('lostpointercapture', onUp)
    el.addEventListener('contextmenu', onContextMenu)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('lostpointercapture', onUp)
      el.removeEventListener('contextmenu', onContextMenu)
      // Never leave a button stuck down when the layout changes or unmounts.
      pointers.clear()
      sync()
    }
  }, [hasSkinBox])

  const { skinBox, screenBox, skinOnTop } = layout
  const error = skinError ?? artError

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full bg-black overflow-hidden touch-none select-none"
      style={{ '--safe-top': 'env(safe-area-inset-top)', WebkitTouchCallout: 'none' } as CSSProperties}
    >
      <GameScreen
        hasRom={hasRom}
        onRequestLoad={onMenu}
        className="z-0"
        style={toStyle(screenBox)}
      />

      {skinBox && artUrl && (
        <img
          src={artUrl}
          alt=""
          draggable={false}
          className={`pointer-events-none ${skinOnTop ? 'z-10' : 'z-0'}`}
          // Delta draws translucent overlays at ~70% so the game shows through.
          style={{ ...toStyle(skinBox), opacity: skinOnTop ? 0.7 : 1 }}
        />
      )}

      {skinBox && (
        <div
          ref={overlayRef}
          role="group"
          aria-label={`${skin?.name ?? 'Skin'} controls`}
          data-held={[...held].join(' ')}
          className="z-20 touch-none"
          style={toStyle(skinBox)}
        />
      )}

      {error && (
        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 p-6 text-center">
          <p className="m-0 text-paper font-body text-sm">{error}</p>
          <button
            type="button"
            onClick={onMenu}
            className="font-pixel text-[9px] text-ink bg-paper rounded-sm px-3 py-2 border-none cursor-pointer"
          >
            MENU
          </button>
        </div>
      )}
    </div>
  )
}
