// pages/api/comunidad/upload-image.js
// POST — sube banner o logo de la comunidad a Supabase Storage
// Usa el body parser de Next.js con base64 — sin formidable ni fs

import { getIronSession } from 'iron-session'
import { supabaseAdmin }  from '@/lib/supabase'

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

  const { type, fileBase64, mimeType, fileName } = req.body
  // type: 'banner' | 'logo'
  // fileBase64: string base64 del archivo
  // mimeType: 'image/jpeg' etc
  // fileName: nombre original

  if (!fileBase64 || !mimeType || !fileName)
    return res.status(400).json({ error: 'Faltan datos del archivo' })

  if (!['banner', 'logo'].includes(type))
    return res.status(400).json({ error: 'Tipo debe ser banner o logo' })

  // Validar que sea imagen
  if (!mimeType.startsWith('image/'))
    return res.status(400).json({ error: 'Solo se permiten imágenes' })

  // Obtener comunidad del streamer
  const { data: community } = await supabaseAdmin
    .from('communities').select('id').eq('owner_id', session.user.id).single()
  if (!community) return res.status(404).json({ error: 'No tienes comunidad creada' })

  // Decodificar base64
  const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, '')
  const buffer     = Buffer.from(base64Data, 'base64')

  // Validar tamaño máximo 5MB
  if (buffer.length > 5 * 1024 * 1024)
    return res.status(400).json({ error: 'La imagen no puede superar 5MB' })

  const ext  = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${community.id}/${type}.${ext}`

  // Subir a Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('community-images')
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) return res.status(500).json({ error: uploadError.message })

  // URL pública
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('community-images')
    .getPublicUrl(path)

  // Guardar en DB
  const col = type === 'banner' ? 'banner_url' : 'logo_url'
  const { error: dbError } = await supabaseAdmin
    .from('communities')
    .update({ [col]: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', community.id)

  if (dbError) return res.status(500).json({ error: dbError.message })

  return res.status(200).json({ ok: true, url: publicUrl })
}
