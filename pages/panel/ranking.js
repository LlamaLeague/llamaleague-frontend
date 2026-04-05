// pages/panel/ranking.js
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

export default function Ranking() {
  const router  = useRouter()
  const [user,    setUser]    = useState(null)
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/auth/me').then(r => r.json()).then(async ({ user }) => {
      if (!user)      return router.replace('/')
      if (!user.type) return router.replace('/onboarding')
      setUser(user)

      const { createClient } = require('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const { data } = await sb
        .from('users')
        .select('id, display_name, steam_avatar, avatar_url, points, wins, losses, tier, mmr_estimate')
        .order('points', { ascending: false })
        .limit(50)
      setRanking(data ?? [])
      setLoading(false)
    })
  }, [])

  const posColor = (i) => i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c4f' : '#374151'

  if (loading) return <Loader />

  const isStreamer = user?.type === 'streamer'
  const avatar     = user ? (user.steam_avatar || user.avatar_url || '/favicon.ico') : '/favicon.ico'

  return (
    <>
      <Head>
        <title>Ranking — LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; }
        a { text-decoration:none; color:inherit; }
      `}</style>
      <style jsx>{`
        .shell { display:flex; min-height:100vh; }
        .sidebar { width:220px; background:#080605; border-right:1px solid rgba(255,255,255,.04); display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0; z-index:50; }
        .sb-logo { padding:22px 24px 18px; font-family:'Bebas Neue'; font-size:20px; letter-spacing:4px; color:#dc2626; border-bottom:1px solid rgba(255,255,255,.04); }
        .sb-nav  { padding:16px 12px; flex:1; }
        .sb-item { display:flex; align-items:center; gap:10px; padding:10px; border-radius:2px; margin-bottom:2px; font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#4b5563; transition:all .15s; }
        .sb-item:hover  { color:#f1f0ef; background:rgba(255,255,255,.03); }
        .sb-item.active { color:#f1f0ef; background:rgba(220,38,38,.08); border-left:2px solid #dc2626; }
        .sb-footer { padding:16px; border-top:1px solid rgba(255,255,255,.04); display:flex; align-items:center; gap:10px; }
        .sb-avatar { width:30px; height:30px; border-radius:50%; object-fit:cover; }
        .sb-name { font-size:13px; font-weight:600; }
        .sb-type { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; }
        .sb-logout { margin-left:auto; font-size:12px; color:#374151; transition:color .2s; }
        .sb-logout:hover { color:#dc2626; }
        .main { margin-left:220px; flex:1; padding:32px 36px; max-width:calc(220px + 800px); }
        .page-tag   { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-bottom:4px; }
        .page-title { font-family:'Bebas Neue'; font-size:36px; letter-spacing:2px; margin-bottom:28px; }
        .rank-row { display:flex; align-items:center; gap:14px; padding:12px 18px; background:#0f0d0b; border:1px solid #1a1410; border-radius:2px; margin-bottom:6px; transition:border-color .15s; }
        .rank-row:hover { border-color:#2a2018; }
        .rank-pos    { font-family:'Bebas Neue'; font-size:24px; width:32px; text-align:center; flex-shrink:0; }
        .rank-avatar { width:32px; height:32px; border-radius:50%; object-fit:cover; flex-shrink:0; }
        .rank-name   { font-size:14px; font-weight:600; flex:1; }
        .rank-stats  { display:flex; gap:16px; align-items:center; flex-shrink:0; }
        .stat-val { font-family:'Bebas Neue'; font-size:20px; line-height:1; }
        .stat-lbl { font-family:'Barlow Condensed'; font-size:9px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#374151; text-align:center; }
        .pts      { font-family:'Bebas Neue'; font-size:28px; color:#fbbf24; }
        .pts-lbl  { font-family:'Barlow Condensed'; font-size:9px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#6b7280; }
        .empty { text-align:center; padding:80px 0; color:#374151; font-family:'Barlow Condensed'; font-size:14px; letter-spacing:2px; text-transform:uppercase; }
        @media(max-width:960px) { .sidebar{display:none} .main{margin-left:0;padding:20px 16px} }
      `}</style>

      <div className="shell">
        <aside className="sidebar">
          <div className="sb-logo">LlamaLeague</div>
          <nav className="sb-nav">
            <a href="/panel"             className="sb-item">Dashboard</a>
            {isStreamer && <a href="/panel/comunidad"   className="sb-item">Mi Comunidad</a>}
            {isStreamer && <a href="/panel/salas"       className="sb-item">Salas</a>}
            <a href="/panel/comunidades" className="sb-item">Comunidades</a>
            <a href="/panel/ranking"     className="sb-item active">Ranking</a>
            <a href="/panel/historial"   className="sb-item">Historial</a>
            <a href="/perfil"            className="sb-item">Mi Perfil</a>
          </nav>
          {user && (
            <div className="sb-footer">
              <img src={avatar} alt="" className="sb-avatar" />
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
          <h1 className="page-title">Ranking</h1>

          {ranking.length === 0 ? (
            <div className="empty">Sin datos todavía — juega partidas para aparecer en el ranking</div>
          ) : (
            ranking.map((r, i) => (
              <div className="rank-row" key={r.id}>
                <div className="rank-pos" style={{color: posColor(i)}}>{i + 1}</div>
                <img src={r.steam_avatar || r.avatar_url || '/favicon.ico'} alt="" className="rank-avatar" />
                <div className="rank-name">{r.display_name}</div>
                <div className="rank-stats">
                  <div style={{textAlign:'center'}}>
                    <div className="stat-val" style={{color:'#22c55e'}}>{r.wins}</div>
                    <div className="stat-lbl">Victorias</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div className="stat-val" style={{color:'#ef4444'}}>{r.losses}</div>
                    <div className="stat-lbl">Derrotas</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div className="pts">{r.points}</div>
                    <div className="pts-lbl">pts</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </>
  )
}

function Loader() {
  return <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span></div>
}
