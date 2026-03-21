// pages/panel/salas/index.js — Lista de salas del streamer
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

export default function MisSalas() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/auth/me').then(r => r.json()).then(({ user }) => {
      if (!user) return router.replace('/')
      if (!user.type) return router.replace('/onboarding')
      setUser(user)
      loadSalas(user.id)
    })
  }, [])

  const loadSalas = async (userId) => {
    const { createClient } = require('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data } = await sb.from('lobbies').select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setSalas(data ?? [])
    setLoading(false)
  }

  const statusColor = { queued:'#fbbf24', waiting:'#3b82f6', active:'#22c55e', completed:'#6b7280', cancelled:'#374151' }
  const statusLabel = { queued:'En cola', waiting:'Esperando', active:'Activa', completed:'Finalizada', cancelled:'Cancelada' }
  const modeLabel = { ap:'All Pick', cm:'Captains Mode', turbo:'Turbo', ar:'All Random' }

  if (loading) return <Loader />

  return (
    <>
      <Head>
        <title>Mis Salas — LlamaLeague</title>
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
        .main { margin-left:220px; flex:1; padding:32px 36px; }
        .page-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; }
        .page-tag { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-bottom:4px; }
        .page-title { font-family:'Bebas Neue'; font-size:36px; letter-spacing:2px; }
        .btn-primary { font-family:'Barlow Condensed'; font-size:13px; font-weight:900; letter-spacing:2px; text-transform:uppercase; padding:10px 24px; background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer; transition:all .2s; display:inline-flex; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
        .btn-primary:hover { background:#ef4444; }
        .table { width:100%; border-collapse:collapse; }
        .table th { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; padding:10px 16px; text-align:left; border-bottom:1px solid #1a1410; }
        .table td { padding:12px 16px; border-bottom:1px solid #131109; font-size:13px; }
        .table tr:hover td { background:rgba(255,255,255,.02); }
        .status-dot { display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:6px; }
        .badge { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:3px 8px; border-radius:2px; }
        .link { color:#dc2626; transition:color .2s; }
        .link:hover { color:#ef4444; }
        .empty { text-align:center; padding:80px 0; color:#374151; font-family:'Barlow Condensed'; font-size:14px; letter-spacing:2px; text-transform:uppercase; }
      `}</style>

      <div className="shell">
        <aside className="sidebar">
          <div className="sb-logo">LlamaLeague</div>
          <nav className="sb-nav">
            <a href="/panel" className="sb-item">Dashboard</a>
            <a href="/panel/comunidad" className="sb-item">Mi Comunidad</a>
            <a href="/panel/salas" className="sb-item active">Salas</a>
            <a href="/panel/ranking" className="sb-item">Ranking</a>
          </nav>
          {user && (
            <div className="sb-footer">
              <img src={user.avatar_url} alt="" className="sb-avatar" />
              <div>
                <div className="sb-name">{user.username}</div>
                <div className="sb-type">Streamer</div>
              </div>
              <a href="https://llamaleague-api.onrender.com/api/auth/logout" className="sb-logout">✕</a>
            </div>
          )}
        </aside>

        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-tag">Streamer</div>
              <h1 className="page-title">Mis Salas</h1>
            </div>
            <a href="/panel/salas/nueva" className="btn-primary">+ Nueva sala</a>
          </div>

          {salas.length === 0 ? (
            <div className="empty">Sin salas todavía — crea tu primera sala</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Modo</th>
                  <th>Servidor</th>
                  <th>Estado</th>
                  <th>Jugadores</th>
                  <th>Ganador</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {salas.map(s => (
                  <tr key={s.id}>
                    <td style={{fontFamily:'monospace', color:'#6b7280'}}>{s.id.slice(0,8).toUpperCase()}</td>
                    <td>{modeLabel[s.mode] ?? s.mode}</td>
                    <td style={{textTransform:'capitalize'}}>{s.server}</td>
                    <td>
                      <span className="status-dot" style={{background: statusColor[s.status] ?? '#374151'}} />
                      <span style={{color: statusColor[s.status] ?? '#374151', fontFamily:'Barlow Condensed', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase'}}>
                        {statusLabel[s.status] ?? s.status}
                      </span>
                    </td>
                    <td>{s.player_count ?? 0}/10</td>
                    <td style={{textTransform:'capitalize', color: s.winner === 'radiant' ? '#22c55e' : s.winner === 'dire' ? '#ef4444' : '#374151'}}>
                      {s.winner ?? '—'}
                    </td>
                    <td style={{color:'#6b7280'}}>{new Date(s.created_at).toLocaleDateString('es-PE')}</td>
                    <td>
                      {['queued','waiting','active'].includes(s.status) && (
                        <a href={`/panel/salas/${s.id}`} className="link">Ver →</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>
    </>
  )
}

function Loader() {
  return <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span></div>
}
