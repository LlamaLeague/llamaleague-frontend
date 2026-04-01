// lib/ranking.js
// Lógica para registrar resultados en match_history y actualizar users.

/**
 * Registra el resultado de una sala y actualiza stats de usuarios.
 * Usa match_history y actualiza wins/losses/points en users.
 * @param {string} salaId
 * @param {'radiant'|'dire'} winner
 * @param {Array}  players  - [{ user_id, team }]
 * @param {object} supabase - cliente supabase
 */
export async function applyMatchResult(salaId, winner, players, supabase) {
  // Marcar sala como completada con winner_team (nombre real de la columna)
  await supabase
    .from('lobbies')
    .update({
      status:     'completed',
      winner_team: winner,
      ended_at:   new Date().toISOString(),
    })
    .eq('id', salaId)

  if (!players?.length) return

  // Registrar en match_history y actualizar stats por jugador
  for (const p of players) {
    const won         = p.team === winner
    const points_delta = won ? 35 : -10
    const lc_delta    = won ? 5  : 0

    // Insertar en match_history
    await supabase.from('match_history').insert({
      lobby_id:     salaId,
      user_id:      p.user_id,
      team:         p.team,
      won,
      points_delta,
      lc_delta,
    })

    // Obtener stats actuales del usuario
    const { data: user } = await supabase
      .from('users')
      .select('points, wins, losses, lc_balance')
      .eq('id', p.user_id)
      .single()

    if (!user) continue

    const newPoints = Math.max(0, (user.points ?? 0) + points_delta)
    const newTier   = getTier(newPoints)

    await supabase.from('users').update({
      points:     newPoints,
      wins:       (user.wins   ?? 0) + (won ? 1 : 0),
      losses:     (user.losses ?? 0) + (won ? 0 : 1),
      lc_balance: (user.lc_balance ?? 0) + lc_delta,
      tier:       newTier,
      updated_at: new Date().toISOString(),
    }).eq('id', p.user_id)
  }
}

// Tiers basados en puntos acumulados
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
