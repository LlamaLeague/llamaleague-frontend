import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password, display_name, country } = req.body

  if (!email || !password || !display_name || !country)
    return res.status(400).json({ error: 'Todos los campos son requeridos' })

  if (display_name.length < 3 || display_name.length > 20)
    return res.status(400).json({ error: 'El nick debe tener entre 3 y 20 caracteres' })

  // Verificar que el nick no esté ocupado
  const { data: existing } = await supabaseAdmin
    .from('users').select('id').eq('display_name', display_name).single()
  if (existing) return res.status(400).json({ error: 'Ese nick ya está en uso' })

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email, password,
    email_confirm: true,
    user_metadata: { display_name, country }
  })

  if (error) return res.status(400).json({ error: error.message })
  return res.status(200).json({ ok: true, user: data.user })
}
