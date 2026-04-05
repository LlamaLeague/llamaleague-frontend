// bot/index.js — LlamaLeague Bot v5
// Fixes: wo_deadline, winner_team, match_history, invitar jugadores, status queued

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const SteamUser        = require('steam-user')
const Dota2            = require('dota2')
const { createClient } = require('@supabase/supabase-js')

// ─── Validar env ───────────────────────────────────────────────────────────────
const REQUIRED = ['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_KEY','BOT_STEAM_USER','BOT_STEAM_PASS']
for (const k of REQUIRED) {
  if (!process.env[k]) { console.error(`[Bot] ERROR: falta ${k}`); process.exit(1) }
}

// ─── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ─── Mapas Dota 2 ─────────────────────────────────────────────────────────────
const SERVER_MAP = {
  peru:      Dota2.ServerRegion.SOUTHAMERICA,
  chile:     Dota2.ServerRegion.SOUTHAMERICA,
  brazil:    Dota2.ServerRegion.BRAZIL,
  argentina: Dota2.ServerRegion.SOUTHAMERICA,
  us_east:   Dota2.ServerRegion.USEAST,
}
const MODE_MAP = {
  ap:    Dota2.schema.DOTA_GameMode.DOTA_GAMEMODE_AP,
  cm:    Dota2.schema.DOTA_GameMode.DOTA_GAMEMODE_CM,
  turbo: Dota2.schema.DOTA_GameMode.DOTA_GAMEMODE_TURBO,
  ar:    Dota2.schema.DOTA_GameMode.DOTA_GAMEMODE_AR,
}

// ─── Estado global ─────────────────────────────────────────────────────────────
const steamClient = new SteamUser()
const dota2Client = new Dota2.Dota2Client(steamClient, true, false)

let botReady     = false
let activeSalaId = null
let woTimer      = null
let activeSala   = null   // objeto completo de la sala activa

// ─── Login Steam ───────────────────────────────────────────────────────────────
console.log('[Bot] Iniciando sesion en Steam...')
steamClient.logOn({ accountName: process.env.BOT_STEAM_USER, password: process.env.BOT_STEAM_PASS })

steamClient.on('steamGuard', (domain, callback, lastCodeWrong) => {
  if (lastCodeWrong) console.warn('[Bot] Codigo incorrecto.')
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout })
  rl.question(`[Bot] Codigo Steam Guard (${domain ?? 'email'}): `, code => {
    rl.close(); callback(code.trim())
  })
})

steamClient.on('loggedOn', () => {
  console.log('[Bot] Login Steam OK. Lanzando Dota 2...')
  steamClient.setPersona(SteamUser.EPersonaState.Online)
  steamClient.gamesPlayed([570])
  dota2Client.launch()
})

steamClient.on('error', e => {
  console.error('[Bot] Error Steam:', e.eresult, e.message)
  if ([SteamUser.EResult.InvalidPassword, SteamUser.EResult.AccountNotFound].includes(e.eresult))
    process.exit(1)
})

steamClient.on('disconnected', (eresult, msg) => {
  console.warn(`[Bot] Desconectado: ${msg}. Reconectando en 30s...`)
  botReady = false
  setTimeout(() => steamClient.logOn({
    accountName: process.env.BOT_STEAM_USER,
    password:    process.env.BOT_STEAM_PASS,
  }), 30_000)
})

dota2Client.on('ready', async () => {
  console.log('[Bot] Dota 2 GC listo.')
  botReady = true
  await recuperarSalaActiva()
  startPolling()
})

dota2Client.on('unhandledMsg', () => {})

// ─── Recuperar sala tras reinicio ──────────────────────────────────────────────
async function recuperarSalaActiva() {
  const { data: salas } = await supabase
    .from('lobbies').select('*').eq('status', 'waiting')
    .order('created_at', { ascending: true }).limit(1)

  if (!salas?.length) return
  const sala = salas[0]

  // Calcular deadline desde started_at + wo_timer (no hay columna wo_deadline)
  const startedAt   = sala.started_at ? new Date(sala.started_at) : new Date(sala.created_at)
  const woMs        = (sala.wo_timer || 5) * 60_000
  const deadline    = startedAt.getTime() + woMs
  const msRestantes = deadline - Date.now()

  if (msRestantes <= 0) {
    console.log(`[Bot] Sala ${sala.id} — WO vencido al reiniciar.`)
    activeSalaId = sala.id
    activeSala   = sala
    await handleWO(sala)
  } else {
    console.log(`[Bot] Retomando sala ${sala.id}. WO en ${Math.round(msRestantes/1000)}s`)
    activeSalaId = sala.id
    activeSala   = sala
    woTimer = setTimeout(() => handleWO(sala), msRestantes)
  }
}

// ─── Polling ───────────────────────────────────────────────────────────────────
function startPolling() {
  // Revisar salas en cola cada 8s
  setInterval(async () => {
    if (!botReady || activeSalaId) return
    await checkQueue()
  }, 8_000)

  // Heartbeat cada minuto
  setInterval(async () => {
    const { count } = await supabase
      .from('lobbies').select('*', { count:'exact', head:true })
      .in('status', ['waiting','active'])
    console.log(`[Bot] Heartbeat | activa: ${activeSalaId ?? 'ninguna'} | en DB: ${count ?? 0}`)
  }, 60_000)

  console.log('[Bot] Polling activo.')
}

async function checkQueue() {
  // El streamer crea salas en status 'waiting' directamente
  // El bot las toma cuando no tiene sala activa
  const { data: salas } = await supabase
    .from('lobbies').select('*').eq('status', 'waiting')
    .is('started_at', null)   // aún no procesadas por el bot
    .order('created_at', { ascending: true }).limit(1)

  if (!salas?.length) return
  console.log(`[Bot] Nueva sala detectada: ${salas[0].id}`)
  await procesarSala(salas[0])
}

// ─── Procesar sala ─────────────────────────────────────────────────────────────
async function procesarSala(sala) {
  activeSalaId = sala.id
  activeSala   = sala

  // Marcar started_at para que el bot no la tome de nuevo
  await supabase.from('lobbies')
    .update({ started_at: new Date().toISOString() })
    .eq('id', sala.id)

  try {
    await crearLobbyDota2(sala)
  } catch (err) {
    console.error('[Bot] Error creando lobby Dota2:', err.message)
    // Limpiar started_at para que pueda reintentarse
    await supabase.from('lobbies').update({ started_at: null }).eq('id', sala.id)
    activeSalaId = null
    activeSala   = null
    return
  }

  const woMs = (sala.wo_timer || 5) * 60_000
  woTimer = setTimeout(() => handleWO(sala), woMs)
  console.log(`[Bot] ✓ Lobby creado. Pass: ${sala.password} | WO en ${sala.wo_timer || 5}min`)

  // Invitar jugadores que ya estén en lobby_players
  await invitarJugadores(sala.id)
}

// ─── Crear lobby en Dota 2 ─────────────────────────────────────────────────────
function crearLobbyDota2(sala) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout GC 30s')), 30_000)

    dota2Client.createPracticeLobby({
      game_name:        `LlamaLeague | ${sala.password}`,
      server_region:    SERVER_MAP[sala.server] ?? Dota2.ServerRegion.SOUTHAMERICA,
      game_mode:        MODE_MAP[sala.mode]     ?? Dota2.schema.DOTA_GameMode.DOTA_GAMEMODE_AP,
      game_version:     Dota2.schema.DOTAGameVersion.GAME_VERSION_STABLE,
      allow_cheats:     false,
      fill_with_bots:   false,
      allow_spectating: true,
      pass_key:         sala.password,
      visibility:       Dota2.schema.DOTALobbyVisibility.DOTA_LOBBY_VISIBILITY_PUBLIC,
    }, (err, body) => {
      clearTimeout(timeout)
      if (err) return reject(err)
      const lobbyId = body?.lobby_id?.toString()
      console.log(`[Bot] Lobby Dota2 creado. ID: ${lobbyId}`)
      // Guardar dota_lobby_id en DB
      supabase.from('lobbies').update({ dota_lobby_id: lobbyId }).eq('id', sala.id)
      resolve(body)
    })
  })
}

// ─── Invitar jugadores por steam_id ───────────────────────────────────────────
async function invitarJugadores(salaId) {
  try {
    const { data: players } = await supabase
      .from('lobby_players')
      .select('user:user_id(steam_id, display_name)')
      .eq('lobby_id', salaId)

    if (!players?.length) return

    for (const p of players) {
      const steamId = p.user?.steam_id
      if (!steamId) continue
      try {
        // Convertir SteamID64 a SteamID object
        const sid = new SteamUser.SteamID(steamId)
        dota2Client.inviteToLobby(sid)
        console.log(`[Bot] Invitado: ${p.user?.display_name} (${steamId})`)
      } catch (e) {
        console.warn(`[Bot] Error invitando ${steamId}:`, e.message)
      }
    }
  } catch (e) {
    console.error('[Bot] Error en invitarJugadores:', e.message)
  }
}

// ─── WO ───────────────────────────────────────────────────────────────────────
async function handleWO(sala) {
  const { data: actual } = await supabase
    .from('lobbies').select('status').eq('id', sala.id).single()
  if (actual?.status !== 'waiting') { limpiarEstado(false); return }

  const { data: players, count } = await supabase
    .from('lobby_players').select('user_id, team', { count:'exact' })
    .eq('lobby_id', sala.id).eq('confirmed', true)

  const total = count ?? 0
  console.log(`[Bot] WO — ${total} jugadores confirmados`)

  if (total === 0) { await cancelarSala(sala.id); return }

  // Con 6+ jugadores iniciamos aunque no sean 10
  if (total >= 6) {
    await iniciarPartida(sala.id)
    return
  }

  // Menos de 6 — WO por equipo con más jugadores
  const radiant = (players ?? []).filter(p => p.team === 'radiant').length
  const dire    = (players ?? []).filter(p => p.team === 'dire').length
  const winner  = radiant >= dire ? 'radiant' : 'dire'
  console.log(`[Bot] WO parcial — Radiant:${radiant} Dire:${dire} → ${winner} gana por WO`)
  await reportarResultado(sala.id, winner, players ?? [])
}

// ─── Acciones ─────────────────────────────────────────────────────────────────
async function iniciarPartida(salaId) {
  try { dota2Client.launchPracticeLobby() } catch (_) {}
  await supabase.from('lobbies')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', salaId)
  limpiarEstado(false)
  console.log(`[Bot] ✓ Partida ${salaId} iniciada.`)
}

async function cancelarSala(salaId) {
  try { dota2Client.abandonCurrentGame() } catch (_) {}
  await supabase.from('lobbies')
    .update({ status: 'cancelled', ended_at: new Date().toISOString() })
    .eq('id', salaId)
  limpiarEstado(true)
  console.log(`[Bot] Sala ${salaId} cancelada por WO (0 jugadores).`)
}

// ─── Reportar resultado — usa match_history + users (no tabla ranking) ─────────
async function reportarResultado(salaId, winner, players) {
  // 1. Marcar sala como completada con winner_team (nombre real de la columna)
  await supabase.from('lobbies').update({
    status:      'completed',
    winner_team: winner,
    ended_at:    new Date().toISOString(),
  }).eq('id', salaId)

  // 2. Actualizar stats de cada jugador
  for (const p of players) {
    const won          = p.team === winner
    const points_delta = won ? 35 : -10
    const lc_delta     = won ? 5  : 0

    // Insertar en match_history
    await supabase.from('match_history').insert({
      lobby_id: salaId,
      user_id:  p.user_id,
      team:     p.team || 'unknown',
      won,
      points_delta,
      lc_delta,
    })

    // Obtener stats actuales
    const { data: user } = await supabase
      .from('users').select('points,wins,losses,lc_balance').eq('id', p.user_id).single()

    if (!user) continue

    const newPoints = Math.max(0, (user.points || 0) + points_delta)
    const newTier   = getTier(newPoints)

    await supabase.from('users').update({
      points:     newPoints,
      wins:       (user.wins   || 0) + (won ? 1 : 0),
      losses:     (user.losses || 0) + (won ? 0 : 1),
      lc_balance: (user.lc_balance || 0) + lc_delta,
      tier:       newTier,
      updated_at: new Date().toISOString(),
    }).eq('id', p.user_id)
  }

  limpiarEstado(true)
  console.log(`[Bot] ✓ Resultado registrado — ${winner} gana en sala ${salaId}`)
}

function getTier(points) {
  if (points >= 5000) return 'Apukuna'
  if (points >= 4000) return 'Hatun Kuraka'
  if (points >= 3000) return 'Inmortal'
  if (points >= 2500) return 'Qhapaq'
  if (points >= 2000) return 'Wiñay'
  if (points >= 1500) return 'Supay'
  if (points >= 1000) return 'Inti'
  if (points >= 700)  return 'Willka'
  if (points >= 500)  return 'Apu'
  if (points >= 300)  return 'Sinchi'
  if (points >= 150)  return 'Ayllu'
  if (points >= 50)   return 'Kawsay'
  return 'Wawa'
}

function limpiarEstado(destroyLobby) {
  if (woTimer) { clearTimeout(woTimer); woTimer = null }
  if (destroyLobby) { try { dota2Client.destroyLobby() } catch (_) {} }
  activeSalaId = null
  activeSala   = null
}

// ─── Eventos Dota 2 ───────────────────────────────────────────────────────────
dota2Client.on('practiceLobbyUpdate', async (lobby) => {
  if (!activeSalaId) return

  const enSala = (lobby.members ?? []).filter(m =>
    m.team === Dota2.schema.DOTA_GC_TEAM.DOTA_GC_TEAM_GOOD_GUYS ||
    m.team === Dota2.schema.DOTA_GC_TEAM.DOTA_GC_TEAM_BAD_GUYS
  )
  const count = enSala.length

  if (count > 0) {
    await supabase.from('lobbies').update({ player_count: count }).eq('id', activeSalaId)
    console.log(`[Bot] Jugadores en sala Dota2: ${count}/10`)
  }

  // Asignar equipos en DB según lo que vemos en el lobby
  for (const member of enSala) {
    const steamId64 = member.id?.toString()
    if (!steamId64) continue

    const team = member.team === Dota2.schema.DOTA_GC_TEAM.DOTA_GC_TEAM_GOOD_GUYS
      ? 'radiant' : 'dire'

    // Buscar user por steam_id
    const { data: user } = await supabase
      .from('users').select('id').eq('steam_id', steamId64).single()
    if (user) {
      await supabase.from('lobby_players')
        .update({ team })
        .eq('lobby_id', activeSalaId)
        .eq('user_id', user.id)
    }
  }

  // Auto-iniciar cuando hay 10
  if (count >= 10) {
    if (woTimer) { clearTimeout(woTimer); woTimer = null }
    const { data: sala } = await supabase
      .from('lobbies').select('status').eq('id', activeSalaId).single()
    if (sala?.status === 'waiting') await iniciarPartida(activeSalaId)
  }
})

// Resultado automático desde Dota 2 GC
dota2Client.on('matchDetailsData', async (matchId, matchData) => {
  if (!activeSalaId) return
  const winner = matchData?.match?.radiant_win ? 'radiant' : 'dire'
  console.log(`[Bot] Match ${matchId} terminó. Ganador: ${winner}`)

  const { data: sala } = await supabase
    .from('lobbies').select('status').eq('id', activeSalaId).single()
  const { data: players } = await supabase
    .from('lobby_players').select('user_id,team')
    .eq('lobby_id', activeSalaId).eq('confirmed', true)

  if (sala?.status === 'active' && players)
    await reportarResultado(activeSalaId, winner, players)
})

// Cuando un jugador nuevo entra al lobby de Dota, actualizar DB
dota2Client.on('practiceLobbyUpdate', async (lobby) => {
  // Ya manejado arriba, esto es para futuras extensiones
})

// ─── Shutdown ──────────────────────────────────────────────────────────────────
const shutdown = () => {
  console.log('\n[Bot] Cerrando...')
  limpiarEstado(false)
  try { dota2Client.exit() } catch(_) {}
  steamClient.logOff()
  setTimeout(() => process.exit(0), 1000)
}
process.on('SIGINT',  shutdown)
process.on('SIGTERM', shutdown)
