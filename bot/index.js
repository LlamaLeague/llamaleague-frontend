// bot/index.js — LlamaLeague Bot v4
// Node 16 + dota2 v7 + supabase-js v1 + steam-user v4

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const SteamUser        = require('steam-user')
const Dota2            = require('dota2')
const { createClient } = require('@supabase/supabase-js')

// ─── Validar variables de entorno ─────────────────────────────────────────────
const REQUIRED_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'BOT_STEAM_USER', 'BOT_STEAM_PASS']
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) { console.error(`[Bot] ERROR: falta ${key}`); process.exit(1) }
}

// ─── Supabase v1 ──────────────────────────────────────────────────────────────
// supabase-js v1 usa createClient con los mismos parametros
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Helper para queries — supabase v1 devuelve { data, error } igual que v2
async function dbSelect(table, query) {
  const { data, error } = await query
  if (error) console.error(`[DB] Error en ${table}:`, error.message)
  return data
}

// ─── Constantes Dota 2 ────────────────────────────────────────────────────────
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

// ─── Steam + Dota 2 ───────────────────────────────────────────────────────────
const steamClient = new SteamUser()
const dota2Client = new Dota2.Dota2Client(steamClient, true, false)

let botReady     = false
let activeSalaId = null
let woTimer      = null

// ─── Login Steam ──────────────────────────────────────────────────────────────
console.log('[Bot] Iniciando sesion en Steam...')
steamClient.logOn({ accountName: process.env.BOT_STEAM_USER, password: process.env.BOT_STEAM_PASS })

steamClient.on('steamGuard', (domain, callback, lastCodeWrong) => {
  if (lastCodeWrong) console.warn('[Bot] Codigo incorrecto.')
  const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout })
  readline.question(`[Bot] Codigo Steam Guard (${domain ?? 'email'}): `, code => {
    readline.close()
    callback(code.trim())
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
  if ([SteamUser.EResult.InvalidPassword, SteamUser.EResult.AccountNotFound].includes(e.eresult)) {
    process.exit(1)
  }
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

// ─── Recuperar sala activa tras reinicio ──────────────────────────────────────
async function recuperarSalaActiva() {
  const { data: salas } = await supabase
    .from('lobbies').select('*').eq('status', 'waiting')
    .order('created_at', { ascending: true }).limit(1)

  if (!salas?.length) return
  const sala = salas[0]
  const msRestantes = new Date(sala.wo_deadline).getTime() - Date.now()

  if (msRestantes <= 0) {
    console.log(`[Bot] Sala ${sala.id} con WO vencido al reiniciar.`)
    activeSalaId = sala.id
    await handleWO(sala)
  } else {
    console.log(`[Bot] Retomando sala ${sala.id}. WO en ${Math.round(msRestantes/1000)}s`)
    activeSalaId = sala.id
    woTimer = setTimeout(() => handleWO(sala), msRestantes)
  }
}

// ─── Polling ──────────────────────────────────────────────────────────────────
function startPolling() {
  setInterval(async () => {
    if (!botReady || activeSalaId) return
    await checkQueue()
  }, 8_000)

  setInterval(checkWODeadlines, 15_000)

  setInterval(async () => {
    const { count } = await supabase
      .from('lobbies').select('*', { count: 'exact', head: true })
      .in('status', ['waiting', 'active'])
    console.log(`[Bot] Heartbeat | sala activa: ${activeSalaId ?? 'ninguna'} | en DB: ${count ?? 0}`)
  }, 60_000)

  console.log('[Bot] Polling activo. Esperando salas...')
}

async function checkQueue() {
  const { data: salas } = await supabase
    .from('lobbies').select('*').eq('status', 'queued')
    .order('created_at', { ascending: true }).limit(1)
  if (!salas?.length) return
  console.log(`[Bot] Sala en cola: ${salas[0].id}`)
  await procesarSala(salas[0])
}

// ─── Procesar sala ────────────────────────────────────────────────────────────
async function procesarSala(sala) {
  activeSalaId = sala.id
  const woDeadline = new Date(Date.now() + sala.wo_timer * 60_000).toISOString()

  await supabase.from('lobbies')
    .update({ status: 'waiting', wo_deadline: woDeadline })
    .eq('id', sala.id)

  try {
    await crearLobbyDota2(sala)
  } catch (err) {
    console.error('[Bot] Error creando lobby:', err.message)
    await supabase.from('lobbies').update({ status: 'queued' }).eq('id', sala.id)
    activeSalaId = null
    return
  }

  woTimer = setTimeout(() => handleWO(sala), sala.wo_timer * 60_000)
  console.log(`[Bot] ✓ Lobby creado. Pass: ${sala.password} | WO en ${sala.wo_timer}min`)
}

// ─── Crear lobby en Dota 2 ────────────────────────────────────────────────────
function crearLobbyDota2(sala) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('Timeout GC 30s')), 30_000)

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
      clearTimeout(timeoutId)
      if (err) return reject(err)
      console.log(`[Bot] Lobby Dota2 ID: ${body?.lobby_id}`)
      resolve(body)
    })
  })
}

// ─── WO ───────────────────────────────────────────────────────────────────────
async function handleWO(sala) {
  const { data: actual } = await supabase
    .from('lobbies').select('status').eq('id', sala.id).single()
  if (actual?.status !== 'waiting') { limpiarEstado(false); return }

  const { data: players, count } = await supabase
    .from('lobby_players').select('user_id, team', { count: 'exact' })
    .eq('lobby_id', sala.id).eq('confirmed', true)

  const total = count ?? 0
  if (total >= 10) { await iniciarPartida(sala.id); return }
  if (total === 0)  { await cancelarSala(sala.id);  return }

  const radiant = (players ?? []).filter(p => p.team === 'radiant').length
  const dire    = (players ?? []).filter(p => p.team === 'dire').length
  const winner  = radiant >= dire ? 'radiant' : 'dire'
  console.log(`[Bot] WO parcial — Radiant:${radiant} Dire:${dire} → ${winner}`)
  await reportarResultado(sala.id, winner, sala.community_id, players ?? [])
}

async function checkWODeadlines() {
  if (!botReady) return
  const { data: vencidas } = await supabase
    .from('lobbies').select('*').eq('status', 'waiting')
    .lt('wo_deadline', new Date().toISOString())
  for (const sala of vencidas ?? []) {
    if (activeSalaId && activeSalaId !== sala.id) continue
    if (!activeSalaId) activeSalaId = sala.id
    if (activeSalaId === sala.id) await handleWO(sala)
  }
}

// ─── Acciones ─────────────────────────────────────────────────────────────────
async function iniciarPartida(salaId) {
  try { dota2Client.launchPracticeLobby() } catch (_) {}
  await supabase.from('lobbies')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', salaId)
  limpiarEstado(false)
  console.log(`[Bot] Partida ${salaId} iniciada.`)
}

async function cancelarSala(salaId) {
  try { dota2Client.abandonCurrentGame() } catch (_) {}
  await supabase.from('lobbies')
    .update({ status: 'cancelled', ended_at: new Date().toISOString() })
    .eq('id', salaId)
  limpiarEstado(true)
  console.log(`[Bot] Sala ${salaId} cancelada.`)
}

async function reportarResultado(salaId, winner, communityId, players) {
  await supabase.from('lobbies')
    .update({ status: 'completed', winner, ended_at: new Date().toISOString() })
    .eq('id', salaId)

  for (const p of players) {
    const won = p.team === winner, delta = won ? 35 : -10
    const { data: ex } = await supabase.from('ranking')
      .select('id,points,wins,losses')
      .eq('community_id', communityId).eq('user_id', p.user_id).single()
    if (ex) {
      await supabase.from('ranking').update({
        points: Math.max(0, ex.points + delta),
        wins:   ex.wins   + (won ? 1 : 0),
        losses: ex.losses + (won ? 0 : 1),
      }).eq('id', ex.id)
    } else {
      await supabase.from('ranking').insert({
        community_id: communityId, user_id: p.user_id,
        points: Math.max(0, 1000 + delta), wins: won?1:0, losses: won?0:1, season: 1,
      })
    }
  }

  const { data: all } = await supabase.from('ranking').select('id,points')
    .eq('community_id', communityId).order('points', { ascending: false })
  if (all) {
    for (let i = 0; i < all.length; i++)
      await supabase.from('ranking').update({ position: i+1 }).eq('id', all[i].id)
  }

  limpiarEstado(true)
  console.log(`[Bot] ${winner} gana en sala ${salaId}`)
}

function limpiarEstado(destroyLobby) {
  if (woTimer) { clearTimeout(woTimer); woTimer = null }
  if (destroyLobby) { try { dota2Client.destroyLobby() } catch (_) {} }
  activeSalaId = null
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
    console.log(`[Bot] Jugadores en sala: ${count}/10`)
  }
  if (count >= 10) {
    if (woTimer) { clearTimeout(woTimer); woTimer = null }
    const { data: sala } = await supabase.from('lobbies').select('status').eq('id', activeSalaId).single()
    if (sala?.status === 'waiting') await iniciarPartida(activeSalaId)
  }
})

dota2Client.on('matchDetailsData', async (matchId, matchData) => {
  if (!activeSalaId) return
  const winner = matchData?.match?.radiant_win ? 'radiant' : 'dire'
  console.log(`[Bot] Match ${matchId} terminó. Ganador: ${winner}`)
  const { data: sala }    = await supabase.from('lobbies').select('community_id,status').eq('id', activeSalaId).single()
  const { data: players } = await supabase.from('lobby_players').select('user_id,team').eq('lobby_id', activeSalaId).eq('confirmed', true)
  if (sala?.status === 'active' && players) await reportarResultado(activeSalaId, winner, sala.community_id, players)
})

// ─── Shutdown ─────────────────────────────────────────────────────────────────
process.on('SIGINT',  () => { console.log('\n[Bot] Cerrando...'); limpiarEstado(false); try { dota2Client.exit() } catch(_){} steamClient.logOff(); setTimeout(() => process.exit(0), 1000) })
process.on('SIGTERM', () => { console.log('\n[Bot] Cerrando...'); limpiarEstado(false); try { dota2Client.exit() } catch(_){} steamClient.logOff(); setTimeout(() => process.exit(0), 1000) })
