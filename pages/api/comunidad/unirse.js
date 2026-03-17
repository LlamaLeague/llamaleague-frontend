// pages/api/comunidad/unirse.js
// POST { community_id }
// Agrega al jugador al roster de la comunidad.

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
  if (!session.user) return res.status(401).json({ error: 'Debes iniciar sesion primero' })

  const { community_id } = req.body
  if (!community_id) return res.status(400).json({ error: 'Falta community_id' })

  // Obtener la comunidad para verificar modo de acceso
  const { data: community, error: comErr } = await supabase
    .from('communities')
    .select('id, access_mode, owner_id')
    .eq('id', community_id)
    .single()

  if (comErr || !community) return res.status(404).json({ error: 'Comunidad no encontrada' })

  // Si es whitelist, no se puede unir directamente
  if (community.access_mode === 'whitelist') {
    return res.status(403).json({ error: 'Esta comunidad requiere aprobacion manual del streamer' })
  }

  // Si es subs_only — por ahora lo permitimos y lo verificaremos al crear salas
  // (la verificacion de subs via API de Twitch/Kick se hace al momento de unirse a una sala)

  // Verificar que no este ya en el roster
  const { data: existing } = await supabase
    .from('roster')
    .select('id')
    .eq('community_id', community_id)
    .eq('user_id', session.user.id)
    .single()

  if (existing) return res.status(400).json({ error: 'Ya eres miembro de esta comunidad' })

  // Insertar en roster
  const { error } = await supabase
    .from('roster')
    .insert({
      community_id,
      user_id:  session.user.id,
      approved: community.access_mode === 'open', // open = aprobado automatico
    })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true })
}
