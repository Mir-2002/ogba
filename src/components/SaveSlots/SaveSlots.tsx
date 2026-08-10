import { useEffect, useState, useCallback } from 'react'
import type { SlotNumber, SlotMeta } from '@/hooks/useCloudSave'

interface Props {
  hasRom: boolean
  save: (slot: SlotNumber) => Promise<void>
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

export function SaveSlots({ hasRom, save, load, listSlots, busy, error, listError }: Props) {
  const [slots, setSlots] = useState<(SlotMeta | null)[]>([null, null, null])
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [pendingLoad, setPendingLoad] = useState<SlotNumber | null>(null)
  const [lastSaved, setLastSaved] = useState<SlotNumber | null>(null)

  const refresh = useCallback(async () => {
    setSlotsLoading(true)
    const result = await listSlots()
    setSlots(result)
    setSlotsLoading(false)
  }, [listSlots])

  useEffect(() => { refresh() }, [refresh])

  async function handleSave(slot: SlotNumber) {
    await save(slot)
    await refresh()
    setLastSaved(slot)
    setTimeout(() => setLastSaved(null), 2000)
  }

  async function handleConfirmLoad(slot: SlotNumber) {
    setPendingLoad(null)
    await load(slot)
  }

  return (
    <div className="w-full shrink-0">
      <p className="text-[10px] font-mono uppercase tracking-wider text-dim mb-2 m-0">Save States</p>

      {listError && (
        <p className="text-red text-xs mb-2 m-0">{listError}</p>
      )}

      <div className="flex flex-col gap-1.5">
        {slotsLoading
          ? SLOTS.map((n) => (
              <div key={n} className="animate-pulse bg-surface2 rounded h-12" />
            ))
          : SLOTS.map((n) => {
              const meta = slots[n - 1]
              const isPending = pendingLoad === n
              const isSaved = lastSaved === n

              return (
                <div
                  key={n}
                  className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-white/[0.07] save-slot-card"
                >
                  <span className="w-4 font-mono text-xs text-dim shrink-0">{n}</span>
                  <span className="flex-1 font-mono text-xs text-muted">
                    {isSaved ? (
                      <span className="flex items-center gap-1 text-green">
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
                        className="px-2 py-1 rounded text-[10px] font-mono bg-green text-bg cursor-pointer border-none"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setPendingLoad(null)}
                        className="px-2 py-1 rounded text-[10px] font-mono bg-surface2 text-muted cursor-pointer border border-white/[0.07]"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled={!hasRom || busy}
                        onClick={() => handleSave(n)}
                        className="px-2 py-1 rounded text-[10px] font-mono bg-accent text-white cursor-pointer disabled:opacity-30 disabled:cursor-default border-none shadow-[0_4px_12px_rgba(108,99,255,0.35)] active:neu-button-pressed"
                      >
                        Save
                      </button>
                      <button
                        disabled={busy || !meta}
                        onClick={() => setPendingLoad(n)}
                        className="px-2 py-1 rounded text-[10px] font-mono bg-surface2 text-muted cursor-pointer disabled:opacity-30 disabled:cursor-default border border-white/[0.07] shadow-[inset_1px_1px_4px_rgba(0,0,0,0.5)]"
                      >
                        Load
                      </button>
                    </>
                  )}
                </div>
              )
            })}
      </div>
      {error && <p className="mt-2 text-[10px] text-red m-0">{error}</p>}
    </div>
  )
}
