import { getIronSession } from 'iron-session'
import { supabaseAdmin } from '@/lib/supabase'

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax', maxAge: 60*60*24*30 },
}

export default async function handler(req, res) {
  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(200).json({ user: null })

  // Refrescar datos del usuario desde DB
  const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', session.user.id).single()
  if (!user) return res.status(200).json({ user: null })

  return res.status(200).json({ user })
}
