// pages/api/comunidad/unirse.js
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
  if (!session.user) return res.status(401).json({ error: 'Debes iniciar sesión primero' })

  // Requiere Steam para unirse
  if (!session.user.steam_id)
    return res.status(403).json({ error: 'Debes vincular tu Steam antes de unirte a una comunidad' })

  const { community_id } = req.body
  if (!community_id) return res.status(400).json({ error: 'Falta community_id' })

  const { data: community } = await supabaseAdmin
    .from('communities').select('id, access_mode, owner_id').eq('id', community_id).single()
  if (!community) return res.status(404).json({ error: 'Comunidad no encontrada' })

  // No puede unirse a su propia comunidad como miembro
  if (community.owner_id === session.user.id)
    return res.status(400).json({ error: 'Eres el dueño de esta comunidad' })

  // Verificar si ya es miembro
  const { data: existing } = await supabaseAdmin
    .from('community_members').select('id, approved')
    .eq('community_id', community_id).eq('user_id', session.user.id).single()

  if (existing) {
    if (existing.approved) return res.status(400).json({ error: 'Ya eres miembro de esta comunidad' })
    return res.status(400).json({ error: 'Tu solicitud ya está pendiente de aprobación' })
  }

  // approved=true para open, approved=false para subs_only y whitelist (pendiente)
  const approved = community.access_mode === 'open'

  const { error } = await supabaseAdmin.from('community_members').insert({
    community_id,
    user_id:  session.user.id,
    approved,
  })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({
    ok: true,
    approved,
    message: approved
      ? 'Te uniste a la comunidad'
      : 'Solicitud enviada — el streamer debe aprobarte',
  })
}
