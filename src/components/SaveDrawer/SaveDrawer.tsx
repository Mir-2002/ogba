import { useEffect } from 'react'
import { SaveSlots } from '@/components/SaveSlots/SaveSlots'
import type { SlotNumber, SlotMeta } from '@/hooks/useCloudSave'

interface SaveDrawerProps {
  isOpen: boolean
  onClose: () => void
  hasRom: boolean
  save: (slot: SlotNumber) => Promise<void>
  load: (slot: SlotNumber) => Promise<void>
  listSlots: () => Promise<(SlotMeta | null)[]>
  busy: boolean
  error: string | null
  listError: string | null
}

export function SaveDrawer({ isOpen, onClose, hasRom, save, load, listSlots, busy, error, listError }: SaveDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          'fixed inset-0 z-40 bg-black/60 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Save states"
        className={[
          'fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl p-4 transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-4" />

        <SaveSlots
          hasRom={hasRom}
          save={save}
          load={load}
          listSlots={listSlots}
          busy={busy}
          error={error}
          listError={listError}
        />
      </div>
    </>
  )
}
