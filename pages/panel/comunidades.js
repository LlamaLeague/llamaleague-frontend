// pages/panel/comunidades.js
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

const PLATFORM_COLOR = { kick: '#22c55e', twitch: '#a855f7', youtube: '#ef4444' }
const PLATFORM_ICON  = { kick: '🟢', twitch: '🟣', youtube: '🔴' }

export default function Comunidades() {
  const router = useRouter()
  const [user,        setUser]        = useState(null)
  const [comunidades, setComunidades] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [joining,     setJoining]     = useState(null)
  const [memberships, setMemberships] = useState(new Set())
  const [msgs,        setMsgs]        = useState({})

  useEffect(() => {
    apiFetch('/api/auth/me').then(r => r.json()).then(async ({ user }) => {
      if (!user)      return router.replace('/')
      if (!user.type) return router.replace('/onboarding')
      setUser(user)

      const { createClient } = require('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      const { data: coms } = await sb.from('communities').select(`
        id, name, tag, description, platform, channel_url, access_mode,
        logo_url, banner_url, created_at,
        owner:owner_id ( display_name, steam_avatar, avatar_url )
      `).order('created_at', { ascending: false })
      setComunidades(coms ?? [])

      const { data: roster } = await sb
        .from('community_members').select('community_id').eq('user_id', user.id)
      if (roster) setMemberships(new Set(roster.map(r => r.community_id)))

      setLoading(false)
    })
  }, [])

  const handleJoin = async (community_id, access_mode) => {
    setJoining(community_id)
    const res  = await apiFetch('/api/comunidad/unirse', {
      method: 'POST', body: JSON.stringify({ community_id }),
    })
    const data = await res.json()
    if (res.ok) {
      setMemberships(prev => new Set([...prev, community_id]))
      setMsgs(prev => ({
        ...prev,
        [community_id]: {
          ok: true,
          text: access_mode === 'open' ? '✓ Te uniste' : '✓ Solicitud enviada',
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
        body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; overflow-x:hidden; }
        a { text-decoration:none; color:inherit; }

        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shine    { 0%{left:-100%} 20%{left:200%} 100%{left:200%} }
        @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

        /* ── SIDEBAR ── */
        .sidebar { width:220px; background:#080605; border-right:1px solid rgba(255,255,255,.04); display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0; z-index:50; }
        .sb-logo { padding:22px 24px 18px; font-family:'Bebas Neue'; font-size:20px; letter-spacing:4px; color:#dc2626; border-bottom:1px solid rgba(255,255,255,.04); }
        .sb-nav  { padding:16px 12px; flex:1; }
        .sb-item { display:flex; align-items:center; gap:10px; padding:10px; border-radius:2px; margin-bottom:2px; font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#4b5563; transition:all .15s; }
        .sb-item:hover  { color:#f1f0ef; background:rgba(255,255,255,.03); }
        .sb-item.active { color:#f1f0ef; background:rgba(220,38,38,.08); border-left:2px solid #dc2626; }
        .sb-footer { padding:16px; border-top:1px solid rgba(255,255,255,.04); display:flex; align-items:center; gap:10px; }
        .sb-avatar { width:30px; height:30px; border-radius:50%; object-fit:cover; }
        .sb-name   { font-size:13px; font-weight:600; }
        .sb-type   { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; }
        .sb-logout { margin-left:auto; font-size:12px; color:#374151; transition:color .2s; }
        .sb-logout:hover { color:#dc2626; }

        /* ── MAIN ── */
        .main { margin-left:220px; flex:1; padding:36px 40px; }
        .shell { display:flex; min-height:100vh; }
        .page-tag   { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-bottom:4px; }
        .page-title { font-family:'Bebas Neue'; font-size:36px; letter-spacing:2px; margin-bottom:24px; }

        .search {
          width:100%; max-width:480px; background:#0f0d0b;
          border:1px solid #1e1c1a; border-radius:2px;
          color:#f1f0ef; font-family:'Barlow'; font-size:14px;
          padding:11px 16px; outline:none; margin-bottom:32px;
          transition:border-color .2s;
        }
        .search:focus { border-color:#dc2626; }
        .search::placeholder { color:#374151; }

        /* ── GRID ── */
        .com-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));
          gap:28px;
        }

        /* ── CARD JJK STYLE ── */
        .com-card {
          position:relative;
          border-radius:16px;
          overflow:hidden;
          cursor:pointer;
          height:280px;
          display:flex;
          flex-direction:column;
          background:rgba(15,13,11,.95);
          border:1px solid rgba(255,255,255,.06);
          box-shadow:0 8px 24px rgba(0,0,0,.4);
          transition:all .4s cubic-bezier(.34,1.56,.64,1);
          opacity:0;
          transform:translateY(30px);
          animation:fadeInUp .5s ease-out forwards;
        }
        .com-card:hover {
          transform:translateY(-12px) scale(1.02);
          border-color:rgba(255,255,255,.12);
        }

        /* Banner de fondo */
        .com-banner {
          position:absolute; inset:0; z-index:0;
          background-size:cover; background-position:center;
          opacity:.25; transition:opacity .4s;
        }
        .com-card:hover .com-banner { opacity:.35; }
        .com-banner::after {
          content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
          background:linear-gradient(to right,transparent,rgba(255,255,255,.08),transparent);
          transform:skewX(-20deg); animation:shine 6s infinite;
        }
        /* Gradiente sobre el banner */
        .com-grad {
          position:absolute; inset:0; z-index:1;
          background:linear-gradient(to top, rgba(12,10,9,.98) 30%, rgba(12,10,9,.4) 100%);
        }

        /* Logo flotante (estilo sticker JJK) */
        .com-logo-wrap {
          position:absolute; top:14px; right:16px; z-index:20;
          width:88px; height:88px; pointer-events:none;
        }
        .com-logo {
          width:100%; height:100%; object-fit:cover; border-radius:50%;
          border:3px solid rgba(255,255,255,.15);
          filter:drop-shadow(0 8px 16px rgba(0,0,0,.7));
          animation:floatY 4s ease-in-out infinite;
          transition:transform .1s linear;
        }

        /* Contenido */
        .com-body {
          position:relative; z-index:10; padding:20px;
          flex:1; display:flex; flex-direction:column; justify-content:flex-end;
        }
        .com-owner { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .com-owner-av { width:24px; height:24px; border-radius:50%; object-fit:cover; }
        .com-owner-name { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,.5); }
        .com-plat { display:inline-flex; align-items:center; gap:4px; font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:2px 6px; border-radius:2px; margin-left:6px; }
        .com-name { font-family:'Bebas Neue'; font-size:26px; letter-spacing:1px; line-height:1.1; margin-bottom:3px; }
        .com-tag  { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#dc2626; margin-bottom:8px; }
        .com-desc { font-size:12px; color:rgba(255,255,255,.4); line-height:1.5; margin-bottom:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

        .com-chips { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
        .com-chip  { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:2px; font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:rgba(255,255,255,.5); }

        /* Botones bottom */
        .com-actions { display:flex; align-items:center; justify-content:space-between; }
        .btn-view   { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,.35); transition:color .2s; }
        .btn-view:hover { color:rgba(255,255,255,.7); }
        .btn-join   { font-family:'Barlow Condensed'; font-size:12px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; padding:7px 20px; background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer; transition:all .2s; clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px)); }
        .btn-join:hover:not(:disabled) { background:#ef4444; transform:translateY(-1px); }
        .btn-join:disabled { opacity:.5; cursor:not-allowed; }
        .btn-member { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:7px 14px; background:rgba(34,197,94,.1); color:#22c55e; border:1px solid rgba(34,197,94,.2); border-radius:2px; }
        .btn-wl { background:rgba(251,191,36,.1); color:#fbbf24; border:1px solid rgba(251,191,36,.2); }

        .msg-ok  { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#22c55e; }
        .msg-err { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#ef4444; }
        .wl-note { font-family:'Barlow Condensed'; font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#6b7280; margin-top:3px; text-align:right; }

        .empty { text-align:center; padding:80px 0; color:#374151; font-family:'Barlow Condensed'; font-size:14px; letter-spacing:2px; text-transform:uppercase; }

        @media(max-width:1100px) { .com-grid { grid-template-columns:1fr 1fr; } }
        @media(max-width:960px)  { .sidebar{display:none} .main{margin-left:0;padding:20px 16px} .com-grid{grid-template-columns:1fr} }
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
            <div className="com-grid">
              {filtered.map((c, idx) => (
                <ComunidadCard
                  key={c.id}
                  c={c}
                  idx={idx}
                  isMember={memberships.has(c.id)}
                  msg={msgs[c.id]}
                  joining={joining === c.id}
                  onJoin={() => handleJoin(c.id, c.access_mode)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}

function ComunidadCard({ c, idx, isMember, msg, joining, onJoin }) {
  const cardRef   = useRef()
  const logoRef   = useRef()
  const platColor = PLATFORM_COLOR[c.platform] || '#dc2626'
  const ownerAv   = c.logo_url || c.owner?.steam_avatar || c.owner?.avatar_url || '/favicon.ico'
  const bannerBg  = c.banner_url
    ? `url(${c.banner_url})`
    : `linear-gradient(135deg, ${platColor}40, #0c0a09)`

  const accessLabel = { open:'Abierta', subs_only:'Solo subs', whitelist:'Lista blanca' }
  const accessIcon  = { open:'🔓', subs_only:'⭐', whitelist:'🔒' }

  // Parallax 3D on mouse move
  const handleMouseMove = (e) => {
    if (!cardRef.current || !logoRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width  - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    cardRef.current.style.transform = `translateY(-12px) scale(1.02) perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`
    logoRef.current.style.transform = `perspective(800px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg) translateZ(20px) scale(1.08)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current || !logoRef.current) return
    cardRef.current.style.transform = ''
    logoRef.current.style.transform = ''
  }

  return (
    <div
      ref={cardRef}
      className="com-card"
      style={{
        animationDelay: `${idx * 0.07}s`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => {
        if (cardRef.current)
          cardRef.current.style.boxShadow = `0 20px 50px -10px ${platColor}50`
      }}
    >
      {/* Banner fondo */}
      <div className="com-banner" style={{background: bannerBg}} />
      <div className="com-grad" />

      {/* Logo flotante */}
      <div className="com-logo-wrap">
        <img ref={logoRef} src={ownerAv} alt="" className="com-logo"
          style={{animationDelay:`${idx * 0.3}s`}} />
      </div>

      {/* Contenido */}
      <div className="com-body">
        <div className="com-owner">
          <img src={c.owner?.steam_avatar || c.owner?.avatar_url || '/favicon.ico'} alt="" className="com-owner-av" />
          <span className="com-owner-name">{c.owner?.display_name}</span>
          <span className="com-plat" style={{background:`${platColor}20`, color:platColor, border:`1px solid ${platColor}40`}}>
            {PLATFORM_ICON[c.platform]} {c.platform}
          </span>
        </div>

        <div className="com-name">{c.name}</div>
        <div className="com-tag">/c/{c.tag}</div>

        {c.description && (
          <div className="com-desc">{c.description}</div>
        )}

        <div className="com-chips">
          <span className="com-chip">
            {accessIcon[c.access_mode]} {accessLabel[c.access_mode]}
          </span>
        </div>

        <div className="com-actions">
          <a href={`/comunidad/${c.tag}`} className="btn-view">Ver página →</a>

          {msg ? (
            <div style={{textAlign:'right'}}>
              <div className={msg.ok ? 'msg-ok' : 'msg-err'}>{msg.text}</div>
            </div>
          ) : isMember ? (
            <span className="btn-member">✓ Miembro</span>
          ) : c.access_mode === 'whitelist' ? (
            <div style={{textAlign:'right'}}>
              <button className="btn-join btn-wl" disabled={joining} onClick={onJoin}>
                {joining ? '...' : 'Solicitar'}
              </button>
              <div className="wl-note">Requiere aprobación</div>
            </div>
          ) : (
            <button className="btn-join" disabled={joining} onClick={onJoin}>
              {joining ? 'Uniéndose...' : 'Unirse'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Loader() {
  return <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span></div>
}
