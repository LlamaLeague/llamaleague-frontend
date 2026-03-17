// pages/api/auth/logout.js
// Destruye la sesion y redirige a la landing.
// GET /api/auth/logout

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
  const session = await getIronSession(req, res, SESSION_OPTIONS)
  session.destroy()
  res.redirect('/')
}
