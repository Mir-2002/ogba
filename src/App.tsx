import { GbaProvider } from 'react-gbajs'
import { GoogleLogin } from '@react-oauth/google'
import oGBALogo from '@/assets/oGBAlogo.png'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RomLoader } from '@/components/RomLoader/RomLoader'
import { GameScreen } from '@/components/GameScreen/GameScreen'
import { TouchControls } from '@/components/TouchControls/TouchControls'
import { SaveSlots } from '@/components/SaveSlots/SaveSlots'
import { useRomLoader } from '@/hooks/useRomLoader'
import { useAuth } from '@/hooks/useAuth'
import { useCloudSave } from '@/hooks/useCloudSave'

function AppContent() {
  const { state, loadFile, romId, romTitle } = useRomLoader()
  const { user, loading: authLoading, authError, handleGoogleCredential, signOut } = useAuth()
  const { save, load, listSlots, busy, error } = useCloudSave(user, romId, romTitle)

  return (
    <div className="flex flex-col h-full bg-bg overflow-hidden">

      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
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
                  className="text-xs text-dim hover:text-muted transition-colors cursor-pointer bg-transparent border-none"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={cred => handleGoogleCredential(cred.credential!)}
                onError={() => {}}
                theme="filled_black"
                shape="pill"
                size="small"
              />
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
          <GameScreen hasRom={state.hasRom} />
        </div>

        {/* Right: sidebar — always visible */}
        <div className={[
          'lg:w-72 shrink-0 flex flex-col gap-3 p-4 overflow-y-auto',
          'lg:border-l lg:border-t-0 border-white/[0.07]',
          state.hasRom ? 'border-t' : '',
        ].filter(Boolean).join(' ')}>
          {!state.hasRom && (
            <ErrorBoundary>
              <RomLoader onFile={loadFile} isLoading={state.isLoading} error={state.error} />
            </ErrorBoundary>
          )}
          {user ? (
            <SaveSlots
              hasRom={state.hasRom}
              save={save}
              load={load}
              listSlots={listSlots}
              busy={busy}
              error={error}
            />
          ) : (
            !authLoading && (
              <div className="rounded-xl bg-surface border border-white/[0.07] p-4 flex flex-col gap-2">
                <p className="text-[11px] font-mono text-dim uppercase tracking-wider m-0">Cloud Saves</p>
                <p className="text-sm text-muted m-0">Sign in to save your progress and resume from any device.</p>
              </div>
            )
          )}
        </div>

      </div>

      {/* Touch Controls */}
      <TouchControls />

    </div>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <GbaProvider>
        <AppContent />
      </GbaProvider>
    </ErrorBoundary>
  )
}
