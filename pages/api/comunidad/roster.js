// pages/api/comunidad/roster.js
// GET — devuelve los miembros de la comunidad del streamer con sus stats

import { getIronSession } from 'iron-session'
import { supabaseAdmin }  from '@/lib/supabase'

const SESSION_OPTIONS = {
  password:   process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' },
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  // Obtener comunidad del streamer (o por query param para jugadores)
  const communityId = req.query.community_id

  let cid = communityId
  if (!cid) {
    const { data: com } = await supabaseAdmin
      .from('communities').select('id').eq('owner_id', session.user.id).single()
    if (!com) return res.status(404).json({ error: 'No tienes comunidad' })
    cid = com.id
  }

  const { data: members, error } = await supabaseAdmin
    .from('roster')
    .select(`
      id, approved, joined_at,
      user:user_id (
        id, display_name, country, avatar_url,
        steam_avatar, steam_name, mmr_estimate,
        points, wins, losses, tier
      )
    `)
    .eq('community_id', cid)
    .eq('approved', true)
    .order('joined_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ members: members ?? [] })
}
