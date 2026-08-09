import jwt from 'jsonwebtoken'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export interface JwtPayload {
  sub: string
  email: string
  name: string
}

export function verifyJwt(authHeader: string | undefined): JwtPayload {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Missing auth token')
  const token = authHeader.slice(7)
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
}

type AuthedHandler = (req: VercelRequest, res: VercelResponse, userId: string) => Promise<void>

export function withAuth(handler: AuthedHandler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      const payload = verifyJwt(req.headers.authorization)
      await handler(req, res, payload.sub)
    } catch {
      res.status(401).json({ error: 'Unauthorized' })
    }
  }
}
