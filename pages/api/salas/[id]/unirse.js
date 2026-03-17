// pages/api/salas/[id]/unirse.js
// POST — jugador confirma asistencia a la sala.

import { getIronSession } from 'iron-session'
import { createClient }   from '@supabase/supabase-js'

const SESSION_OPTIONS = {
  password:   process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly:true, sameSite:'lax' },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  const { id } = req.query

  // Obtener sala
  const { data: sala } = await supabase
    .from('lobbies')
    .select('*')
    .eq('id', id)
    .single()

  if (!sala)                               return res.status(404).json({ error: 'Sala no encontrada' })
  if (!['queued','waiting'].includes(sala.status)) return res.status(400).json({ error: 'La sala ya no acepta jugadores' })

  // Verificar cupos
  const { count } = await supabase
    .from('lobby_players')
    .select('*', { count:'exact', head:true })
    .eq('lobby_id', id)
    .eq('confirmed', true)

  if (count >= 10) return res.status(400).json({ error: 'La sala esta llena' })

  // Verificar que el jugador pertenece a la comunidad
  const { data: member } = await supabase
    .from('roster')
    .select('id, approved')
    .eq('community_id', sala.community_id)
    .eq('user_id', session.user.id)
    .single()

  if (!member)          return res.status(403).json({ error: 'No eres miembro de esta comunidad' })
  if (!member.approved) return res.status(403).json({ error: 'Tu membresia esta pendiente de aprobacion' })

  // Upsert en lobby_players
  const { error } = await supabase
    .from('lobby_players')
    .upsert({
      lobby_id:  id,
      user_id:   session.user.id,
      confirmed: true,
      joined_at: new Date().toISOString(),
    }, { onConflict: 'lobby_id,user_id' })

  if (error) return res.status(500).json({ error: error.message })

  // Actualizar player_count en lobbies
  await supabase
    .from('lobbies')
    .update({ player_count: (count ?? 0) + 1 })
    .eq('id', id)

  return res.status(200).json({ ok: true })
}
