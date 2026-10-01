import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import mGBA, { type mGBAEmulator } from '@thenick775/mgba-wasm'
import { EmulatorContext, type EmulatorApi, type EmulatorState } from './useEmulator'
import type { GbaButton } from '@/types/gba'

// mGBA's own default SDL keymap already gives us X=A, Z=B, Return=Start,
// Backspace=Select and arrows=D-pad, so we only need to rebind the shoulder
// buttons (default is A=L, S=R) to our Q/E mapping.
const KEY_REBINDS: ReadonlyArray<[sdlKey: string, input: string]> = [
  ['Q', 'L'],
  ['E', 'R'],
]

const FS_SYNC_DEBOUNCE_MS = 1500
const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() || 'rom.gba'
  return base.replace(/[^A-Za-z0-9._-]/g, '_')
}

// mGBA's native saveState/loadState(slot) derive their own file name from the
// loaded ROM path; we don't know that convention for certain, so we compute
// our best-guess path and fall back to scanning the state directory for
// whatever file actually carries the `.ss<slot>` suffix.
function trimExtension(path: string): string {
  const parts = path.split('.')
  if (parts.length > 1) parts.pop()
  return parts.join('.')
}

function stateFilePath(mod: mGBAEmulator, slot: number, forWrite: boolean): string {
  const paths = mod.filePaths()
  const suffix = `.ss${slot}`

  const romPath = mod.gameName
  const guessedBase = romPath ? trimExtension(romPath.split('/').pop() ?? romPath) : null
  const guessedPath = guessedBase ? `${paths.saveStatePath}/${guessedBase}${suffix}` : null

  if (forWrite) {
    // Writing ahead of loadState: prefer the guessed, ROM-derived name.
    return guessedPath ?? `${paths.saveStatePath}/slot${suffix}`
  }

  if (guessedPath && mod.FS.analyzePath(guessedPath).exists) return guessedPath

  const entries = mod.FS.readdir(paths.saveStatePath).filter((f) => f.endsWith(suffix))
  if (entries.length > 0) return `${paths.saveStatePath}/${entries[0]}`

  throw new Error(`No save state file found for slot ${slot}`)
}

// Singletons at module scope — survive React StrictMode's mount/cleanup/mount
// dance and guarantee mGBA({ canvas }) is only ever called once per page load.
let modulePromise: Promise<mGBAEmulator> | null = null

// mGBA stays bound to the canvas it was created with, so the app owns exactly
// one and layouts *move* it (desktop screen <-> mobile skin) instead of each
// rendering their own <canvas>, which would orphan the emulator on remount.
let sharedCanvas: HTMLCanvasElement | null = null

function getSharedCanvas(): HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas')
    sharedCanvas.width  = 240
    sharedCanvas.height = 160
    Object.assign(sharedCanvas.style, {
      display:        'block',
      width:          '100%',
      height:         '100%',
      imageRendering: 'pixelated',
    })
  }
  return sharedCanvas
}

function getOrCreateModule(canvas: HTMLCanvasElement): Promise<mGBAEmulator> {
  if (!modulePromise) {
    modulePromise = mGBA({ canvas }).then(async (mod) => {
      await mod.FSInit()
      for (const [sdlKey, input] of KEY_REBINDS) mod.bindKey(sdlKey, input)
      return mod
    })
  }
  return modulePromise
}

interface EmulatorProviderProps {
  children: ReactNode
}

export function EmulatorProvider({ children }: EmulatorProviderProps) {
  const [state, setState] = useState<EmulatorState>({
    ready:      false,
    isRunning:  false,
    isPaused:   false,
    initError:  null,
  })

  const moduleRef   = useRef<mGBAEmulator | null>(null)
  const stateRef    = useRef(state)
  const volumeRef   = useRef(0.5)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { stateRef.current = state }, [state])

  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      moduleRef.current?.FSSync().catch(() => {})
    }, FS_SYNC_DEBOUNCE_MS)
  }, [])

  const initStartedRef = useRef(false)

  const screenHostRef = useCallback((host: HTMLElement | null) => {
    if (!host) return
    const canvas = getSharedCanvas()
    if (canvas.parentElement !== host) host.prepend(canvas)

    if (initStartedRef.current) return
    initStartedRef.current = true

    if (!window.crossOriginIsolated) {
      setState((s) => ({
        ...s,
        initError: 'This page is not cross-origin isolated, so mGBA (which needs SharedArrayBuffer) cannot start. Check COOP/COEP headers.',
      }))
      return
    }

    getOrCreateModule(canvas)
      .then((mod) => {
        moduleRef.current = mod
        mod.setVolume(volumeRef.current)
        mod.addCoreCallbacks({
          saveDataUpdatedCallback:       scheduleSync,
          autoSaveStateCapturedCallback: scheduleSync,
        })
        setState((s) => ({ ...s, ready: true }))
      })
      .catch((err) => {
        setState((s) => ({
          ...s,
          initError: err instanceof Error ? err.message : 'Failed to initialize the emulator.',
        }))
      })
  }, [scheduleSync])

  // Flush pending FS writes to IndexedDB when the tab is backgrounded/closed.
  useEffect(() => {
    const flush = () => { moduleRef.current?.FSSync().catch(() => {}) }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Browsers start AudioContexts suspended until a user gesture; nudge it
  // awake on the first interaction (and any time it drifts back to suspended).
  useEffect(() => {
    const resumeAudio = () => {
      const ctx = moduleRef.current?.SDL2?.audioContext
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
    }
    window.addEventListener('pointerdown', resumeAudio)
    window.addEventListener('keydown', resumeAudio)
    return () => {
      window.removeEventListener('pointerdown', resumeAudio)
      window.removeEventListener('keydown', resumeAudio)
    }
  }, [])

  // mGBA's SDL keyboard layer listens globally and doesn't know about our
  // text inputs — mute it while focus is in one, and stop arrow keys from
  // scrolling the page while a game is running.
  useEffect(() => {
    const onFocusIn  = (e: FocusEvent) => { if (isEditableTarget(e.target)) moduleRef.current?.toggleInput(false) }
    const onFocusOut = (e: FocusEvent) => { if (isEditableTarget(e.target)) moduleRef.current?.toggleInput(true) }
    const onKeyDown  = (e: KeyboardEvent) => {
      if (!stateRef.current.isRunning) return
      if (isEditableTarget(document.activeElement)) return
      if (ARROW_KEYS.has(e.key)) e.preventDefault()
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const loadRom = useCallback(async (bytes: Uint8Array, fileName: string): Promise<boolean> => {
    const mod = moduleRef.current
    if (!mod) throw new Error('Emulator is not ready yet')

    const paths = mod.filePaths()
    const romPath = `${paths.gamePath}/${sanitizeFileName(fileName)}`

    // /data is IDBFS-backed, so every ROM written here would persist in
    // IndexedDB forever. Keep only the one being played.
    for (const entry of mod.FS.readdir(paths.gamePath)) {
      const path = `${paths.gamePath}/${entry}`
      if (entry !== '.' && entry !== '..' && path !== romPath) mod.FS.unlink(path)
    }
    mod.FS.writeFile(romPath, bytes)

    const success = mod.loadGame(romPath)
    if (success) {
      mod.setVolume(volumeRef.current)
      setState((s) => ({ ...s, isRunning: true, isPaused: false }))
    }
    return success
  }, [])

  const ejectRom = useCallback(() => {
    moduleRef.current?.quitGame()
    setState((s) => ({ ...s, isRunning: false, isPaused: false }))
  }, [])

  const press = useCallback((button: GbaButton) => {
    moduleRef.current?.buttonPress(button)
  }, [])

  const release = useCallback((button: GbaButton) => {
    moduleRef.current?.buttonUnpress(button)
  }, [])

  const pause = useCallback(() => {
    moduleRef.current?.pauseGame()
    setState((s) => ({ ...s, isPaused: true }))
  }, [])

  const resume = useCallback(() => {
    moduleRef.current?.resumeGame()
    setState((s) => ({ ...s, isPaused: false }))
  }, [])

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume))
    volumeRef.current = clamped
    moduleRef.current?.setVolume(clamped)
  }, [])

  const exportState = useCallback(async (): Promise<Uint8Array<ArrayBuffer>> => {
    const mod = moduleRef.current
    if (!mod) throw new Error('Emulator is not ready yet')
    if (!mod.saveState(0)) throw new Error('Failed to capture save state')
    const path = stateFilePath(mod, 0, false)
    const data = mod.FS.readFile(path) as Uint8Array
    // Copy into a fresh, non-shared ArrayBuffer-backed Uint8Array before it
    // goes anywhere near gzip/upload.
    return new Uint8Array(data)
  }, [])

  const importState = useCallback(async (bytes: Uint8Array<ArrayBuffer>): Promise<boolean> => {
    const mod = moduleRef.current
    if (!mod) throw new Error('Emulator is not ready yet')
    const path = stateFilePath(mod, 0, true)
    mod.FS.writeFile(path, bytes)
    return mod.loadState(0)
  }, [])

  const api = useMemo<EmulatorApi>(() => ({
    ...state,
    screenHostRef,
    loadRom,
    ejectRom,
    press,
    release,
    pause,
    resume,
    setVolume,
    exportState,
    importState,
  }), [state, screenHostRef, loadRom, ejectRom, press, release, pause, resume, setVolume, exportState, importState])

  return (
    <EmulatorContext.Provider value={api}>
      {children}
    </EmulatorContext.Provider>
  )
}
