// Vincula cuenta Steam al usuario logueado
import { getIronSession } from 'iron-session'
import { supabaseAdmin } from '@/lib/supabase'

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax', maxAge: 60*60*24*30 },
}

export default async function handler(req, res) {
  const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.redirect('/')

  if (req.method === 'GET' && !req.query['openid.mode']) {
    // Redirigir a Steam
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${base}/api/auth/steam-link`,
      'openid.realm': base,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    })
    return res.redirect(`https://steamcommunity.com/openid/login?${params}`)
  }

  // Callback de Steam
  try {
    const params = new URLSearchParams(req.url.split('?')[1])
    params.set('openid.mode', 'check_authentication')
    const verify = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const text = await verify.text()
    if (!text.includes('is_valid:true')) return res.redirect('/perfil?error=steam_invalid')

    const steamId = req.query['openid.claimed_id']?.match(/\/openid\/id\/(\d+)$/)?.[1]
    if (!steamId) return res.redirect('/perfil?error=no_steamid')

    // Verificar que el steam_id no esté en uso por otro usuario
    const { data: existing } = await supabaseAdmin.from('users').select('id').eq('steam_id', steamId).single()
    if (existing && existing.id !== session.user.id) return res.redirect('/perfil?error=steam_taken')

    // Obtener stats de OpenDota
    const steamId32 = BigInt(steamId) - BigInt('76561197960265728')
    let mmr = 0, hours = 0, steamName = '', steamAvatar = ''

    try {
      const [profileRes, statsRes, steamRes] = await Promise.all([
        fetch(`https://api.opendota.com/api/players/${steamId32}`),
        fetch(`https://api.opendota.com/api/players/${steamId32}/wl`),
        fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`)
      ])
      const profile = await profileRes.json()
      const steam = await steamRes.json()
      mmr = profile?.mmr_estimate?.estimate || 0
      steamName = steam?.response?.players?.[0]?.personaname || ''
      steamAvatar = steam?.response?.players?.[0]?.avatarfull || ''
    } catch(e) { console.error('OpenDota error:', e) }

    // Vincular Steam al usuario
    await supabaseAdmin.from('users').update({
      steam_id: steamId,
      steam_name: steamName,
      steam_avatar: steamAvatar,
      mmr_estimate: mmr,
      updated_at: new Date().toISOString(),
    }).eq('id', session.user.id)

    // Actualizar sesión
    session.user.steam_id = steamId
    await session.save()

    return res.redirect('/perfil?steam=linked')
  } catch(e) {
    console.error('Steam link error:', e)
    return res.redirect('/perfil?error=server')
  }
}
