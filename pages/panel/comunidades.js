// pages/panel/comunidades.js — Lista de comunidades para jugadores
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

export default function Comunidades() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [comunidades, setComunidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [joining, setJoining] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    apiFetch('/api/auth/me').then(r => r.json()).then(({ user }) => {
      if (!user) return router.replace('/')
      if (!user.type) return router.replace('/onboarding')
      setUser(user)
    })
    // Cargar comunidades publicas desde Supabase directamente
    const { createClient } = require('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    sb.from('communities').select(`
      id, name, tag, description, platform, channel_url, access_mode, created_at,
      owner:owner_id ( display_name, avatar_url )
    `).order('created_at', { ascending: false }).then(({ data }) => {
      setComunidades(data ?? [])
      setLoading(false)
    })
  }, [])

  const handleJoin = async (community_id) => {
    setJoining(community_id)
    setMsg(null)
    const res = await apiFetch('/api/comunidad/unirse', {
      method: 'POST',
      body: JSON.stringify({ community_id })
    })
    const data = await res.json()
    setMsg({ id: community_id, text: res.ok ? '✓ Te uniste' : data.error, ok: res.ok })
    setJoining(null)
  }

  const filtered = comunidades.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.tag.toLowerCase().includes(search.toLowerCase())
  )

  const platformIcon = { kick: '🟢', twitch: '🟣', youtube: '🔴' }
  const accessLabel = { open: 'Abierta', subs_only: 'Solo subs', whitelist: 'Lista blanca' }

  if (loading) return <Loader />

  return (
    <>
      <Head>
        <title>Comunidades — LlamaLeague</title>
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
        .search-box { display:flex; gap:12px; margin-bottom:24px; }
        .search-input { flex:1; background:#0f0d0b; border:1px solid #1e1c1a; border-radius:2px; color:#f1f0ef; font-family:'Barlow'; font-size:14px; padding:10px 14px; outline:none; max-width:400px; }
        .search-input:focus { border-color:#dc2626; }
        .search-input::placeholder { color:#374151; }
        .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .card { background:#0f0d0b; border:1px solid #1a1410; border-radius:3px; overflow:hidden; transition:border-color .2s; }
        .card:hover { border-color:#2a2018; }
        .card-top { padding:20px; }
        .card-owner { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
        .owner-avatar { width:36px; height:36px; border-radius:50%; object-fit:cover; }
        .owner-name { font-size:13px; font-weight:600; color:#f1f0ef; }
        .owner-platform { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#6b7280; }
        .card-name { font-family:'Bebas Neue'; font-size:22px; letter-spacing:1px; margin-bottom:4px; }
        .card-tag { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#dc2626; margin-bottom:8px; }
        .card-desc { font-size:12px; color:#6b7280; line-height:1.6; margin-bottom:12px; min-height:36px; }
        .card-chips { display:flex; gap:6px; flex-wrap:wrap; }
        .chip { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:2px; font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#6b7280; }
        .card-bottom { padding:12px 20px; border-top:1px solid #1a1410; display:flex; align-items:center; justify-content:space-between; }
        .btn-join { font-family:'Barlow Condensed'; font-size:12px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; padding:8px 20px; background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer; transition:all .2s; }
        .btn-join:hover:not(:disabled) { background:#ef4444; }
        .btn-join:disabled { opacity:.5; cursor:not-allowed; }
        .msg-ok  { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; color:#22c55e; }
        .msg-err { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; color:#ef4444; }
        .btn-view { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; transition:color .2s; }
        .btn-view:hover { color:#9ca3af; }
        .empty { text-align:center; padding:80px 0; color:#374151; font-family:'Barlow Condensed'; font-size:14px; letter-spacing:2px; text-transform:uppercase; }
        @media(max-width:960px) { .grid { grid-template-columns:1fr 1fr; } .main { margin-left:0; padding:20px 16px; } .sidebar { display:none; } }
        @media(max-width:600px) { .grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="shell">
        <aside className="sidebar">
          <div className="sb-logo">LlamaLeague</div>
          <nav className="sb-nav">
            <a href="/panel" className="sb-item">Dashboard</a>
            <a href="/panel/comunidades" className="sb-item active">Comunidades</a>
            <a href="/panel/ranking" className="sb-item">Mi Ranking</a>
            <a href="/panel/historial" className="sb-item">Historial</a>
          </nav>
          {user && (
            <div className="sb-footer">
              <img src={user.avatar_url} alt="" className="sb-avatar" />
              <div>
                <div className="sb-name">{user.display_name}</div>
                <div className="sb-type">Jugador</div>
              </div>
              <a href="/api/auth/logout" className="sb-logout">✕</a>
            </div>
          )}
        </aside>

        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-tag">Jugador</div>
              <h1 className="page-title">Comunidades</h1>
            </div>
          </div>

          <div className="search-box">
            <input
              className="search-input"
              placeholder="Buscar comunidad o streamer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="empty">No se encontraron comunidades</div>
          ) : (
            <div className="grid">
              {filtered.map(c => (
                <div className="card" key={c.id}>
                  <div className="card-top">
                    <div className="card-owner">
                      <img src={c.owner?.avatar_url || '/favicon.ico'} alt="" className="owner-avatar" />
                      <div>
                        <div className="owner-name">{c.owner?.display_name}</div>
                        <div className="owner-platform">{platformIcon[c.platform] ?? '🎮'} {c.platform}</div>
                      </div>
                    </div>
                    <div className="card-name">{c.name}</div>
                    <div className="card-tag">/c/{c.tag}</div>
                    <div className="card-desc">{c.description || 'Comunidad de Dota 2'}</div>
                    <div className="card-chips">
                      <span className="chip">🔒 {accessLabel[c.access_mode]}</span>
                    </div>
                  </div>
                  <div className="card-bottom">
                    <a href={`/comunidad/${c.tag}`} className="btn-view">Ver página →</a>
                    {msg?.id === c.id ? (
                      <span className={msg.ok ? 'msg-ok' : 'msg-err'}>{msg.text}</span>
                    ) : (
                      <button
                        className="btn-join"
                        disabled={joining === c.id}
                        onClick={() => handleJoin(c.id)}
                      >
                        {joining === c.id ? 'Uniéndose...' : 'Unirse'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}

function Loader() {
  return <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span></div>
}
