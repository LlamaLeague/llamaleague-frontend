// lib/session.js
import { getIronSession } from 'iron-session'

const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

export async function getSession(req, res) {
  return getIronSession(req, res, sessionOptions)
}

// Middleware — requiere login
export async function requireAuth(req, res) {
  const session = await getSession(req, res)
  if (!session?.userId) {
    res.status(401).json({ error: 'No autenticado' })
    return null
  }
  return session
}

// Middleware — requiere ser streamer
export async function requireStreamer(req, res) {
  const session = await requireAuth(req, res)
  if (!session) return null
  if (session.userType !== 'streamer') {
    res.status(403).json({ error: 'Solo streamers' })
    return null
  }
  return session
}
