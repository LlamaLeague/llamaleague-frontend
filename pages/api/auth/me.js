// pages/api/auth/me.js
// Devuelve el usuario de la sesion actual.
// GET /api/auth/me → { user } | { user: null }

import { getIronSession } from 'iron-session'

const SESSION_OPTIONS = {
  password:    process.env.SESSION_SECRET,
  cookieName:  'llamaleague_session',
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  return res.status(200).json({ user: session.user ?? null })
}
