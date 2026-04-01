// pages/api/salas/[id]/win-radiant.js
import { getIronSession } from 'iron-session'
import { supabaseAdmin }  from '@/lib/supabase'
import { applyMatchResult } from '../../../../lib/ranking'

const SESSION_OPTIONS = {
  password:   process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  const { id } = req.query
  const { data: sala } = await supabaseAdmin
    .from('lobbies')
    .select('status')
    .eq('id', id)
    .single()

  if (!sala)                  return res.status(404).json({ error: 'Sala no encontrada' })
  if (sala.status !== 'active') return res.status(400).json({ error: 'La sala no esta activa' })

  const { data: players } = await supabaseAdmin
    .from('lobby_players')
    .select('user_id, team')
    .eq('lobby_id', id)

  await applyMatchResult(id, 'radiant', players ?? [], supabaseAdmin)

  return res.status(200).json({ ok: true })
}
