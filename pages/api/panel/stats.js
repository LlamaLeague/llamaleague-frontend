// pages/api/panel/stats.js
// Devuelve estadisticas del streamer para los KPIs del panel.
// GET /api/panel/stats

import { getIronSession } from 'iron-session'
import { createClient }   from '@supabase/supabase-js'

const SESSION_OPTIONS = {
  password:    process.env.SESSION_SECRET,
  cookieName:  'llamaleague_session',
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

  const userId = session.user.id

  // Salas este mes
  const startOfMonth = new Date()
  startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)

  const { count: salas_mes } = await supabase
    .from('lobbies')
    .select('*', { count:'exact', head:true })
    .eq('created_by', userId)
    .gte('created_at', startOfMonth.toISOString())

  // Jugadores unicos en salas del streamer
  const { data: lobbyIds } = await supabase
    .from('lobbies')
    .select('id')
    .eq('created_by', userId)

  let jugadores = 0
  if (lobbyIds?.length) {
    const ids = lobbyIds.map(l => l.id)
    const { count } = await supabase
      .from('lobby_players')
      .select('user_id', { count:'exact', head:true })
      .in('lobby_id', ids)
    jugadores = count ?? 0
  }

  // Victorias por equipo (salas finalizadas)
  const { data: finalizadas } = await supabase
    .from('lobbies')
    .select('winner')
    .eq('created_by', userId)
    .eq('status', 'completed')
    .not('winner', 'is', null)

  const rad_wins  = finalizadas?.filter(l => l.winner === 'radiant').length ?? 0
  const dire_wins = finalizadas?.filter(l => l.winner === 'dire').length    ?? 0

  return res.status(200).json({ salas_mes, jugadores, rad_wins, dire_wins })
}
