// pages/panel/historial.js
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

export default function Historial() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [partidas, setPartidas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/auth/me').then(r => r.json()).then(async ({ user }) => {
      if (!user) return router.replace('/')
      if (!user.type) return router.replace('/onboarding')
      setUser(user)

      const { createClient } = require('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      if (user.type === 'streamer') {
        const { data } = await sb.from('lobbies').select(`
          id, mode, server, status, winner_team, player_count, created_at, ended_at,
          community:community_id ( name, tag )
        `).eq('created_by', user.id).eq('status', 'completed')
          .order('ended_at', { ascending: false }).limit(30)
        setPartidas(data ?? [])
      } else {
        const { data: lp } = await sb.from('lobby_players').select(`
          team, lobby:lobby_id (
            id, mode, server, status, winner_team, player_count, created_at, ended_at
          )
        `).eq('user_id', user.id)
          .not('lobby', 'is', null)
        const partidas = (lp ?? [])
          .filter(p => p.lobby?.status === 'completed')
          .map(p => ({ ...p.lobby, my_team: p.team }))
          .sort((a,b) => new Date(b.ended_at) - new Date(a.ended_at))
        setPartidas(partidas)
      }
      setLoading(false)
    })
  }, [])

  const modeLabel = { ap:'All Pick', cm:'Captains Mode', turbo:'Turbo', ar:'All Random' }

  if (loading) return <Loader />
  const isStreamer = user?.type === 'streamer'

  return (
    <>
      <Head>
        <title>Historial — LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; } body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; } a { text-decoration:none; color:inherit; }`}</style>
      <style jsx>{`
        .shell { display:flex; min-height:100vh; }
        .sidebar { width:220px; background:#080605; border-right:1px solid rgba(255,255,255,.04); display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0; z-index:50; }
        .sb-logo { padding:22px 24px 18px; font-family:'Bebas Neue'; font-size:20px; letter-spacing:4px; color:#dc2626; border-bottom:1px solid rgba(255,255,255,.04); }
        .sb-nav { padding:16px 12px; flex:1; }
        .sb-item { display:flex; align-items:center; gap:10px; padding:10px; border-radius:2px; margin-bottom:2px; font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#4b5563; transition:all .15s; }
        .sb-item:hover { color:#f1f0ef; background:rgba(255,255,255,.03); }
        .sb-item.active { color:#f1f0ef; background:rgba(220,38,38,.08); border-left:2px solid #dc2626; }
        .sb-footer { padding:16px; border-top:1px solid rgba(255,255,255,.04); display:flex; align-items:center; gap:10px; }
        .sb-avatar { width:30px; height:30px; border-radius:50%; object-fit:cover; }
        .sb-name { font-size:13px; font-weight:600; }
        .sb-type { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; }
        .sb-logout { margin-left:auto; font-size:12px; color:#374151; transition:color .2s; }
        .sb-logout:hover { color:#dc2626; }
        .main { margin-left:220px; flex:1; padding:32px 36px; max-width:calc(220px + 900px); }
        .page-tag { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-bottom:4px; }
        .page-title { font-family:'Bebas Neue'; font-size:36px; letter-spacing:2px; margin-bottom:28px; }
        .row { display:flex; align-items:center; gap:16px; padding:14px 18px; background:#0f0d0b; border:1px solid #1a1410; border-radius:2px; margin-bottom:6px; transition:border-color .15s; }
        .row:hover { border-color:#2a2018; }
        .result-bar { width:4px; height:40px; border-radius:2px; flex-shrink:0; }
        .row-info { flex:1; }
        .row-mode { font-family:'Barlow Condensed'; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#f1f0ef; }
        .row-meta { font-size:12px; color:#6b7280; margin-top:2px; }
        .row-winner { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:4px 10px; border-radius:2px; flex-shrink:0; }
        .row-players { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; color:#6b7280; flex-shrink:0; }
        .row-date { font-size:12px; color:#374151; flex-shrink:0; }
        .empty { text-align:center; padding:80px 0; color:#374151; font-family:'Barlow Condensed'; font-size:14px; letter-spacing:2px; text-transform:uppercase; }
      `}</style>

      <div className="shell">
        <aside className="sidebar">
          <div className="sb-logo">LlamaLeague</div>
          <nav className="sb-nav">
            <a href="/panel" className="sb-item">Dashboard</a>
            {isStreamer ? (
              <>
                <a href="/panel/comunidad" className="sb-item">Mi Comunidad</a>
                <a href="/panel/salas" className="sb-item">Salas</a>
                <a href="/panel/ranking" className="sb-item">Ranking</a>
              </>
            ) : (
              <>
                <a href="/panel/comunidades" className="sb-item">Comunidades</a>
                <a href="/panel/ranking" className="sb-item">Mi Ranking</a>
                <a href="/panel/historial" className="sb-item active">Historial</a>
              </>
            )}
          </nav>
          {user && (
            <div className="sb-footer">
              <img src={user.avatar_url} alt="" className="sb-avatar" />
              <div>
                <div className="sb-name">{user.display_name}</div>
                <div className="sb-type">{isStreamer ? 'Streamer' : 'Jugador'}</div>
              </div>
              <a href="/api/auth/logout" className="sb-logout">✕</a>
            </div>
          )}
        </aside>

        <main className="main">
          <div className="page-tag">{isStreamer ? 'Streamer' : 'Jugador'}</div>
          <h1 className="page-title">Historial de Partidas</h1>

          {partidas.length === 0 ? (
            <div className="empty">Sin partidas todavía</div>
          ) : (
            partidas.map(p => {
              const ganeMiEquipo = p.my_team && p.winner_team === p.my_team
              const barColor = p.my_team
                ? (ganeMiEquipo ? '#22c55e' : '#ef4444')
                : (p.winner_team === 'radiant' ? '#22c55e' : '#ef4444')

              return (
                <div className="row" key={p.id}>
                  <div className="result-bar" style={{background: barColor}} />
                  <div className="row-info">
                    <div className="row-mode">{modeLabel[p.mode] ?? p.mode}</div>
                    <div className="row-meta">{p.server} · {p.community?.name}</div>
                  </div>
                  <div className="row-winner" style={{
                    background: p.winner_team === 'radiant' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
                    color: p.winner_team === 'radiant' ? '#22c55e' : '#ef4444',
                    border: `1px solid ${p.winner_team === 'radiant' ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'}`
                  }}>
                    {p.winner_team === 'radiant' ? 'Radiant' : 'Dire'} gana
                  </div>
                  <div className="row-players">{p.player_count}/10</div>
                  <div className="row-date">{new Date(p.ended_at ?? p.created_at).toLocaleDateString('es-PE')}</div>
                </div>
              )
            })
          )}
        </main>
      </div>
    </>
  )
}

function Loader() {
  return <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span></div>
}
