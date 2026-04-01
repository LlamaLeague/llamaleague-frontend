// pages/api/salas/crear.js
// POST — crea una sala en Supabase (requiere ser streamer con comunidad).

import { getIronSession } from 'iron-session'
import { supabaseAdmin }  from '@/lib/supabase'

const SESSION_OPTIONS = {
  password:   process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' },
}

const MODOS_VALIDOS   = ['ap', 'cm', 'turbo', 'ar']
const SERVERS_VALIDOS = ['peru', 'chile', 'brazil', 'argentina', 'us_east']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user)                    return res.status(401).json({ error: 'No autenticado' })
  if (session.user.type !== 'streamer') return res.status(403).json({ error: 'Solo streamers pueden crear salas' })

  const { community_id, mode, wo_timer, server, balance, notes } = req.body

  if (!community_id)                     return res.status(400).json({ error: 'Falta community_id' })
  if (!MODOS_VALIDOS.includes(mode))     return res.status(400).json({ error: 'Modo invalido' })
  if (!SERVERS_VALIDOS.includes(server)) return res.status(400).json({ error: 'Servidor invalido' })
  if (![3, 5, 10].includes(wo_timer))    return res.status(400).json({ error: 'Timer WO invalido' })

  // Verificar que la comunidad pertenece al streamer
  const { data: community } = await supabaseAdmin
    .from('communities')
    .select('id, owner_id')
    .eq('id', community_id)
    .eq('owner_id', session.user.id)
    .single()

  if (!community) return res.status(403).json({ error: 'No tienes permiso sobre esta comunidad' })

  // Verificar que no haya sala activa de esta comunidad
  const { data: salaAbierta } = await supabaseAdmin
    .from('lobbies')
    .select('id')
    .eq('community_id', community_id)
    .in('status', ['waiting', 'queued', 'active'])
    .single()

  if (salaAbierta) return res.status(400).json({ error: 'Ya hay una sala activa. Cancélala antes de crear otra.' })

  // Generar contraseña del lobby
  const password = Math.random().toString(36).slice(2, 8).toUpperCase()
  const salaName = `${mode.toUpperCase()} — ${server}`

  const { data: sala, error } = await supabaseAdmin
    .from('lobbies')
    .insert({
      name:         salaName,
      community_id,
      created_by:   session.user.id,
      mode,
      server,
      wo_timer:     wo_timer ?? 5,
      balance_mmr:  balance ?? true,
      notes:        notes?.trim() || null,
      password,
      status:       'waiting',
      player_count: 0,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true, sala })
}
