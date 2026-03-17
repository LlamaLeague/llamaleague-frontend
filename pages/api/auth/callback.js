// pages/api/auth/callback.js
// Steam redirige aqui despues del login.
// 1. Verifica la firma OpenID con Steam
// 2. Extrae el SteamID64
// 3. Obtiene el perfil del jugador via Steam Web API
// 4. Crea o actualiza el usuario en Supabase
// 5. Guarda la sesion con iron-session
// 6. Redirige a /onboarding (usuario nuevo) o /panel (ya registrado)

import { getIronSession } from 'iron-session'
import { createClient }   from '@supabase/supabase-js'

const SESSION_OPTIONS = {
  password:    process.env.SESSION_SECRET,
  cookieName:  'llamaleague_session',
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30, // 30 dias
  },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service_role para escritura
)

// ─── Verificar la firma OpenID con Steam ─────────────────────────────────────
async function verifyOpenId(query) {
  const params = new URLSearchParams(query)
  params.set('openid.mode', 'check_authentication')

  const res = await fetch('https://steamcommunity.com/openid/login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  })
  const text = await res.text()
  return text.includes('is_valid:true')
}

// ─── Extraer SteamID64 del claimed_id ────────────────────────────────────────
function extractSteamId(claimedId) {
  const match = claimedId?.match(/\/openid\/id\/(\d+)$/)
  return match ? match[1] : null
}

// ─── Obtener perfil de Steam ──────────────────────────────────────────────────
async function getSteamProfile(steamId) {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
  const res  = await fetch(url)
  const data = await res.json()
  return data?.response?.players?.[0] ?? null
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

  try {
    // 1. Verificar firma
    const valid = await verifyOpenId(new URLSearchParams(req.url.split('?')[1]))
    if (!valid) return res.redirect(`${base}/?error=invalid_openid`)

    // 2. Extraer steamId
    const steamId = extractSteamId(req.query['openid.claimed_id'])
    if (!steamId) return res.redirect(`${base}/?error=no_steamid`)

    // 3. Perfil de Steam
    const profile = await getSteamProfile(steamId)
    if (!profile) return res.redirect(`${base}/?error=steam_api`)

    // 4. Upsert en Supabase
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          steam_id:    steamId,
          username:    profile.personaname,
          avatar_url:  profile.avatarfull,
          profile_url: profile.profileurl,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'steam_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Supabase upsert error:', error)
      return res.redirect(`${base}/?error=db`)
    }

    // 5. Guardar sesion
    const session = await getIronSession(req, res, SESSION_OPTIONS)
    session.user = {
      id:         user.id,
      steam_id:   user.steam_id,
      username:   user.username,
      avatar_url: user.avatar_url,
      type:       user.type,       // 'player' | 'streamer' | null
    }
    await session.save()

    // 6. Redirigir
    const dest = user.type ? '/panel' : '/onboarding'
    return res.redirect(`${base}${dest}`)

  } catch (err) {
    console.error('Auth callback error:', err.message, err.stack)
    return res.redirect(`${base}/?error=server`)
  }
}
