// pages/api/auth/register.js
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, display_name, country } = req.body

  if (!email || !password || !display_name || !country)
    return res.status(400).json({ error: 'Todos los campos son requeridos' })

  if (display_name.length < 3 || display_name.length > 20)
    return res.status(400).json({ error: 'El nick debe tener entre 3 y 20 caracteres' })

  // Verificar nick único
  const { data: existing } = await supabaseAdmin
    .from('users').select('id').eq('display_name', display_name).single()
  if (existing) return res.status(400).json({ error: 'Ese nick ya está en uso' })

  // 1. Crear usuario en Supabase Auth
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name, country },
  })
  if (error) return res.status(400).json({ error: error.message })

  // 2. Insertar en tabla users (esto es lo que faltaba)
  const { error: insertError } = await supabaseAdmin.from('users').insert({
    id:           data.user.id,
    email,
    display_name,
    country,
    points:       0,
    wins:         0,
    losses:       0,
    lc_balance:   0,
    tier:         'Wawa',
    is_admin:     false,
  })

  if (insertError) {
    // Si falla el insert, borrar el usuario de Auth para no dejar basura
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    return res.status(500).json({ error: 'Error al crear perfil: ' + insertError.message })
  }

  return res.status(200).json({ ok: true, user: data.user })
}
