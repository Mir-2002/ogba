import { useCallback, useEffect, useState } from 'react'
import { parseDeltaSkin, type DeltaSkin } from './deltaSkin'
import { clearCustomSkin, loadCustomSkin, saveCustomSkin } from './skinStore'

const DEFAULT_SKIN_URL = '/skins/DarkSP.deltaskin'

interface DeltaSkinState {
  skin:     DeltaSkin | null
  isCustom: boolean
  error:    string | null
}

async function fetchDefaultSkin(): Promise<DeltaSkin> {
  const res = await fetch(DEFAULT_SKIN_URL)
  if (!res.ok) throw new Error(`Couldn't load the default skin (${res.status})`)
  return parseDeltaSkin(new Uint8Array(await res.arrayBuffer()))
}

// `enabled` is false on desktop, which never shows a skin, so it doesn't
// download one either.
export function useDeltaSkin(enabled: boolean) {
  const [state, setState] = useState<DeltaSkinState>({ skin: null, isCustom: false, error: null })
  const loaded = state.skin !== null

  useEffect(() => {
    if (!enabled || loaded) return
    let cancelled = false
    ;(async () => {
      const custom = await loadCustomSkin()
      if (custom) {
        try {
          const skin = parseDeltaSkin(custom)
          if (!cancelled) setState({ skin, isCustom: true, error: null })
          return
        } catch {
          // Stored skin went bad — drop it and fall back to the default.
          await clearCustomSkin()
        }
      }
      try {
        const skin = await fetchDefaultSkin()
        if (!cancelled) setState({ skin, isCustom: false, error: null })
      } catch (e) {
        if (!cancelled) setState({ skin: null, isCustom: false, error: e instanceof Error ? e.message : 'Failed to load skin' })
      }
    })()
    return () => { cancelled = true }
  }, [enabled, loaded])

  // Validates before persisting, so a bad file never replaces a working skin.
  const importSkin = useCallback(async (file: File) => {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const skin = parseDeltaSkin(bytes)
      await saveCustomSkin(bytes)
      setState({ skin, isCustom: true, error: null })
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : 'Failed to import skin' }))
    }
  }, [])

  const resetSkin = useCallback(async () => {
    await clearCustomSkin()
    try {
      setState({ skin: await fetchDefaultSkin(), isCustom: false, error: null })
    } catch (e) {
      setState({ skin: null, isCustom: false, error: e instanceof Error ? e.message : 'Failed to load skin' })
    }
  }, [])

  return { ...state, importSkin, resetSkin }
}
