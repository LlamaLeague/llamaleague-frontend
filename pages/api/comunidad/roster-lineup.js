// pages/api/comunidad/roster-lineup.js
// GET  — obtiene el lineup de la comunidad
// POST — streamer agrega jugador al lineup
// DELETE — streamer quita jugador del lineup

import { getIronSession } from 'iron-session'
import { supabaseAdmin }  from '@/lib/supabase'

const SESSION_OPTIONS = {
  password:   process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' },
}

const ROLES = {
  1: { label: 'Carry',        icon: '⚔️'  },
  2: { label: 'Mid',          icon: '🎯'  },
  3: { label: 'Offlane',      icon: '🛡️' },
  4: { label: 'Support',      icon: '💫'  },
  5: { label: 'Hard Support', icon: '🌿'  },
}

export default async function handler(req, res) {
  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  // GET — obtener lineup
  if (req.method === 'GET') {
    const communityId = req.query.community_id
    if (!communityId) return res.status(400).json({ error: 'Falta community_id' })

    const { data, error } = await supabaseAdmin
      .from('community_roster')
      .select(`
        id, position, role, added_at,
        user:user_id (
          id, display_name, steam_avatar, avatar_url,
          mmr_estimate, points, wins, losses, tier, country
        )
      `)
      .eq('community_id', communityId)
      .order('position')

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ roster: data ?? [], roles: ROLES })
  }

  // POST — agregar al lineup (solo streamer dueño)
  if (req.method === 'POST') {
    if (session.user.type !== 'streamer')
      return res.status(403).json({ error: 'Solo el streamer puede editar el lineup' })

    const { community_id, user_id, position } = req.body
    if (!community_id || !user_id || !position)
      return res.status(400).json({ error: 'Faltan datos' })

    // Verificar que la comunidad es del streamer
    const { data: com } = await supabaseAdmin
      .from('communities').select('id').eq('id', community_id).eq('owner_id', session.user.id).single()
    if (!com) return res.status(403).json({ error: 'No es tu comunidad' })

    // Verificar que el jugador es miembro
    const { data: member } = await supabaseAdmin
      .from('community_members').select('id').eq('community_id', community_id).eq('user_id', user_id).eq('approved', true).single()
    if (!member) return res.status(400).json({ error: 'El jugador no es miembro aprobado de tu comunidad' })

    const roleLabel = ROLES[position]?.label?.toLowerCase().replace(' ', '_') || 'support'

    const { error } = await supabaseAdmin
      .from('community_roster')
      .upsert({ community_id, user_id, position, role: roleLabel }, { onConflict: 'community_id,position' })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  // DELETE — quitar del lineup
  if (req.method === 'DELETE') {
    if (session.user.type !== 'streamer')
      return res.status(403).json({ error: 'Solo el streamer puede editar el lineup' })

    const { roster_id, community_id } = req.body

    // Verificar dueño
    const { data: com } = await supabaseAdmin
      .from('communities').select('id').eq('id', community_id).eq('owner_id', session.user.id).single()
    if (!com) return res.status(403).json({ error: 'No es tu comunidad' })

    const { error } = await supabaseAdmin
      .from('community_roster').delete().eq('id', roster_id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
