// pages/api/salas/[id]/unirse.js
// POST — jugador se une a una sala. Requiere Steam vinculado y ser miembro de la comunidad.

import { getIronSession } from 'iron-session'
import { supabaseAdmin }  from '@/lib/supabase'

const SESSION_OPTIONS = {
  password:   process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  if (!session.user.steam_id)
    return res.status(403).json({ error: 'Debes vincular tu cuenta de Steam antes de unirte a una sala' })

  const { id } = req.query

  const { data: sala } = await supabaseAdmin
    .from('lobbies')
    .select('*')
    .eq('id', id)
    .single()

  if (!sala)                                         return res.status(404).json({ error: 'Sala no encontrada' })
  if (!['waiting', 'queued'].includes(sala.status))  return res.status(400).json({ error: 'La sala ya no acepta jugadores' })

  // Verificar cupos
  const { count } = await supabaseAdmin
    .from('lobby_players')
    .select('*', { count: 'exact', head: true })
    .eq('lobby_id', id)
    .eq('confirmed', true)

  if (count >= 10) return res.status(400).json({ error: 'La sala está llena' })

  // Verificar que es miembro aprobado de la comunidad
  if (sala.community_id) {
    const { data: member } = await supabaseAdmin
      .from('roster')
      .select('id, approved')
      .eq('community_id', sala.community_id)
      .eq('user_id', session.user.id)
      .single()

    if (!member)          return res.status(403).json({ error: 'No eres miembro de esta comunidad' })
    if (!member.approved) return res.status(403).json({ error: 'Tu membresía está pendiente de aprobación' })
  }

  // Verificar si ya está en la sala
  const { data: existing } = await supabaseAdmin
    .from('lobby_players')
    .select('id')
    .eq('lobby_id', id)
    .eq('user_id', session.user.id)
    .single()

  if (existing) return res.status(400).json({ error: 'Ya estás en esta sala' })

  const { error } = await supabaseAdmin
    .from('lobby_players')
    .insert({
      lobby_id:  id,
      user_id:   session.user.id,
      confirmed: true,
      paid:      false,
      joined_at: new Date().toISOString(),
    })

  if (error) return res.status(500).json({ error: error.message })

  await supabaseAdmin
    .from('lobbies')
    .update({ player_count: (count ?? 0) + 1 })
    .eq('id', id)

  return res.status(200).json({ ok: true })
}
