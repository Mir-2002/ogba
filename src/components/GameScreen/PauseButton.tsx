import { usePause } from '@/hooks/usePause'

export function PauseButton() {
  const { isPaused, togglePause, hasPauseSupport } = usePause()

  if (!hasPauseSupport) return null

  return (
    <>
      {/* Pause/Play icon button — top-right of bezel */}
      <button
        onClick={togglePause}
        aria-label={isPaused ? 'Resume' : 'Pause'}
        className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-ink/70 text-muted hover:text-paper hover:bg-ink/90 transition-colors border-none cursor-pointer"
      >
        {isPaused ? (
          // Play icon
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        ) : (
          // Pause icon
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        )}
      </button>

      {/* Paused overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/75 pointer-events-none">
          <span className="font-pixel text-paper text-xs tracking-widest select-none">PAUSED</span>
        </div>
      )}
    </>
  )
}
