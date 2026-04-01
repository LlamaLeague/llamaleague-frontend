// pages/api/auth/set-type.js
// POST — establece el tipo de usuario (player | streamer) en onboarding.

import { getIronSession } from 'iron-session'
import { supabaseAdmin }  from '@/lib/supabase'

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  const { type } = req.body
  if (!['player', 'streamer'].includes(type))
    return res.status(400).json({ error: 'Tipo invalido. Debe ser player o streamer.' })

  const { error } = await supabaseAdmin
    .from('users')
    .update({ type, updated_at: new Date().toISOString() })
    .eq('id', session.user.id)

  if (error) return res.status(500).json({ error: error.message })

  session.user.type = type
  await session.save()

  return res.status(200).json({ ok: true, type })
}
