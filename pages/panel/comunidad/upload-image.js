// pages/api/comunidad/upload-image.js
// POST multipart/form-data — sube banner o logo de la comunidad a Supabase Storage

import { getIronSession }  from 'iron-session'
import { supabaseAdmin }   from '@/lib/supabase'

export const config = { api: { bodyParser: false } }

const SESSION_OPTIONS = {
  password:   process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user)                    return res.status(401).json({ error: 'No autenticado' })
  if (session.user.type !== 'streamer') return res.status(403).json({ error: 'Solo streamers' })

  // Obtener comunidad del streamer
  const { data: community } = await supabaseAdmin
    .from('communities').select('id').eq('owner_id', session.user.id).single()
  if (!community) return res.status(404).json({ error: 'No tienes comunidad creada' })

  // Parsear form con formidable
  const formidable = (await import('formidable')).default
  const form = formidable({ maxFileSize: 5 * 1024 * 1024 }) // 5MB max

  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve([fields, files])
    })
  })

  const type     = fields.type?.[0] || fields.type // 'banner' | 'logo'
  const file     = files.file?.[0]  || files.file
  if (!file)       return res.status(400).json({ error: 'No se recibió archivo' })
  if (!['banner','logo'].includes(type))
    return res.status(400).json({ error: 'Tipo debe ser banner o logo' })

  const fs       = await import('fs')
  const fileData = fs.readFileSync(file.filepath)
  const ext      = file.originalFilename?.split('.').pop() || 'jpg'
  const path     = `${community.id}/${type}.${ext}`

  // Subir a Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('community-images')
    .upload(path, fileData, {
      contentType: file.mimetype,
      upsert: true,   // sobrescribe si ya existe
    })

  if (uploadError) return res.status(500).json({ error: uploadError.message })

  // Obtener URL pública
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('community-images')
    .getPublicUrl(path)

  // Guardar URL en tabla communities
  const col = type === 'banner' ? 'banner_url' : 'logo_url'
  await supabaseAdmin.from('communities')
    .update({ [col]: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', community.id)

  return res.status(200).json({ ok: true, url: publicUrl })
}
