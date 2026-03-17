// pages/api/salas/[id]/index.js
// GET — devuelve la sala con sus jugadores.

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
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  const { id } = req.query

  const { data: sala, error } = await supabase
    .from('lobbies')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !sala) return res.status(404).json({ error: 'Sala no encontrada' })

  // Jugadores con info de usuario
  const { data: lobbyPlayers } = await supabase
    .from('lobby_players')
    .select(`
      user_id, confirmed, team, joined_at,
      user:user_id ( username, avatar_url, steam_id )
    `)
    .eq('lobby_id', id)
    .order('joined_at', { ascending: true })

  // Agregar MMR de la tabla ranking si existe
  const players = (lobbyPlayers ?? []).map(p => ({
    user_id:    p.user_id,
    username:   p.user?.username,
    avatar_url: p.user?.avatar_url,
    steam_id:   p.user?.steam_id,
    confirmed:  p.confirmed,
    team:       p.team,
    joined_at:  p.joined_at,
  }))

  return res.status(200).json({ sala, players })
}
