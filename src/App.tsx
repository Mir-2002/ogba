import { useCallback, useEffect, useRef, useState } from 'react'
import { EmulatorProvider } from '@/emulator/EmulatorProvider'
import { useEmulator } from '@/emulator/useEmulator'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DesktopView } from '@/components/DesktopView/DesktopView'
import { SkinView } from '@/components/SkinView/SkinView'
import { PanelContent } from '@/components/SidePanel/PanelContent'
import { SaveDrawer } from '@/components/SaveDrawer/SaveDrawer'
import { useRomLoader } from '@/hooks/useRomLoader'
import { useAuth } from '@/hooks/useAuth'
import { useCloudSave } from '@/hooks/useCloudSave'
import { useVolume } from '@/hooks/useVolume'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useDeltaSkin } from '@/skins/useDeltaSkin'

// Phones and tablets get the Delta skin; anything with a fine pointer and
// room for the side panel gets the plain desktop layout.
const SKIN_QUERY = '(max-width: 1023px), (hover: none) and (pointer: coarse)'

function AppContent() {
  const { state, loadFile, ejectRom, romId, romTitle } = useRomLoader()
  const { user, loading: authLoading, authError, signIn, signOut } = useAuth()
  const { save, load, listSlots, busy, error, listError } = useCloudSave(user, romId, romTitle)
  const { volume, setVolume, isMuted, toggleMute } = useVolume()
  const emulator = useEmulator()
  const useSkin = useMediaQuery(SKIN_QUERY)
  const skin = useDeltaSkin(useSkin)
  const [menuOpen, setMenuOpen] = useState(false)

  const { ready, setVolume: setEmulatorVolume } = emulator
  useEffect(() => {
    if (ready) setEmulatorVolume(isMuted ? 0 : volume)
  }, [ready, isMuted, volume, setEmulatorVolume])

  // Like Delta, opening the menu mid-game pauses it; closing resumes only if
  // the menu was what paused it.
  const pausedByMenuRef = useRef(false)
  const openMenu = useCallback(() => {
    if (emulator.isRunning && !emulator.isPaused) {
      emulator.pause()
      pausedByMenuRef.current = true
    }
    setMenuOpen(true)
  }, [emulator])
  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    if (pausedByMenuRef.current) {
      pausedByMenuRef.current = false
      emulator.resume()
    }
  }, [emulator])

  const panelProps = {
    state,
    loadFile: (file: File) => { loadFile(file); if (useSkin) closeMenu() },
    ejectRom,
    user,
    authLoading,
    authError,
    // Sign-in leaves the page (OAuth redirect), so get the ROM and latest
    // save data into IndexedDB first; the reload then resumes from it.
    signIn: async () => { await emulator.flush(); await signIn() },
    signOut,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    save,
    load,
    listSlots,
    busy,
    saveError: error,
    listError,
  }

  if (!useSkin) {
    return (
      <div className="h-full bg-ink overflow-hidden">
        <DesktopView hasRom={state.hasRom} panel={<PanelContent {...panelProps} />} />
      </div>
    )
  }

  return (
    <div className="h-full bg-black overflow-hidden">
      <SkinView skin={skin.skin} skinError={skin.error} hasRom={state.hasRom} onMenu={openMenu} />
      <SaveDrawer
        isOpen={menuOpen}
        onClose={closeMenu}
        {...panelProps}
        skin={{
          name:       skin.skin?.name ?? null,
          isCustom:   skin.isCustom,
          error:      skin.error,
          importSkin: skin.importSkin,
          resetSkin:  skin.resetSkin,
        }}
      />
    </div>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <EmulatorProvider>
        <AppContent />
      </EmulatorProvider>
    </ErrorBoundary>
  )
}
