import { useContext, useState, useCallback } from 'react'
import { GbaContext } from 'react-gbajs'
import { apiFetch } from '@/lib/api'
import { compressToBase64, decompressFromBase64 } from '@/lib/compress'
import type { AppUser } from '@/hooks/useAuth'

export type SlotNumber = 1 | 2 | 3

export interface SlotMeta {
  slotNumber: SlotNumber
  romTitle: string
  savedAt: Date
  rawSizeBytes: number
}

export function useCloudSave(user: AppUser | null, romId: string | null, romTitle: string | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { play, saveState } = useContext(GbaContext) as any
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async (slot: SlotNumber) => {
    if (!user || !romId || !romTitle) return
    setBusy(true); setError(null)
    try {
      const state     = saveState()
      const json      = JSON.stringify(state)
      const stateData = await compressToBase64(state)
      await apiFetch(`/api/saves/${encodeURIComponent(romId)}/${slot}`, {
        method: 'PUT',
        body: JSON.stringify({ stateData, romTitle, rawSizeBytes: json.length }),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }, [user, romId, romTitle, saveState])

  const load = useCallback(async (slot: SlotNumber) => {
    if (!user || !romId) return
    setBusy(true); setError(null)
    try {
      const data = await apiFetch(`/api/saves/${encodeURIComponent(romId)}/${slot}`) as { stateData: string; romId: string } | null
      if (!data) { setError('No save in this slot'); return }
      if (data.romId !== romId) {
        setError('Save is for a different game. Load the matching ROM first.')
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = await decompressFromBase64(data.stateData) as any
      play({ newRomBuffer: undefined, restoreState: state })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setBusy(false)
    }
  }, [user, romId, play])

  const listSlots = useCallback(async (): Promise<(SlotMeta | null)[]> => {
    if (!user || !romId) return [null, null, null]
    try {
      const data = await apiFetch(`/api/saves/${encodeURIComponent(romId)}`) as Array<{ slotNumber: SlotNumber; romTitle: string; savedAt: string; rawSizeBytes: number } | null>
      return data.map(s => s ? { ...s, savedAt: new Date(s.savedAt) } : null)
    } catch {
      return [null, null, null]
    }
  }, [user, romId])

  return { save, load, listSlots, busy, error }
}
