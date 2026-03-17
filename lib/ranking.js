// lib/ranking.js
// Lógica compartida para actualizar el ranking después de una partida.

import { createClient } from '@supabase/supabase-js'

/**
 * Registra el resultado de una sala y actualiza el ranking de la comunidad.
 * @param {string} salaId       - UUID de la sala
 * @param {'radiant'|'dire'} winner
 * @param {string} communityId
 * @param {Array}  players      - [{ user_id, team }]
 */
export async function applyMatchResult(salaId, winner, communityId, players, supabase) {
  // Marcar sala como completada
  await supabase.from('lobbies').update({
    status:   'completed',
    winner,
    ended_at: new Date().toISOString(),
  }).eq('id', salaId)

  if (!players?.length) return

  // Actualizar puntos de cada jugador
  for (const p of players) {
    const won   = p.team === winner
    const delta = won ? 35 : -10

    const { data: existing } = await supabase
      .from('ranking')
      .select('id, points, wins, losses')
      .eq('community_id', communityId)
      .eq('user_id', p.user_id)
      .single()

    if (existing) {
      await supabase.from('ranking').update({
        points: Math.max(0, existing.points + delta),
        wins:   existing.wins   + (won ? 1 : 0),
        losses: existing.losses + (won ? 0 : 1),
      }).eq('id', existing.id)
    } else {
      await supabase.from('ranking').insert({
        community_id: communityId,
        user_id:      p.user_id,
        points:       Math.max(0, 1000 + delta),
        wins:         won ? 1 : 0,
        losses:       won ? 0 : 1,
        season:       1,
      })
    }
  }

  // Recalcular posiciones
  const { data: allRanking } = await supabase
    .from('ranking')
    .select('id, points')
    .eq('community_id', communityId)
    .order('points', { ascending: false })

  if (allRanking) {
    for (let i = 0; i < allRanking.length; i++) {
      await supabase.from('ranking').update({ position: i + 1 }).eq('id', allRanking[i].id)
    }
  }
}
