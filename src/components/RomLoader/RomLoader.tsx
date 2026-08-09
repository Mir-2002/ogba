import { useRef, type ChangeEvent } from 'react'

interface RomLoaderProps {
  onFile: (file: File) => void
  isLoading: boolean
  error: string | null
}

export function RomLoader({ onFile, isLoading, error }: RomLoaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <label
        aria-disabled={isLoading ? 'true' : undefined}
        className="block w-full px-5 py-8 rounded-xl border-2 border-dashed border-white/10 cursor-pointer text-center transition-colors duration-200 hover:border-accent/40 hover:bg-surface aria-disabled:opacity-50 aria-disabled:cursor-not-allowed select-none focus-within:border-accent/60"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".gba"
          className="absolute w-px h-px opacity-0 pointer-events-none"
          onChange={handleChange}
          disabled={isLoading}
        />
        <svg
          className="mx-auto mb-3 text-dim opacity-70"
          width="28" height="28" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="14" rx="2"/>
          <path d="M7 17v2M17 17v2M3 10h18"/>
        </svg>
        {isLoading ? (
          <span className="text-muted text-sm font-body">Loading ROM…</span>
        ) : (
          <>
            <span className="block font-body font-semibold text-text text-sm">Drop .gba ROM here</span>
            <span className="block text-xs mt-1 text-muted font-body">or tap to browse</span>
          </>
        )}
      </label>
      {error && (
        <p role="alert" className="text-red text-xs text-center m-0 font-body">{error}</p>
      )}
    </div>
  )
}
