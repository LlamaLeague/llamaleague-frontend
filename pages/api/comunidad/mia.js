// pages/api/comunidad/mia.js
// GET — devuelve la comunidad del streamer logueado.

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
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('owner_id', session.user.id)
    .single()

  return res.status(200).json({ community: community ?? null })
}
