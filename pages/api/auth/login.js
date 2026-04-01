// pages/api/auth/login.js
import { supabase, supabaseAdmin } from '@/lib/supabase'
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
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña son requeridos' })

  // Autenticar con Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: 'Email o contraseña incorrectos' })

  // Obtener perfil completo desde tabla users
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (userError || !user)
    return res.status(500).json({ error: 'No se encontró el perfil del usuario' })

  // Guardar sesión
  const session = await getIronSession(req, res, SESSION_OPTIONS)
  session.user = {
    id:           user.id,
    type:         user.type,        // puede ser null → irá a onboarding
    email:        user.email,
    display_name: user.display_name,
    country:      user.country,
    avatar_url:   user.avatar_url,
    steam_id:     user.steam_id,
    steam_name:   user.steam_name,
    steam_avatar: user.steam_avatar,
    mmr_estimate: user.mmr_estimate,
    is_admin:     user.is_admin,
    points:       user.points,
    wins:         user.wins,
    losses:       user.losses,
    lc_balance:   user.lc_balance,
    tier:         user.tier,
  }
  await session.save()

  return res.status(200).json({ ok: true, user: session.user })
}
