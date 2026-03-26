import { getIronSession } from 'iron-session'
import { supabaseAdmin } from '@/lib/supabase'

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax', maxAge: 60*60*24*30 },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.status(401).json({ error: 'No autenticado' })

  const { display_name, country } = req.body

  if (display_name) {
    if (display_name.length < 3 || display_name.length > 20)
      return res.status(400).json({ error: 'Nick debe tener entre 3 y 20 caracteres' })
    const { data: existing } = await supabaseAdmin.from('users').select('id').eq('display_name', display_name).single()
    if (existing && existing.id !== session.user.id)
      return res.status(400).json({ error: 'Ese nick ya está en uso' })
  }

  const updates = {}
  if (display_name) updates.display_name = display_name
  if (country) updates.country = country
  updates.updated_at = new Date().toISOString()

  const { error } = await supabaseAdmin.from('users').update(updates).eq('id', session.user.id)
  if (error) return res.status(500).json({ error: error.message })

  if (display_name) session.user.display_name = display_name
  await session.save()

  return res.status(200).json({ ok: true })
}
