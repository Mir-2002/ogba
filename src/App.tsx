import { useState } from 'react'
import { EmulatorProvider } from '@/emulator/EmulatorProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ConsoleShell } from '@/components/ConsoleShell/ConsoleShell'
import { SidePanel } from '@/components/SidePanel/SidePanel'
import { PanelContent } from '@/components/SidePanel/PanelContent'
import { SaveDrawer } from '@/components/SaveDrawer/SaveDrawer'
import { useRomLoader } from '@/hooks/useRomLoader'
import { useAuth } from '@/hooks/useAuth'
import { useCloudSave } from '@/hooks/useCloudSave'
import { useVolume } from '@/hooks/useVolume'

function AppContent() {
  const { state, loadFile, ejectRom, romId, romTitle } = useRomLoader()
  const { user, loading: authLoading, authError, signIn, signOut } = useAuth()
  const { save, load, listSlots, busy, error, listError } = useCloudSave(user, romId, romTitle)
  const { volume, setVolume, isMuted, toggleMute } = useVolume()
  const [menuOpen, setMenuOpen] = useState(false)

  const effectiveVolume = isMuted ? 0 : volume

  const panelProps = {
    state,
    loadFile,
    ejectRom,
    user,
    authLoading,
    authError,
    signIn,
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

  return (
    <div className="flex h-full bg-ink overflow-hidden">

      {/* Console shell — fills the viewport on mobile, grows to fill the
          remaining width (stretched to full height) next to the side panel
          on desktop, so its own flex-1 rows get a real size to measure. */}
      <div className="flex-1 min-w-0 flex items-stretch justify-center lg:p-6 lg:gap-6">
        <ConsoleShell
          hasRom={state.hasRom}
          volume={effectiveVolume}
          onRequestLoad={() => setMenuOpen(true)}
          onMenuOpen={() => setMenuOpen(true)}
        />

        <SidePanel>
          <PanelContent {...panelProps} />
        </SidePanel>
      </div>

      {/* Mobile menu drawer — account, cartridge, audio, save states */}
      <SaveDrawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        {...panelProps}
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
