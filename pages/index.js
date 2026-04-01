// pages/api/salas/[id]/index.js
// GET — devuelve la sala con sus jugadores.

import { getIronSession } from 'iron-session'
import { supabaseAdmin }  from '@/lib/supabase'

const SESSION_OPTIONS = {
  password:   process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly:true, sameSite:'lax' },
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  const { id } = req.query

  const { data: sala, error } = await supabaseAdmin
    .from('lobbies')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !sala) return res.status(404).json({ error: 'Sala no encontrada' })

  // Jugadores con info de usuario
  const { data: lobbyPlayers } = await supabaseAdmin
    .from('lobby_players')
    .select(`
      user_id, team, joined_at,
      user:user_id ( display_name, avatar_url, steam_id, mmr_estimate )
    `)
    .eq('lobby_id', id)
    .order('joined_at', { ascending: true })

  const players = (lobbyPlayers ?? []).map(p => ({
    user_id:      p.user_id,
    display_name: p.user?.display_name,
    avatar_url:   p.user?.avatar_url,
    steam_id:     p.user?.steam_id,
    mmr:          p.user?.mmr_estimate,
    team:         p.team,
    joined_at:    p.joined_at,
  }))

  return res.status(200).json({ sala, players })
}
