import { useRef } from 'react'
import { useEmulator } from '@/emulator/useEmulator'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { GameScreen } from '@/components/GameScreen/GameScreen'
import { DPad } from '@/components/TouchControls/DPad'
import { ActionButtons } from '@/components/TouchControls/ActionButtons'
import { StartSelect } from '@/components/TouchControls/StartSelect'
import { ShoulderButtons } from '@/components/TouchControls/ShoulderButtons'

interface ConsoleShellProps {
  hasRom: boolean
  volume: number
  onRequestLoad: () => void
  onMenuOpen: () => void
}

function PowerLed({ isRunning }: { isRunning: boolean }) {
  return (
    <div className="shrink-0 flex flex-col items-center justify-center gap-1" aria-hidden="true">
      <div
        className={[
          'w-2.5 h-2.5 rounded-full transition-colors duration-300',
          isRunning ? 'bg-led shadow-[0_0_8px_2px_var(--color-led)]' : 'bg-shell-dark',
        ].join(' ')}
      />
      <span className="font-pixel text-paper/70 text-[6px] tracking-wider select-none hidden sm:inline">
        PWR
      </span>
    </div>
  )
}

function SpeakerGrille() {
  return (
    <div
      className="shrink-0 self-center grid gap-[2px]"
      style={{ gridTemplateColumns: 'repeat(2, 3px)', gridTemplateRows: 'repeat(8, 3px)' }}
      aria-hidden="true"
    >
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="bg-shell-dark rounded-full w-[3px] h-[3px]" />
      ))}
    </div>
  )
}

function Wordmark() {
  return (
    <div className="shrink-0 flex items-center justify-center gap-2" aria-hidden="true">
      <span className="w-1.5 h-1.5 rounded-full bg-shell-light" />
      <span className="font-pixel text-paper text-[10px] tracking-widest select-none">oGBA</span>
    </div>
  )
}

// The whole app re-skinned as the GBA handheld itself: a purple moulded
// body, a black glass bezel around the game screen, a power LED that lights
// up while a ROM is running, a speaker grille, and the control cluster
// (D-pad / A-B / Select-Start / L-R) built into the shell.
//
// Desktop (lg+) lays the controls out landscape, flanking the screen like a
// real GBA; mobile stacks screen-over-controls, anchored to fit one
// no-scroll viewport. The breakpoint picks ONE of the two JSX branches below
// (via useMediaQuery) rather than mounting both and hiding one with CSS, so
// D-pad/A-B/Select-Start never exist twice in the DOM at once.
export function ConsoleShell({ hasRom, volume, onRequestLoad, onMenuOpen }: ConsoleShellProps) {
  const { isRunning } = useEmulator()
  const isDesktop = useMediaQuery(`(min-width: 1024px)`)
  const screenSlotRef = useRef<HTMLDivElement>(null)

  const topZone = (
    <div className="shrink-0 flex flex-col gap-2">
      <div className="lg:hidden flex justify-end">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open menu"
          className="font-pixel text-[8px] text-paper bg-ink rounded-full px-3 py-1.5 border-none cursor-pointer btn-raised active:btn-pressed focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
        >
          MENU
        </button>
      </div>
      <ShoulderButtons />
    </div>
  )

  // The slot's OWN box must come from its parent row stretching it (so
  // ResizeObserver gets a real, content-independent size) — the screen's
  // position *within* that box (centred on desktop, top-anchored on mobile
  // so there's no gap above it) is a separate, inner alignment.
  const screenBay = (
    <div
      ref={screenSlotRef}
      className={[
        'flex-1 min-w-0 min-h-0 flex justify-center',
        isDesktop ? 'items-center' : 'items-start',
      ].join(' ')}
    >
      <GameScreen hasRom={hasRom} volume={volume} onRequestLoad={onRequestLoad} containerRef={screenSlotRef} />
    </div>
  )

  return (
    <div
      className="relative flex flex-col h-full w-full lg:flex-1 lg:min-w-0 lg:max-w-[1600px] bg-shell shell-bevel rounded-none lg:rounded-[28px] gap-2 lg:gap-3 overflow-hidden"
      style={{
        paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
        paddingLeft: 'calc(0.75rem + env(safe-area-inset-left))',
        paddingRight: 'calc(0.75rem + env(safe-area-inset-right))',
      }}
    >
      {topZone}

      {isDesktop ? (
        <>
          {/* Landscape GBA: D-pad left of the screen, A/B right of it */}
          <div className="flex-1 min-h-0 flex items-center justify-center gap-3 px-3 xl:gap-6 xl:px-6">
            <div className="shrink-0 flex items-center">
              <DPad />
            </div>
            <div className="flex-1 min-w-0 h-full flex items-stretch justify-center gap-1.5">
              <PowerLed isRunning={isRunning} />
              {screenBay}
              <SpeakerGrille />
            </div>
            <div className="shrink-0 flex items-center">
              <ActionButtons />
            </div>
          </div>

          <div className="shrink-0 py-0.5">
            <Wordmark />
          </div>

          {/* Rotation doesn't affect layout size, so pad for the tilted pills */}
          <div className="shrink-0 py-3 flex items-center justify-center">
            <StartSelect />
          </div>
        </>
      ) : (
        <>
          {/* Screen anchored near the top, right below the shoulder row.
              items-stretch (not items-start) so the slot gets a real,
              definite height to measure — the top-anchoring itself happens
              one level down, inside screenBay. */}
          <div className="flex-1 min-h-0 flex items-stretch justify-center gap-1.5 pt-1">
            <PowerLed isRunning={isRunning} />
            {screenBay}
            <SpeakerGrille />
          </div>

          {/* Wordmark + controls form one bottom-anchored cluster, pinned
              within thumb reach by the flex-1 screen row above absorbing
              any leftover vertical space. */}
          <div className="shrink-0 flex flex-col gap-2 pb-1">
            <Wordmark />
            <div className="flex items-center justify-between px-2">
              <DPad />
              <ActionButtons />
            </div>
            <div className="flex items-center justify-center">
              <StartSelect />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
