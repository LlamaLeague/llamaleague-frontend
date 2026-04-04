// pages/api/auth/steam-link.js
// Vincula cuenta Steam al usuario — obtiene MMR, avatar y horas de Dota 2

import { getIronSession } from 'iron-session'
import { supabaseAdmin }  from '@/lib/supabase'

const SESSION_OPTIONS = {
  password:   process.env.SESSION_SECRET,
  cookieName: 'llamaleague_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax', maxAge: 60*60*24*30 },
}

const DOTA2_APP_ID = 570

export default async function handler(req, res) {
  const base    = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const session = await getIronSession(req, res, SESSION_OPTIONS)
  if (!session.user) return res.redirect('/login')

  // ── Paso 1: Redirigir a Steam OpenID ────────────────────────────────────────
  if (req.method === 'GET' && !req.query['openid.mode']) {
    const params = new URLSearchParams({
      'openid.ns':         'http://specs.openid.net/auth/2.0',
      'openid.mode':       'checkid_setup',
      'openid.return_to':  `${base}/api/auth/steam-link`,
      'openid.realm':       base,
      'openid.identity':   'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    })
    return res.redirect(`https://steamcommunity.com/openid/login?${params}`)
  }

  // ── Paso 2: Callback de Steam ────────────────────────────────────────────────
  try {
    // Verificar con Steam que el login es válido
    const params = new URLSearchParams(req.url.split('?')[1])
    params.set('openid.mode', 'check_authentication')
    const verify = await fetch('https://steamcommunity.com/openid/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    })
    const text = await verify.text()
    if (!text.includes('is_valid:true')) return res.redirect('/perfil?error=steam_invalid')

    const steamId = req.query['openid.claimed_id']?.match(/\/openid\/id\/(\d+)$/)?.[1]
    if (!steamId) return res.redirect('/perfil?error=no_steamid')

    // Verificar que no esté en uso por otro usuario
    const { data: taken } = await supabaseAdmin
      .from('users').select('id').eq('steam_id', steamId).single()
    if (taken && taken.id !== session.user.id)
      return res.redirect('/perfil?error=steam_taken')

    // ── Obtener datos de Steam API ─────────────────────────────────────────────
    const steamKey = process.env.STEAM_API_KEY
    const steamId32 = (BigInt(steamId) - BigInt('76561197960265728')).toString()

    let steamName   = ''
    let steamAvatar = ''
    let mmr         = 0
    let dotaHours   = 0

    try {
      // Steam API: perfil + horas jugadas en Dota 2
      const [summaryRes, hoursRes, openDotaRes] = await Promise.allSettled([
        fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamKey}&steamids=${steamId}`),
        fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamKey}&steamid=${steamId}&include_appinfo=false&appids_filter[0]=${DOTA2_APP_ID}`),
        fetch(`https://api.opendota.com/api/players/${steamId32}`),
      ])

      // Datos del perfil Steam
      if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
        const s = await summaryRes.value.json()
        const player = s?.response?.players?.[0]
        steamName   = player?.personaname   || ''
        steamAvatar = player?.avatarfull    || ''
      }

      // Horas en Dota 2
      if (hoursRes.status === 'fulfilled' && hoursRes.value.ok) {
        const h = await hoursRes.value.json()
        const dota = h?.response?.games?.find(g => g.appid === DOTA2_APP_ID)
        dotaHours = dota ? Math.round((dota.playtime_forever || 0) / 60) : 0
      }

      // MMR desde OpenDota (perfil público)
      if (openDotaRes.status === 'fulfilled' && openDotaRes.value.ok) {
        const profile = await openDotaRes.value.json()
        // Intentar varias fuentes de MMR en orden de prioridad
        mmr = profile?.mmr_estimate?.estimate
           || profile?.competitive_rank
           || profile?.solo_competitive_rank
           || 0
      }

    } catch (e) {
      console.error('Steam data fetch error:', e)
      // Continuamos aunque fallen — al menos vinculamos la cuenta
    }

    // ── Guardar en DB ──────────────────────────────────────────────────────────
    await supabaseAdmin.from('users').update({
      steam_id:     steamId,
      steam_name:   steamName,
      steam_avatar: steamAvatar,
      mmr_estimate: mmr,
      dota_hours:   dotaHours,
      updated_at:   new Date().toISOString(),
    }).eq('id', session.user.id)

    // Actualizar sesión
    session.user.steam_id     = steamId
    session.user.steam_name   = steamName
    session.user.steam_avatar = steamAvatar
    session.user.mmr_estimate = mmr
    session.user.dota_hours   = dotaHours
    await session.save()

    return res.redirect('/perfil?steam=linked')

  } catch (e) {
    console.error('Steam link error:', e)
    return res.redirect('/perfil?error=server')
  }
}
