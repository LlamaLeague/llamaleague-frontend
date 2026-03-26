import { getIronSession } from 'iron-session'

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' },
}

export default async function handler(req, res) {
  const session = await getIronSession(req, res, SESSION_OPTIONS)
  session.destroy()
  res.redirect('/')
}
