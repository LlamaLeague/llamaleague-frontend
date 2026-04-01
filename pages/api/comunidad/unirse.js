// pages/api/comunidad/unirse.js
// POST { community_id } — agrega al jugador al roster de la comunidad.

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

  const { community_id } = req.body
  if (!community_id) return res.status(400).json({ error: 'Falta community_id' })

  const { data: community } = await supabaseAdmin
    .from('communities')
    .select('id, access_mode, owner_id')
    .eq('id', community_id)
    .single()

  if (!community) return res.status(404).json({ error: 'Comunidad no encontrada' })

  if (community.access_mode === 'whitelist')
    return res.status(403).json({ error: 'Esta comunidad requiere aprobación manual del streamer' })

  // Verificar si ya es miembro
  const { data: existing } = await supabaseAdmin
    .from('roster')
    .select('id')
    .eq('community_id', community_id)
    .eq('user_id', session.user.id)
    .single()

  if (existing) return res.status(400).json({ error: 'Ya eres miembro de esta comunidad' })

  const { error } = await supabaseAdmin
    .from('roster')
    .insert({
      community_id,
      user_id:  session.user.id,
      approved: community.access_mode === 'open',
    })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true })
}
