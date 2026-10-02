import { useEffect } from 'react'
import { PanelContent } from '@/components/SidePanel/PanelContent'
import type { ComponentProps } from 'react'

interface SaveDrawerProps extends ComponentProps<typeof PanelContent> {
  isOpen: boolean
  onClose: () => void
}

// Mobile menu drawer — bottom sheet holding the same account / cartridge /
// audio / save-state content as the desktop SidePanel.
export function SaveDrawer({ isOpen, onClose, ...panelProps }: SaveDrawerProps) {
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
          'fixed inset-0 z-40 bg-black/70 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={[
          'fixed bottom-0 left-0 right-0 z-50 bg-ink pixel-border text-paper rounded-t-sm p-4 max-h-[85vh] overflow-y-auto transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-muted/30 rounded-full mx-auto mb-4" />

        <PanelContent {...panelProps} active={isOpen} />
      </div>
    </>
  )
}
