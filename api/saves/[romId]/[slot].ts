import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'
import { withAuth } from '../../_lib/auth'

export default withAuth(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  const { romId, slot } = req.query as { romId: string; slot: string }
  const slotNumber = parseInt(slot, 10)
  if (![1, 2, 3].includes(slotNumber)) {
    return res.status(400).json({ error: 'slot must be 1, 2, or 3' })
  }

  const sql = neon(process.env.DATABASE_URL!)

  if (req.method === 'GET') {
    const [row] = await sql`
      SELECT state_data, rom_id, rom_title, saved_at, raw_size_bytes
      FROM saves
      WHERE user_id = ${userId} AND rom_id = ${romId} AND slot_number = ${slotNumber}
    `
    if (!row) return res.status(404).json({ error: 'No save in this slot' })
    res.json({
      stateData:    row.state_data    as string,
      romId:        row.rom_id        as string,
      romTitle:     row.rom_title     as string,
      savedAt:      row.saved_at      as string,
      rawSizeBytes: row.raw_size_bytes as number,
    })

  } else if (req.method === 'PUT') {
    const { stateData, romTitle, rawSizeBytes } = req.body as {
      stateData: string
      romTitle: string
      rawSizeBytes: number
    }
    await sql`
      INSERT INTO saves (user_id, rom_id, slot_number, state_data, rom_title, raw_size_bytes, saved_at)
      VALUES (${userId}, ${romId}, ${slotNumber}, ${stateData}, ${romTitle}, ${rawSizeBytes}, NOW())
      ON CONFLICT (user_id, rom_id, slot_number) DO UPDATE SET
        state_data     = EXCLUDED.state_data,
        rom_title      = EXCLUDED.rom_title,
        raw_size_bytes = EXCLUDED.raw_size_bytes,
        saved_at       = NOW()
    `
    res.status(204).end()

  } else {
    res.status(405).end()
  }
})
