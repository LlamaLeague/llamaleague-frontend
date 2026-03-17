// pages/api/salas/[id]/cancelar.js
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
  const { data: sala } = await supabase.from('lobbies').select('created_by,status').eq('id', id).single()
  if (!sala) return res.status(404).json({ error: 'Sala no encontrada' })
  if (sala.created_by !== session.user.id) return res.status(403).json({ error: 'Solo el streamer puede cancelar' })
  if (!['queued','waiting'].includes(sala.status)) return res.status(400).json({ error: 'No se puede cancelar esta sala' })

  await supabase.from('lobbies').update({ status:'cancelled', ended_at: new Date().toISOString() }).eq('id', id)
  return res.status(200).json({ ok: true })
}
