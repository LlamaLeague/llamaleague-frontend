// pages/api/comunidad/crear.js
// POST — crea la comunidad del streamer en Supabase.

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
  if (!session.user)                      return res.status(401).json({ error: 'No autenticado' })
  if (session.user.type !== 'streamer')   return res.status(403).json({ error: 'Solo streamers pueden crear comunidades' })

  const { name, tag, description, platform, channel_url, access_mode } = req.body

  // Validaciones
  if (!name?.trim())                        return res.status(400).json({ error: 'El nombre es obligatorio' })
  if (!/^[a-z0-9-]{2,20}$/.test(tag))      return res.status(400).json({ error: 'Tag invalido' })
  if (!channel_url?.trim())                 return res.status(400).json({ error: 'La URL del canal es obligatoria' })
  if (!['open','subs_only','whitelist'].includes(access_mode))
    return res.status(400).json({ error: 'Modo de acceso invalido' })

  // Verificar que el tag no este ocupado
  const { data: existing } = await supabase
    .from('communities')
    .select('id')
    .eq('tag', tag)
    .single()

  if (existing) return res.status(400).json({ error: 'Ese tag ya esta en uso, elige otro' })

  // Verificar que el streamer no tenga ya una comunidad
  const { data: miComunidad } = await supabase
    .from('communities')
    .select('id')
    .eq('owner_id', session.user.id)
    .single()

  if (miComunidad) return res.status(400).json({ error: 'Ya tienes una comunidad creada' })

  // Crear
  const { data, error } = await supabase
    .from('communities')
    .insert({
      owner_id:    session.user.id,
      name:        name.trim(),
      tag:         tag,
      description: description?.trim() || null,
      platform,
      channel_url: channel_url.trim(),
      access_mode,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true, community: data })
}
