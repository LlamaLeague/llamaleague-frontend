// pages/panel/comunidades.js
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

export default function Comunidades() {
  const router = useRouter()
  const [user,       setUser]       = useState(null)
  const [comunidades,setComunidades] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [joining,    setJoining]    = useState(null)
  const [memberships,setMemberships]= useState(new Set()) // IDs donde ya soy miembro
  const [msgs,       setMsgs]       = useState({})        // mensajes por comunidad

  useEffect(() => {
    apiFetch('/api/auth/me').then(r => r.json()).then(async ({ user }) => {
      if (!user)      return router.replace('/')
      if (!user.type) return router.replace('/onboarding')
      setUser(user)

      const { createClient } = require('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      // Cargar comunidades
      const { data: coms } = await sb.from('communities').select(`
        id, name, tag, description, platform, channel_url, access_mode, created_at,
        logo_url, owner:owner_id ( display_name, steam_avatar, avatar_url )
      `).order('created_at', { ascending: false })
      setComunidades(coms ?? [])

      // Cargar mis membresías para saber dónde ya estoy
      const { data: roster } = await sb
        .from('roster').select('community_id').eq('user_id', user.id)
      if (roster) setMemberships(new Set(roster.map(r => r.community_id)))

      setLoading(false)
    })
  }, [])

  const handleJoin = async (community_id, access_mode) => {
    setJoining(community_id)
    const res  = await apiFetch('/api/comunidad/unirse', {
      method: 'POST',
      body:   JSON.stringify({ community_id }),
    })
    const data = await res.json()
    if (res.ok) {
      setMemberships(prev => new Set([...prev, community_id]))
      setMsgs(prev => ({
        ...prev,
        [community_id]: {
          ok:   true,
          text: access_mode === 'subs_only'
            ? '✓ Solicitud enviada — pendiente de verificación'
            : '✓ Te uniste',
        },
      }))
    } else {
      setMsgs(prev => ({ ...prev, [community_id]: { ok: false, text: data.error } }))
    }
    setJoining(null)
  }

  const filtered = comunidades.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.tag.toLowerCase().includes(search.toLowerCase())
  )

  const platformIcon = { kick:'🟢', twitch:'🟣', youtube:'🔴' }
  const accessLabel  = { open:'Abierta', subs_only:'Solo subs', whitelist:'Lista blanca' }

  if (loading) return <Loader />

  const isStreamer = user?.type === 'streamer'
  const avatar     = user ? (user.steam_avatar || user.avatar_url || '/favicon.ico') : '/favicon.ico'

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

        .main { margin-left:220px; flex:1; padding:32px 36px; }
        .page-tag   { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-bottom:4px; }
        .page-title { font-family:'Bebas Neue'; font-size:36px; letter-spacing:2px; margin-bottom:24px; }

        .search { width:100%; max-width:440px; background:#0f0d0b; border:1px solid #1e1c1a; border-radius:2px; color:#f1f0ef; font-family:'Barlow'; font-size:14px; padding:10px 14px; outline:none; margin-bottom:24px; }
        .search:focus { border-color:#dc2626; }
        .search::placeholder { color:#374151; }

        .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }

        /* CARD */
        .card { background:#0f0d0b; border:1px solid #1a1410; border-radius:3px; overflow:hidden; transition:border-color .2s; }
        .card:hover { border-color:#2a2018; }
        .card-top { padding:20px; }
        .card-owner { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
        .owner-av   { width:36px; height:36px; border-radius:50%; object-fit:cover; }
        .owner-name { font-size:13px; font-weight:600; color:#f1f0ef; }
        .owner-plat { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#6b7280; }
        .card-name  { font-family:'Bebas Neue'; font-size:22px; letter-spacing:1px; margin-bottom:4px; }
        .card-tag   { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#dc2626; margin-bottom:8px; }
        .card-desc  { font-size:12px; color:#6b7280; line-height:1.6; margin-bottom:12px; }
        .card-chips { display:flex; gap:6px; flex-wrap:wrap; }
        .chip { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:2px; font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#6b7280; }

        /* CARD BOTTOM */
        .card-bot { padding:12px 20px; border-top:1px solid #1a1410; display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .btn-view  { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; transition:color .2s; }
        .btn-view:hover { color:#9ca3af; }
        .btn-join  { font-family:'Barlow Condensed'; font-size:12px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; padding:7px 18px; background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer; transition:all .2s; }
        .btn-join:hover:not(:disabled) { background:#ef4444; }
        .btn-join:disabled { opacity:.5; cursor:not-allowed; }
        .btn-member { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:7px 14px; background:rgba(34,197,94,.08); color:#22c55e; border:1px solid rgba(34,197,94,.2); border-radius:2px; }
        .msg-ok  { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; color:#22c55e; }
        .msg-err { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; color:#ef4444; }

        /* WHITELIST NOTICE */
        .whitelist-note { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#6b7280; margin-top:4px; }

        .empty { text-align:center; padding:80px 0; color:#374151; font-family:'Barlow Condensed'; font-size:14px; letter-spacing:2px; text-transform:uppercase; }

        @media(max-width:1100px) { .grid { grid-template-columns:1fr 1fr; } }
        @media(max-width:960px)  { .sidebar{display:none} .main{margin-left:0;padding:20px 16px} .grid{grid-template-columns:1fr} }
      `}</style>

      <div className="shell">
        <aside className="sidebar">
          <div className="sb-logo">LlamaLeague</div>
          <nav className="sb-nav">
            <a href="/panel"             className="sb-item">Dashboard</a>
            {isStreamer && <a href="/panel/comunidad" className="sb-item">Mi Comunidad</a>}
            {isStreamer && <a href="/panel/salas"     className="sb-item">Salas</a>}
            <a href="/panel/comunidades" className="sb-item active">Comunidades</a>
            <a href="/panel/ranking"     className="sb-item">Ranking</a>
            <a href="/panel/historial"   className="sb-item">Historial</a>
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
          <h1 className="page-title">Comunidades</h1>

          <input
            className="search"
            placeholder="Buscar comunidad o streamer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {filtered.length === 0 ? (
            <div className="empty">No se encontraron comunidades</div>
          ) : (
            <div className="grid">
              {filtered.map(c => {
                const isMember  = memberships.has(c.id)
                const ownerAvatar = c.logo_url || c.owner?.steam_avatar || c.owner?.avatar_url || '/favicon.ico'
                const msg       = msgs[c.id]

                return (
                  <div className="card" key={c.id}>
                    <div className="card-top">
                      <div className="card-owner">
                        <img src={ownerAvatar} alt="" className="owner-av" />
                        <div>
                          <div className="owner-name">{c.owner?.display_name}</div>
                          <div className="owner-plat">{platformIcon[c.platform] ?? '🎮'} {c.platform}</div>
                        </div>
                      </div>
                      <div className="card-name">{c.name}</div>
                      <div className="card-tag">/c/{c.tag}</div>
                      <div className="card-desc">{c.description || 'Comunidad de Dota 2'}</div>
                      <div className="card-chips">
                        <span className="chip">
                          {c.access_mode === 'open'      && '🔓 '}
                          {c.access_mode === 'subs_only'  && '⭐ '}
                          {c.access_mode === 'whitelist'  && '🔒 '}
                          {accessLabel[c.access_mode]}
                        </span>
                      </div>
                    </div>

                    <div className="card-bot">
                      <a href={`/comunidad/${c.tag}`} className="btn-view">Ver página →</a>

                      {msg ? (
                        <div>
                          <div className={msg.ok ? 'msg-ok' : 'msg-err'}>{msg.text}</div>
                        </div>
                      ) : isMember ? (
                        <span className="btn-member">✓ Miembro</span>
                      ) : c.access_mode === 'whitelist' ? (
                        <div style={{textAlign:'right'}}>
                          <button
                            className="btn-join"
                            style={{background:'#374151'}}
                            disabled={joining === c.id}
                            onClick={() => handleJoin(c.id, c.access_mode)}
                          >
                            {joining === c.id ? 'Enviando...' : 'Solicitar acceso'}
                          </button>
                          <div className="whitelist-note">El streamer debe aprobarte</div>
                        </div>
                      ) : (
                        <button
                          className="btn-join"
                          disabled={joining === c.id}
                          onClick={() => handleJoin(c.id, c.access_mode)}
                        >
                          {joining === c.id ? 'Uniéndose...' : 'Unirse'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
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
