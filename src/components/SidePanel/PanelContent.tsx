import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RomLoader } from '@/components/RomLoader/RomLoader'
import { SaveSlots } from '@/components/SaveSlots/SaveSlots'
import type { AppUser } from '@/hooks/useAuth'
import type { SlotNumber, SlotMeta } from '@/hooks/useCloudSave'

interface RomState {
  hasRom: boolean
  isLoading: boolean
  error: string | null
  romTitle: string | null
}

interface PanelContentProps {
  state: RomState
  loadFile: (file: File) => void
  ejectRom: () => void

  user: AppUser | null
  authLoading: boolean
  authError: string | null
  signIn: () => void
  signOut: () => void

  volume: number
  setVolume: (v: number) => void
  isMuted: boolean
  toggleMute: () => void

  save: (slot: SlotNumber) => Promise<boolean>
  load: (slot: SlotNumber) => Promise<void>
  listSlots: () => Promise<(SlotMeta | null)[]>
  busy: boolean
  saveError: string | null
  listError: string | null

  // False while the panel is hidden (closed mobile drawer).
  active?: boolean

  // Mobile only — desktop has no skin.
  skin?: {
    name:       string | null
    isCustom:   boolean
    error:      string | null
    importSkin: (file: File) => void
    resetSkin:  () => void
  }
}

function SectionHeading({ children }: { children: string }) {
  return (
    <p className="text-paper font-pixel text-[10px] tracking-wider m-0 pb-2 mb-3 border-b-2 border-shell">
      {children}
    </p>
  )
}

export function PanelContent({
  state, loadFile, ejectRom,
  user, authLoading, authError, signIn, signOut,
  volume, setVolume, isMuted, toggleMute,
  save, load, listSlots, busy, saveError, listError,
  active,
  skin,
}: PanelContentProps) {
  return (
    <div className="flex flex-col gap-5">

      {/* Account */}
      <section>
        <SectionHeading>Account</SectionHeading>
        {authError && (
          <p className="text-danger text-xs mb-2 m-0 font-body break-words">{authError}</p>
        )}
        {!authLoading && (
          user ? (
            <div className="flex items-center justify-between gap-2">
              <span className="font-body text-xs text-muted truncate">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="shrink-0 text-[10px] font-pixel text-paper bg-ink rounded-sm px-3 py-1.5 cursor-pointer btn-raised active:btn-pressed border-none"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="text-[10px] font-pixel text-paper bg-shell rounded-sm px-3 py-2 cursor-pointer btn-raised active:btn-pressed border-none w-full"
            >
              Sign in with Google
            </button>
          )
        )}
      </section>

      {/* Cartridge */}
      <section>
        <SectionHeading>Cartridge</SectionHeading>
        {!state.hasRom ? (
          <ErrorBoundary>
            <RomLoader onFile={loadFile} isLoading={state.isLoading} error={state.error} />
          </ErrorBoundary>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="font-body text-xs text-paper bg-ink-soft rounded-sm px-3 py-2 pixel-border text-muted truncate">
              {state.romTitle ?? 'Untitled ROM'}
            </span>
            <button
              onClick={ejectRom}
              className="text-[10px] font-pixel text-muted hover:text-paper transition-colors text-left bg-transparent border-none cursor-pointer px-1"
            >
              Change ROM
            </button>
          </div>
        )}
      </section>

      {/* Audio */}
      <section>
        <SectionHeading>Audio</SectionHeading>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="text-muted hover:text-paper transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0"
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
            className="flex-1 accent-shell-light h-1 cursor-pointer"
          />
        </div>
      </section>

      {/* Save states */}
      <section>
        {user ? (
          <SaveSlots
            active={active}
            hasRom={state.hasRom}
            save={save}
            load={load}
            listSlots={listSlots}
            busy={busy}
            error={saveError}
            listError={listError}
          />
        ) : (
          !authLoading && (
            <div className="rounded-sm bg-ink-soft pixel-border p-4 flex flex-col gap-2 text-muted">
              <p className="text-[10px] font-pixel uppercase tracking-wider text-paper m-0">Cloud Saves</p>
              <p className="text-sm text-muted m-0 font-body">Sign in to save your progress and resume from any device.</p>
            </div>
          )
        )}
      </section>

      {/* Skin */}
      {skin && (
        <section>
          <SectionHeading>Skin</SectionHeading>
          {skin.error && (
            <p className="text-danger text-xs mb-2 m-0 font-body break-words">{skin.error}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="font-body text-xs text-muted truncate">
              {skin.name ?? 'No skin'}{skin.isCustom ? ' (imported)' : ''}
            </span>
            <div className="shrink-0 flex gap-2">
              {skin.isCustom && (
                <button
                  onClick={() => skin.resetSkin()}
                  className="text-[10px] font-pixel text-muted hover:text-paper bg-transparent border-none cursor-pointer px-1"
                >
                  Reset
                </button>
              )}
              <label className="text-[10px] font-pixel text-paper bg-shell rounded-sm px-3 py-1.5 cursor-pointer btn-raised active:btn-pressed">
                Import
                <input
                  type="file"
                  accept=".deltaskin"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) skin.importSkin(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
