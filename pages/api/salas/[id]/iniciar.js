// pages/api/salas/[id]/iniciar.js
// POST — streamer fuerza el inicio con los jugadores que esten.
import { getIronSession } from 'iron-session'
import { createClient }   from '@supabase/supabase-js'

const SESSION_OPTIONS = {
  password:   process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly:true, sameSite:'lax' },
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  const { id } = req.query
  const { data: sala } = await supabase.from('lobbies').select('created_by,status,player_count').eq('id', id).single()
  if (!sala)                              return res.status(404).json({ error: 'Sala no encontrada' })
  if (sala.created_by !== session.user.id) return res.status(403).json({ error: 'Solo el streamer puede iniciar' })
  if (sala.status !== 'waiting')          return res.status(400).json({ error: 'La sala no esta en espera' })
  if (sala.player_count < 6)             return res.status(400).json({ error: 'Minimo 6 jugadores para iniciar' })

  await supabase.from('lobbies').update({ status:'active', started_at: new Date().toISOString() }).eq('id', id)
  return res.status(200).json({ ok: true })
}
