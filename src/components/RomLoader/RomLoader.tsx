import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'

interface RomLoaderProps {
  onFile: (file: File) => void
  isLoading: boolean
  error: string | null
}

export function RomLoader({ onFile, isLoading, error }: RomLoaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <label
        aria-disabled={isLoading ? 'true' : undefined}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'block w-full px-5 py-8 rounded-sm border-2 border-dashed cursor-pointer text-center transition-colors duration-200 select-none focus-within:border-shell-light aria-disabled:opacity-50 aria-disabled:cursor-not-allowed',
          isDragging
            ? 'border-shell-light bg-shell/20'
            : 'border-muted/30 hover:border-shell-light hover:bg-ink-soft',
        ].join(' ')}
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
          className={['mx-auto mb-3 opacity-70 transition-colors duration-200', isDragging ? 'text-shell-light' : 'text-muted'].join(' ')}
          width="28" height="28" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="14" rx="2"/>
          <path d="M7 17v2M17 17v2M3 10h18"/>
        </svg>
        {isLoading ? (
          <span className="text-muted text-sm font-body">Loading ROM…</span>
        ) : isDragging ? (
          <span className="block font-body font-semibold text-shell-light text-sm">Release to load</span>
        ) : (
          <>
            <span className="block font-body font-semibold text-paper text-sm">Drop .gba ROM here</span>
            <span className="block text-xs mt-1 text-muted font-body">or tap to browse</span>
          </>
        )}
      </label>
      {error && (
        <p role="alert" className="text-danger text-xs text-center m-0 font-body">{error}</p>
      )}
    </div>
  )
}
