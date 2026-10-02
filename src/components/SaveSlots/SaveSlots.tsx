import { useEffect, useState, useCallback, useRef } from 'react'
import type { SlotNumber, SlotMeta } from '@/hooks/useCloudSave'

interface Props {
  // False while the panel is hidden (closed mobile drawer); the list is
  // refetched each time it becomes true.
  active?: boolean
  hasRom: boolean
  save: (slot: SlotNumber) => Promise<boolean>
  load: (slot: SlotNumber) => Promise<void>
  listSlots: () => Promise<(SlotMeta | null)[]>
  busy: boolean
  error: string | null
  listError: string | null
}

const SLOTS: SlotNumber[] = [1, 2, 3]

function formatDate(d: Date) {
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

export function SaveSlots({ active = true, hasRom, save, load, listSlots, busy, error, listError }: Props) {
  const [slots, setSlots] = useState<(SlotMeta | null)[]>([null, null, null])
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [pendingLoad, setPendingLoad] = useState<SlotNumber | null>(null)
  const [lastSaved, setLastSaved] = useState<SlotNumber | null>(null)

  // Sign-in and ROM restore each change listSlots, so several lists can be in
  // flight at once; only the newest one may land, or a stale "all empty"
  // result from before the user/ROM arrived can overwrite the real slots.
  const requestRef = useRef(0)
  const refresh = useCallback(async () => {
    const request = ++requestRef.current
    setSlotsLoading(true)
    const result = await listSlots()
    if (request !== requestRef.current) return
    setSlots(result)
    setSlotsLoading(false)
  }, [listSlots])

  // Saves can be made on another device at any time, so refetch whenever the
  // slots come into view: the panel opening, or the app returning to the
  // foreground (a backgrounded mobile PWA otherwise shows its old list).
  useEffect(() => {
    if (!active) return
    refresh()
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [active, refresh])

  async function handleSave(slot: SlotNumber) {
    const ok = await save(slot)
    await refresh()
    if (!ok) return
    setLastSaved(slot)
    setTimeout(() => setLastSaved(null), 2000)
  }

  async function handleConfirmLoad(slot: SlotNumber) {
    setPendingLoad(null)
    await load(slot)
  }

  return (
    <div className="w-full shrink-0">
      <p className="text-[10px] font-pixel uppercase tracking-wider text-paper mb-2 m-0">Save States</p>

      {listError && (
        <p className="text-danger text-xs mb-2 m-0 font-body">{listError}</p>
      )}

      {/* Slots belong to a game, so without one there is nothing to look up —
          say so rather than showing three "Empty" slots that read as lost saves. */}
      {!hasRom ? (
        <p className="text-sm text-muted m-0 font-body">Load a ROM to see its save states.</p>
      ) : (
      <div className="flex flex-col gap-1.5">
        {slotsLoading
          ? SLOTS.map((n) => (
              <div key={n} className="animate-pulse bg-ink-soft rounded-sm h-12" />
            ))
          : SLOTS.map((n) => {
              const meta = slots[n - 1]
              const isPending = pendingLoad === n
              const isSaved = lastSaved === n

              return (
                <div
                  key={n}
                  className="flex items-center gap-2 bg-ink-soft rounded-sm px-3 py-2 text-muted pixel-border"
                >
                  <span className="w-4 font-pixel text-[9px] text-muted shrink-0">{n}</span>
                  <span className="flex-1 font-body text-xs text-muted">
                    {isSaved ? (
                      <span className="flex items-center gap-1 text-led">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Saved
                      </span>
                    ) : meta ? (
                      formatDate(meta.savedAt)
                    ) : (
                      <span className="opacity-50">Empty</span>
                    )}
                  </span>

                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleConfirmLoad(n)}
                        className="px-2 py-1 rounded-sm text-[9px] font-pixel bg-led text-ink cursor-pointer border-none btn-raised active:btn-pressed"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setPendingLoad(null)}
                        className="px-2 py-1 rounded-sm text-[9px] font-pixel bg-ink text-muted cursor-pointer btn-raised active:btn-pressed"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled={!hasRom || busy}
                        onClick={() => handleSave(n)}
                        className="px-2 py-1 rounded-sm text-[9px] font-pixel bg-shell-light text-paper cursor-pointer disabled:opacity-30 disabled:cursor-default border-none btn-raised active:btn-pressed"
                      >
                        Save
                      </button>
                      <button
                        disabled={busy || !meta}
                        onClick={() => setPendingLoad(n)}
                        className="px-2 py-1 rounded-sm text-[9px] font-pixel bg-ink text-muted cursor-pointer disabled:opacity-30 disabled:cursor-default btn-raised active:btn-pressed"
                      >
                        Load
                      </button>
                    </>
                  )}
                </div>
              )
            })}
      </div>
      )}
      {error && <p className="mt-2 text-[10px] text-danger m-0 font-body">{error}</p>}
    </div>
  )
}
