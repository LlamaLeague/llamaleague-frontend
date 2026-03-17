// pages/api/salas/crear.js
// POST — crea la sala en Supabase y la pone en cola para el bot.
// El bot de Dota 2 la procesa de forma asincrona.

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

const MODOS_VALIDOS   = ['ap', 'cm', 'turbo', 'ar']
const SERVERS_VALIDOS = ['peru', 'chile', 'brazil', 'argentina', 'us_east']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user)                    return res.status(401).json({ error: 'No autenticado' })
  if (session.user.type !== 'streamer') return res.status(403).json({ error: 'Solo streamers pueden crear salas' })

  const { community_id, mode, wo_timer, server, balance, notes } = req.body

  // Validaciones
  if (!community_id)                    return res.status(400).json({ error: 'Falta community_id' })
  if (!MODOS_VALIDOS.includes(mode))    return res.status(400).json({ error: 'Modo invalido' })
  if (!SERVERS_VALIDOS.includes(server))return res.status(400).json({ error: 'Servidor invalido' })
  if (![3,5,10].includes(wo_timer))     return res.status(400).json({ error: 'Timer WO invalido' })

  // Verificar que la comunidad pertenece al streamer
  const { data: community } = await supabase
    .from('communities')
    .select('id, owner_id')
    .eq('id', community_id)
    .eq('owner_id', session.user.id)
    .single()

  if (!community) return res.status(403).json({ error: 'No tienes permiso sobre esta comunidad' })

  // Verificar que no haya ya una sala abierta de este streamer
  const { data: salaAbierta } = await supabase
    .from('lobbies')
    .select('id')
    .eq('community_id', community_id)
    .in('status', ['waiting', 'active'])
    .single()

  if (salaAbierta) return res.status(400).json({ error: 'Ya tienes una sala activa. Esperala o cancelala antes de crear otra.' })

  // Generar contrasena del lobby (6 chars alfanumericos)
  const password = Math.random().toString(36).slice(2, 8).toUpperCase()

  // Crear sala en Supabase con status 'queued' (esperando bot)
  const { data: sala, error } = await supabase
    .from('lobbies')
    .insert({
      community_id,
      created_by:   session.user.id,
      mode,
      server,
      wo_timer,
      balance_mmr:  balance ?? true,
      notes:        notes?.trim() || null,
      password,
      status:       'queued',       // bot la tomara pronto
      player_count: 0,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true, sala })
}
