"use server"
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { OAuth2Client } from 'google-auth-library'
import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { credential } = req.body as { credential?: string }
  if (!credential) return res.status(400).json({ error: 'credential required' })

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.sub) throw new Error('Invalid token payload')

    const sql = neon(process.env.DATABASE_URL!)
    const [user] = await sql`
      INSERT INTO users (google_sub, email, display_name)
      VALUES (${payload.sub}, ${payload.email ?? ''}, ${payload.name ?? ''})
      ON CONFLICT (google_sub) DO UPDATE SET
        email        = EXCLUDED.email,
        display_name = EXCLUDED.display_name
      RETURNING id, email, display_name
    `

    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.display_name },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' },
    )

    res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } })
  } catch (e) {
    console.error('[auth/google]', e)
    res.status(401).json({ error: 'Invalid credential' })
  }
}
