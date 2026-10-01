import { useState } from 'react'
import { EmulatorProvider } from '@/emulator/EmulatorProvider'
import oGBALogo from '@/assets/oGBAlogo.png'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RomLoader } from '@/components/RomLoader/RomLoader'
import { GameScreen } from '@/components/GameScreen/GameScreen'
import { TouchControls } from '@/components/TouchControls/TouchControls'
import { SaveSlots } from '@/components/SaveSlots/SaveSlots'
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
  const [saveDrawerOpen, setSaveDrawerOpen] = useState(false)

  const effectiveVolume = isMuted ? 0 : volume

  return (
    <div className="flex flex-col h-full bg-bg overflow-hidden">

      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.07] app-header">
        <img
          src={oGBALogo}
          alt="ogba"
          draggable={false}
          className="shrink-0 select-none rounded-xl"
          style={{
            width: '86px',
            height: '44px',
            objectFit: 'cover',
            objectPosition: 'center 57%',
          }}
        />
        <div className="flex items-center gap-3">
          {authError && (
            <span className="text-xs text-red break-all max-w-[160px]">{authError}</span>
          )}
          {!authLoading && (
            user ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted hidden sm:block">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-dim hover:text-muted transition-colors cursor-pointer bg-transparent border border-white/10 rounded-full px-3 py-1 neu-button hover:bg-surface2"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="text-xs text-dim hover:text-muted transition-colors cursor-pointer bg-transparent border border-white/10 rounded-full px-3 py-1 neu-button hover:bg-surface2"
              >
                Sign in with Google
              </button>
            )
          )}
        </div>
      </header>

      {/* Body — two-column on desktop */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

        {/* Left: game screen — hidden on mobile when no ROM */}
        <div className={[
          'flex-1 min-h-0 min-w-0 overflow-hidden items-center justify-center p-4',
          !state.hasRom ? 'hidden lg:flex' : 'flex',
        ].join(' ')}>
          <GameScreen hasRom={state.hasRom} volume={effectiveVolume} />
        </div>

        {/* Right: sidebar — always visible */}
        <div className={[
          'lg:w-72 shrink-0 flex flex-col gap-3 p-4 overflow-y-auto',
          'lg:border-l lg:border-t-0 border-white/[0.07]',
          state.hasRom ? 'border-t' : '',
        ].filter(Boolean).join(' ')}>
          {/* ROM Loader — show when no ROM loaded */}
          {!state.hasRom && (
            <ErrorBoundary>
              <RomLoader onFile={loadFile} isLoading={state.isLoading} error={state.error} />
            </ErrorBoundary>
          )}

          {/* ROM title chip + eject button */}
          {state.hasRom && state.romTitle && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-muted bg-surface2 rounded-lg px-3 py-2 border border-white/[0.07] truncate">
                {state.romTitle}
              </span>
              <button
                onClick={ejectRom}
                className="text-[10px] font-mono text-dim hover:text-muted transition-colors text-left bg-transparent border-none cursor-pointer px-1"
              >
                Change ROM
              </button>
            </div>
          )}

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="text-dim hover:text-muted transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0"
            >
              {isMuted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              aria-label="Volume"
              className="flex-1 accent-accent h-1 cursor-pointer"
            />
          </div>

          {user ? (
            <SaveSlots
              hasRom={state.hasRom}
              save={save}
              load={load}
              listSlots={listSlots}
              busy={busy}
              error={error}
              listError={listError}
            />
          ) : (
            !authLoading && (
              <div className="rounded-xl bg-surface gba-card p-4 flex flex-col gap-2">
                <p className="text-[11px] font-mono text-dim uppercase tracking-wider m-0">Cloud Saves</p>
                <p className="text-sm text-muted m-0">Sign in to save your progress and resume from any device.</p>
              </div>
            )
          )}
        </div>

      </div>

      {/* Touch Controls */}
      <TouchControls />

      {/* Mobile FAB — only when ROM is loaded and user is logged in */}
      {state.hasRom && user && (
        <button
          onClick={() => setSaveDrawerOpen(true)}
          aria-label="Open save states"
          className="lg:hidden fixed bottom-4 right-4 z-30 bg-accent rounded-full p-4 shadow-[0_4px_20px_rgba(108,99,255,0.5)] border-none cursor-pointer text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>
      )}

      {/* Mobile Save Drawer */}
      {user && (
        <SaveDrawer
          isOpen={saveDrawerOpen}
          onClose={() => setSaveDrawerOpen(false)}
          hasRom={state.hasRom}
          save={save}
          load={load}
          listSlots={listSlots}
          busy={busy}
          error={error}
          listError={listError}
        />
      )}

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
