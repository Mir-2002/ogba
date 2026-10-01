import type { ReactNode } from 'react'

// Desktop-only black panel that sits beside the console shell. Mobile uses
// the same PanelContent inside SaveDrawer's bottom sheet instead.
export function SidePanel({ children }: { children: ReactNode }) {
  return (
    <aside className="hidden lg:flex lg:w-64 xl:w-80 shrink-0 flex-col gap-3 p-5 overflow-y-auto bg-ink pixel-border text-paper rounded-sm">
      {children}
    </aside>
  )
}
