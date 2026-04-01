// pages/api/panel/stats.js
// GET — estadisticas generales del panel.

import { getIronSession } from 'iron-session'
import { supabaseAdmin }  from '@/lib/supabase'

const SESSION_OPTIONS = {
  password:    process.env.SESSION_SECRET,
  cookieName:  'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly:true, sameSite:'lax' },
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  const userId = session.user.id

  // Salas este mes
  const startOfMonth = new Date()
  startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)

  const { count: salas_mes } = await supabaseAdmin
    .from('lobbies')
    .select('*', { count:'exact', head:true })
    .gte('created_at', startOfMonth.toISOString())

  // Total salas
  const { count: salas_total } = await supabaseAdmin
    .from('lobbies')
    .select('*', { count:'exact', head:true })

  // Jugadores únicos (todos los registros de lobby_players)
  const { count: jugadores } = await supabaseAdmin
    .from('lobby_players')
    .select('user_id', { count:'exact', head:true })

  // Victorias por equipo (salas finalizadas)
  const { data: finalizadas } = await supabaseAdmin
    .from('lobbies')
    .select('winner_team')
    .eq('status', 'completed')
    .not('winner_team', 'is', null)

  const rad_wins  = finalizadas?.filter(l => l.winner_team === 'radiant').length ?? 0
  const dire_wins = finalizadas?.filter(l => l.winner_team === 'dire').length    ?? 0

  // Stats personales del usuario logueado
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('points, wins, losses, lc_balance, tier')
    .eq('id', userId)
    .single()

  return res.status(200).json({
    salas_mes:   salas_mes   ?? 0,
    salas_total: salas_total ?? 0,
    jugadores:   jugadores   ?? 0,
    rad_wins,
    dire_wins,
    user_stats: user ?? {},
  })
}
