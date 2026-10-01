import { useContext, useState, useCallback } from 'react'
import { GbaContext } from 'react-gbajs'
import { supabase } from '@/lib/supabase'
import { gzipBytes, gunzipBytes } from '@/lib/compress'
import type { AppUser } from '@/hooks/useAuth'

export type SlotNumber = 1 | 2 | 3

export interface SlotMeta {
  slotNumber: SlotNumber
  romTitle: string
  savedAt: Date
  rawSizeBytes: number
}

const BUCKET = 'save-states'

// Storage keys reject `%` and most punctuation, so encodeURIComponent won't do —
// collapse anything outside the safe set to `_` instead.
function storagePath(userId: string, romId: string, slot: SlotNumber) {
  return `${userId}/${romId.replace(/[^A-Za-z0-9._-]/g, '_')}/${slot}.state.gz`
}

export function useCloudSave(user: AppUser | null, romId: string | null, romTitle: string | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { play, saveState } = useContext(GbaContext) as any
  const [busy,      setBusy]      = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const save = useCallback(async (slot: SlotNumber) => {
    if (!user || !romId || !romTitle) return
    setBusy(true); setError(null)
    try {
      const state      = saveState()
      const json        = JSON.stringify(state)
      const rawBytes    = new TextEncoder().encode(json)
      const compressed  = await gzipBytes(rawBytes)
      const path        = storagePath(user.id, romId, slot)

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, new Blob([compressed], { type: 'application/gzip' }), {
          upsert: true,
          contentType: 'application/gzip',
        })
      if (uploadError) throw uploadError

      const { error: upsertError } = await supabase
        .from('saves')
        .upsert({
          user_id:      user.id,
          rom_id:       romId,
          slot_number:  slot,
          rom_title:    romTitle,
          size_bytes:   rawBytes.byteLength,
          storage_path: path,
          saved_at:     new Date().toISOString(),
        }, { onConflict: 'user_id,rom_id,slot_number' })
      if (upsertError) throw upsertError
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
      const { data: row, error: selectError } = await supabase
        .from('saves')
        .select('storage_path')
        .eq('user_id', user.id)
        .eq('rom_id', romId)
        .eq('slot_number', slot)
        .maybeSingle()
      if (selectError) throw selectError
      if (!row) { setError('No save in this slot'); return }

      const { data: blob, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(row.storage_path)
      if (downloadError) throw downloadError

      const compressed = new Uint8Array(await blob.arrayBuffer())
      const rawBytes    = await gunzipBytes(compressed)
      const json        = new TextDecoder().decode(rawBytes)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = JSON.parse(json) as any
      play({ newRomBuffer: undefined, restoreState: state })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setBusy(false)
    }
  }, [user, romId, play])

  const listSlots = useCallback(async (): Promise<(SlotMeta | null)[]> => {
    if (!user || !romId) return [null, null, null]
    setListError(null)
    try {
      const { data, error: selectError } = await supabase
        .from('saves')
        .select('slot_number, rom_title, saved_at, size_bytes')
        .eq('user_id', user.id)
        .eq('rom_id', romId)
      if (selectError) throw selectError

      const rows = data ?? []
      return ([1, 2, 3] as SlotNumber[]).map(n => {
        const row = rows.find(r => r.slot_number === n)
        if (!row) return null
        return {
          slotNumber:   n,
          romTitle:     row.rom_title as string,
          savedAt:      new Date(row.saved_at as string),
          rawSizeBytes: row.size_bytes as number,
        }
      })
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Failed to load save slots')
      return [null, null, null]
    }
  }, [user, romId])

  return { save, load, listSlots, busy, error, listError }
}
