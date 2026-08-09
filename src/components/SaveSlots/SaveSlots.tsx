import { useEffect, useState, useCallback } from 'react'
import type { SlotNumber, SlotMeta } from '@/hooks/useCloudSave'

interface Props {
  hasRom: boolean
  save: (slot: SlotNumber) => Promise<void>
  load: (slot: SlotNumber) => Promise<void>
  listSlots: () => Promise<(SlotMeta | null)[]>
  busy: boolean
  error: string | null
}

const SLOTS: SlotNumber[] = [1, 2, 3]

function formatDate(d: Date) {
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

export function SaveSlots({ hasRom, save, load, listSlots, busy, error }: Props) {
  const [slots, setSlots] = useState<(SlotMeta | null)[]>([null, null, null])

  const refresh = useCallback(async () => {
    const result = await listSlots()
    setSlots(result)
  }, [listSlots])

  useEffect(() => { refresh() }, [refresh])

  async function handleSave(slot: SlotNumber) {
    await save(slot)
    await refresh()
  }

  return (
    <div className="w-full shrink-0">
      <p className="text-[10px] font-mono uppercase tracking-wider text-dim mb-2 m-0">Save States</p>
      <div className="flex flex-col gap-1.5">
        {SLOTS.map((n) => {
          const meta = slots[n - 1]
          return (
            <div
              key={n}
              className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-white/[0.07]"
            >
              <span className="w-4 font-mono text-xs text-dim shrink-0">{n}</span>
              <span className="flex-1 font-mono text-xs text-muted">
                {meta ? formatDate(meta.savedAt) : <span className="opacity-50">Empty</span>}
              </span>
              <button
                disabled={!hasRom || busy}
                onClick={() => handleSave(n)}
                className="px-2 py-1 rounded text-[10px] font-mono bg-accent text-white cursor-pointer disabled:opacity-30 disabled:cursor-default border-none"
              >
                Save
              </button>
              <button
                disabled={busy || !meta}
                onClick={() => load(n)}
                className="px-2 py-1 rounded text-[10px] font-mono bg-surface2 text-muted cursor-pointer disabled:opacity-30 disabled:cursor-default border border-white/[0.07]"
              >
                Load
              </button>
            </div>
          )
        })}
      </div>
      {error && <p className="mt-2 text-[10px] text-red m-0">{error}</p>}
    </div>
  )
}
