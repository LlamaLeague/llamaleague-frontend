import { supabase } from '@/lib/supabase'
import { getIronSession } from 'iron-session'

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: 'Email o contraseña incorrectos' })

  // Obtener datos del usuario
  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data: user } = await admin.from('users').select('*').eq('id', data.user.id).single()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  session.user = {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    steam_id: user.steam_id,
    is_admin: user.is_admin,
    points: user.points,
    tier: user.tier,
  }
  await session.save()

  return res.status(200).json({ ok: true, user: session.user })
}
