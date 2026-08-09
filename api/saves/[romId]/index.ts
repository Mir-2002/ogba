import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'
import { withAuth } from '../../_lib/auth'

export default withAuth(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  if (req.method !== 'GET') return res.status(405).end()

  const { romId } = req.query as { romId: string }
  const sql = neon(process.env.DATABASE_URL!)

  const rows = await sql`
    SELECT slot_number, rom_title, saved_at, raw_size_bytes
    FROM saves
    WHERE user_id = ${userId} AND rom_id = ${romId}
  `

  const slots = [1, 2, 3].map(n => {
    const row = rows.find(r => r.slot_number === n)
    if (!row) return null
    return {
      slotNumber:   row.slot_number  as number,
      romTitle:     row.rom_title    as string,
      savedAt:      row.saved_at     as string,
      rawSizeBytes: row.raw_size_bytes as number,
    }
  })

  res.json(slots)
})
