import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'
import { withAuth } from '../_lib/auth'

export default withAuth(async (_req: VercelRequest, res: VercelResponse, userId: string) => {
  const sql = neon(process.env.DATABASE_URL!)
  const [user] = await sql`
    SELECT id, email, display_name FROM users WHERE id = ${userId}
  `
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ id: user.id, email: user.email, displayName: user.display_name })
})
