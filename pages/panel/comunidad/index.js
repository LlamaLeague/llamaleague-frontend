// pages/panel/comunidad/index.js
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

// Colores por tier para las cards del roster
const TIER_COLORS = {
  'Wawa':'#6b7280','Kawsay':'#22c55e','Ayllu':'#3b82f6','Sinchi':'#8b5cf6',
  'Apu':'#f59e0b','Willka':'#ef4444','Inti':'#f97316','Supay':'#dc2626',
  'Wiñay':'#7c3aed','Qhapaq':'#0891b2','Apukuna':'#be185d',
  'Hatun Kuraka':'#854d0e','Inmortal':'#fbbf24',
}

export default function MiComunidad() {
  const router = useRouter()
  const [user,        setUser]        = useState(null)
  const [community,   setCommunity]   = useState(null)
  const [members,     setMembers]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [expanded,    setExpanded]    = useState(null)
  const [uploading,   setUploading]   = useState(null) // 'banner' | 'logo' | null
  const [uploadMsg,   setUploadMsg]   = useState(null)
  const bannerRef = useRef()
  const logoRef   = useRef()

  useEffect(() => {
    apiFetch('/api/auth/me').then(r => r.json()).then(async ({ user }) => {
      if (!user)                    return router.replace('/')
      if (!user.type)               return router.replace('/onboarding')
      if (user.type !== 'streamer') return router.replace('/panel')
      setUser(user)

      const [comRes, rosterRes] = await Promise.all([
        apiFetch('/api/comunidad/mia'),
        apiFetch('/api/comunidad/roster'),
      ])
      const comData    = await comRes.json()
      const rosterData = await rosterRes.json()

      if (!comData.community) return router.replace('/panel/comunidad/nueva')
      setCommunity(comData.community)
      setMembers(rosterData.members ?? [])
      setLoading(false)
    })
  }, [])

  // Subir imagen (banner o logo)
  const handleUpload = async (type, file) => {
    if (!file) return
    setUploading(type)
    setUploadMsg(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    try {
      const res  = await fetch('/api/comunidad/upload-image', { method:'POST', credentials:'include', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Actualizar community local con la nueva URL
      setCommunity(prev => ({ ...prev, [type === 'banner' ? 'banner_url' : 'logo_url']: data.url }))
      setUploadMsg({ ok: true, text: `${type === 'banner' ? 'Banner' : 'Logo'} actualizado` })
    } catch(e) {
      setUploadMsg({ ok: false, text: e.message })
    }
    setUploading(null)
    setTimeout(() => setUploadMsg(null), 3000)
  }

  if (loading) return <Loader />

  const accessLabel  = { open:'Abierta', subs_only:'Solo subs', whitelist:'Lista blanca' }
  const platformIcon = { kick:'🟢', twitch:'🟣', youtube:'🔴' }
  const avatar       = user.steam_avatar || user.avatar_url || '/favicon.ico'

  return (
    <>
      <Head>
        <title>Mi Comunidad — LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; overflow-x:hidden; }
        a { text-decoration:none; color:inherit; }

        @keyframes fadeInUp   { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatY     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shine      { 0%{left:-100%} 20%{left:200%} 100%{left:200%} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <style jsx>{`
        /* ── SHELL ── */
        .shell { display:flex; min-height:100vh; }

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
        .main { margin-left:220px; flex:1; }

        /* ── BANNER ── */
        .banner-wrap {
          position:relative; height:200px; overflow:hidden;
          background:linear-gradient(135deg, rgba(220,38,38,.15) 0%, #0c0a09 100%);
        }
        .banner-img { width:100%; height:100%; object-fit:cover; opacity:.6; }
        .banner-overlay { position:absolute; inset:0; background:linear-gradient(to top, #0c0a09 0%, transparent 60%); }
        .banner-upload-btn {
          position:absolute; bottom:12px; right:16px; z-index:10;
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
          padding:8px 16px; background:rgba(0,0,0,.6); color:#9ca3af;
          border:1px solid rgba(255,255,255,.12); border-radius:2px; cursor:pointer; transition:all .2s;
        }
        .banner-upload-btn:hover { color:#f1f0ef; border-color:rgba(255,255,255,.3); }

        /* ── HERO INFO ── */
        .hero-info {
          padding:0 36px 24px; display:flex; align-items:flex-end; gap:20px;
          margin-top:-40px; position:relative; z-index:5;
        }
        .logo-wrap { position:relative; flex-shrink:0; }
        .community-logo {
          width:80px; height:80px; border-radius:8px; object-fit:cover;
          border:3px solid #0c0a09; background:#1a1410;
        }
        .logo-upload-btn {
          position:absolute; inset:0; border-radius:8px; background:rgba(0,0,0,.6);
          display:flex; align-items:center; justify-content:center;
          opacity:0; transition:opacity .2s; cursor:pointer; font-size:18px;
        }
        .logo-wrap:hover .logo-upload-btn { opacity:1; }
        .hero-text { flex:1; padding-bottom:4px; }
        .community-name { font-family:'Bebas Neue'; font-size:36px; letter-spacing:2px; line-height:1; }
        .community-tag  { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-top:4px; }
        .community-chips { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
        .chip { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:2px; font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#9ca3af; }

        /* ── TABS ── */
        .tabs { display:flex; gap:0; border-bottom:1px solid #1a1410; padding:0 36px; }
        .tab { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:12px 20px; color:#4b5563; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all .2s; }
        .tab:hover { color:#9ca3af; }
        .tab.active { color:#f1f0ef; border-bottom-color:#dc2626; }

        /* ── TAB CONTENT ── */
        .tab-content { padding:32px 36px; }

        /* ── INFO GRID ── */
        .info-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .info-item { background:#0f0d0b; border:1px solid #1a1410; border-radius:2px; padding:16px; }
        .info-key { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; margin-bottom:6px; }
        .info-val { font-size:14px; color:#f1f0ef; font-weight:500; }

        /* ── ACCIONES ── */
        .actions-row { display:flex; gap:12px; margin-top:24px; }
        .btn-primary { font-family:'Barlow Condensed'; font-size:13px; font-weight:900; letter-spacing:2px; text-transform:uppercase; padding:10px 24px; background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:8px; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
        .btn-primary:hover { background:#ef4444; }
        .btn-ghost { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:10px 20px; background:transparent; color:#6b7280; border:1px solid #1a1410; border-radius:2px; cursor:pointer; transition:all .2s; }
        .btn-ghost:hover { color:#f1f0ef; border-color:#374151; }

        /* ── ROSTER GRID (estilo JJK adaptado) ── */
        .roster-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
        .roster-title { font-family:'Bebas Neue'; font-size:28px; letter-spacing:2px; }
        .roster-count { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; }
        .roster-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:24px; }

        .member-card {
          background:rgba(15,13,11,0.9);
          border:1px solid rgba(255,255,255,.05);
          border-radius:16px;
          overflow:hidden;
          cursor:pointer;
          position:relative;
          height:240px;
          display:flex;
          flex-direction:column;
          transition:all .4s cubic-bezier(.34,1.56,.64,1);
          opacity:0;
          transform:translateY(30px);
          animation:fadeInUp .6s ease-out forwards;
        }
        .member-card:hover {
          transform:translateY(-10px) scale(1.02);
          border-color:rgba(255,255,255,.1);
        }

        .member-bg {
          position:absolute; inset:0; opacity:.2; z-index:0;
          background-size:cover; background-position:center top;
        }
        .member-bg::after {
          content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
          background:linear-gradient(to right,transparent,rgba(255,255,255,.1),transparent);
          transform:skewX(-20deg); animation:shine 6s infinite;
        }

        .member-sticker {
          position:absolute; top:12px; right:16px; width:110px; height:110px; z-index:20;
          pointer-events:none;
        }
        .member-sticker img {
          width:100%; height:100%; object-fit:cover; border-radius:50%;
          border:3px solid rgba(255,255,255,.15);
          filter:drop-shadow(0 8px 16px rgba(0,0,0,.6));
          animation:floatY 4s ease-in-out infinite;
        }

        .member-content {
          padding:20px; flex:1; display:flex; flex-direction:column;
          justify-content:flex-end; z-index:10; position:relative;
        }
        .member-name { font-family:'Bebas Neue'; font-size:22px; letter-spacing:1px; line-height:1.1; margin-bottom:2px; }
        .member-tier { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
        .member-stats { display:flex; gap:12px; margin-top:10px; }
        .member-stat { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:rgba(255,255,255,.4); }
        .member-stat span { color:rgba(255,255,255,.8); }

        /* ── EXPANDED CARD ── */
        .member-card.is-expanded {
          position:fixed; top:0; left:0; right:0; bottom:0;
          width:100vw; height:100vh; z-index:100;
          border-radius:0; cursor:default;
          flex-direction:row; align-items:center; justify-content:center;
          background:rgba(5,5,8,.96);
          backdrop-filter:blur(20px);
          border:none; overflow-y:auto;
          animation:none; opacity:1; transform:none;
        }
        .member-card.is-expanded:hover { transform:none; }
        .member-card.is-expanded .member-bg { opacity:.08; width:100%; height:100%; position:absolute; }
        .member-card.is-expanded .member-sticker {
          position:relative; top:auto; right:auto;
          width:35vw; max-width:360px; height:auto;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .member-card.is-expanded .member-sticker img {
          width:100%; height:auto; border-radius:16px;
          animation:none; border-width:4px;
        }
        .member-card.is-expanded .member-content {
          max-width:500px; padding:48px 40px; justify-content:center;
        }
        .member-card.is-expanded .member-name { font-size:52px; margin-bottom:8px; }
        .member-card.is-expanded .member-tier { font-size:16px; margin-bottom:24px; }
        .expanded-details { animation:fadeUp .5s ease .2s both; }
        .expanded-stat { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.06); }
        .expanded-stat-key { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; }
        .expanded-stat-val { font-family:'Barlow Condensed'; font-size:13px; font-weight:700; color:#9ca3af; }
        .close-btn {
          position:fixed; top:24px; right:28px; z-index:110;
          width:48px; height:48px; border-radius:50%; background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.1); color:white; font-size:22px;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all .25s; opacity:0; pointer-events:none;
        }
        .is-expanded .close-btn { opacity:1; pointer-events:auto; }
        .close-btn:hover { background:rgba(220,38,38,.2); color:#ef4444; transform:rotate(90deg); }

        /* ── UPLOAD MSG ── */
        .upload-msg { position:fixed; bottom:24px; right:24px; z-index:200; padding:12px 20px; border-radius:4px; font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:1px; animation:fadeInUp .3s ease; }
        .upload-msg.ok  { background:rgba(34,197,94,.15); border:1px solid rgba(34,197,94,.3); color:#22c55e; }
        .upload-msg.err { background:rgba(220,38,38,.15); border:1px solid rgba(220,38,38,.3); color:#ef4444; }

        .empty-roster { text-align:center; padding:60px 24px; color:#374151; font-family:'Barlow Condensed'; font-size:13px; letter-spacing:2px; text-transform:uppercase; }

        @media(max-width:960px) {
          .main { margin-left:0; }
          .sidebar { display:none; }
          .info-grid { grid-template-columns:1fr 1fr; }
          .member-card.is-expanded { flex-direction:column; justify-content:flex-start; }
          .member-card.is-expanded .member-sticker { width:100%; max-width:200px; margin-top:60px; }
        }
      `}</style>

      <div className="shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-logo">LlamaLeague</div>
          <nav className="sb-nav">
            <a href="/panel"             className="sb-item">Dashboard</a>
            <a href="/panel/comunidad"   className="sb-item active">Mi Comunidad</a>
            <a href="/panel/salas"       className="sb-item">Salas</a>
            <a href="/panel/comunidades" className="sb-item">Comunidades</a>
            <a href="/panel/ranking"     className="sb-item">Ranking</a>
            <a href="/panel/historial"   className="sb-item">Historial</a>
          </nav>
          <div className="sb-footer">
            <img src={avatar} alt="" className="sb-avatar" />
            <div>
              <div className="sb-name">{user.display_name}</div>
              <div className="sb-type">Streamer</div>
            </div>
            <a href="/api/auth/logout" className="sb-logout">✕</a>
          </div>
        </aside>

        <main className="main">

          {/* BANNER */}
          <div className="banner-wrap">
            {community.banner_url
              ? <img src={community.banner_url} alt="" className="banner-img" />
              : <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(220,38,38,.2) 0%,#0c0a09 100%)'}} />
            }
            <div className="banner-overlay" />
            <input ref={bannerRef} type="file" accept="image/*" style={{display:'none'}}
              onChange={e => handleUpload('banner', e.target.files[0])} />
            <button className="banner-upload-btn" onClick={() => bannerRef.current.click()}
              disabled={uploading === 'banner'}>
              {uploading === 'banner' ? 'Subiendo...' : '📷 Cambiar banner'}
            </button>
          </div>

          {/* HERO INFO */}
          <div className="hero-info">
            <div className="logo-wrap">
              <img
                src={community.logo_url || user.steam_avatar || avatar}
                alt="" className="community-logo"
              />
              <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e => handleUpload('logo', e.target.files[0])} />
              <div className="logo-upload-btn" onClick={() => logoRef.current.click()}>
                {uploading === 'logo' ? '⏳' : '📷'}
              </div>
            </div>
            <div className="hero-text">
              <div className="community-name">{community.name}</div>
              <div className="community-tag">/c/{community.tag}</div>
              <div className="community-chips">
                <span className="chip">{platformIcon[community.platform] ?? '🎮'} {community.platform}</span>
                <span className="chip">🔒 {accessLabel[community.access_mode]}</span>
                <span className="chip">👥 {members.length} miembros</span>
                <a href={community.channel_url} target="_blank" rel="noopener noreferrer" className="chip" style={{cursor:'pointer',color:'#dc2626'}}>
                  Ver canal →
                </a>
              </div>
            </div>
            <a href={`/comunidad/${community.tag}`} target="_blank"
              style={{fontFamily:'Barlow Condensed',fontSize:11,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#374151',paddingBottom:4}}>
              Página pública →
            </a>
          </div>

          {/* TABS */}
          <CommunityTabs
            community={community}
            members={members}
            expanded={expanded}
            setExpanded={setExpanded}
            accessLabel={accessLabel}
          />

          {/* ACCIONES */}
          <div className="tab-content" style={{paddingTop:0}}>
            <div className="actions-row">
              <a href="/panel/salas/nueva" className="btn-primary">+ Nueva sala</a>
              <a href={`/comunidad/${community.tag}`} target="_blank" className="btn-ghost">Ver página pública</a>
            </div>
          </div>

        </main>
      </div>

      {/* Upload feedback */}
      {uploadMsg && (
        <div className={`upload-msg ${uploadMsg.ok ? 'ok' : 'err'}`}>{uploadMsg.text}</div>
      )}
    </>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function CommunityTabs({ community, members, expanded, setExpanded, accessLabel }) {
  const [tab, setTab] = useState('roster')

  return (
    <>
      <div className="tabs">
        <div className={`tab ${tab === 'roster' ? 'active' : ''}`} onClick={() => setTab('roster')}>
          Roster ({members.length})
        </div>
        <div className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
          Detalles
        </div>
      </div>

      <div className="tab-content">
        {tab === 'roster' && (
          <RosterTab members={members} expanded={expanded} setExpanded={setExpanded} />
        )}
        {tab === 'info' && (
          <InfoTab community={community} accessLabel={accessLabel} />
        )}
      </div>
    </>
  )
}

// ─── ROSTER TAB ───────────────────────────────────────────────────────────────
function RosterTab({ members, expanded, setExpanded }) {
  const cardRefs = useRef({})

  const toggleCard = (id) => {
    setExpanded(expanded === id ? null : id)
    if (expanded !== id) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setExpanded(null); document.body.style.overflow = '' } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (members.length === 0) {
    return <div className="empty-roster">Sin miembros todavía — comparte el link de tu comunidad</div>
  }

  return (
    <>
      <div className="roster-header">
        <div className="roster-title">Jugadores</div>
        <div className="roster-count">{members.length} miembros activos</div>
      </div>

      <div className="roster-grid">
        {members.map((m, idx) => {
          const u        = m.user
          const color    = TIER_COLORS[u.tier] || '#dc2626'
          const isExp    = expanded === m.id
          const wr       = (u.wins + u.losses) > 0
            ? Math.round((u.wins / (u.wins + u.losses)) * 100) + '%'
            : '—'
          const imgSrc   = u.steam_avatar || u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.display_name}&backgroundColor=${color.replace('#','')}&textColor=ffffff`

          return (
            <div
              key={m.id}
              ref={el => cardRefs.current[m.id] = el}
              className={`member-card ${isExp ? 'is-expanded' : ''}`}
              style={{ animationDelay:`${idx * 0.08}s`, '--card-color': color }}
              onClick={() => !isExp && toggleCard(m.id)}
            >
              {/* Background gradient */}
              <div className="member-bg"
                style={{background:`linear-gradient(135deg, ${color}40, #0c0a09)`}} />

              {/* Avatar flotante */}
              <div className="member-sticker">
                <img src={imgSrc} alt={u.display_name}
                  style={isExp ? {} : {animationDelay:`${idx * 0.3}s`}} />
              </div>

              {/* Contenido */}
              <div className="member-content">
                <div className="member-name">{u.display_name}</div>
                <div className="member-tier" style={{color}}>{u.tier || 'Wawa'}</div>

                {!isExp && (
                  <div className="member-stats">
                    <div className="member-stat"><span>{u.points || 0}</span> pts</div>
                    <div className="member-stat"><span>{u.wins || 0}</span>W</div>
                    <div className="member-stat"><span>{u.mmr_estimate || '?'}</span> mmr</div>
                  </div>
                )}

                {isExp && (
                  <div className="expanded-details">
                    {[
                      { k:'País',     v: u.country || '—'        },
                      { k:'Tier',     v: u.tier    || 'Wawa'      },
                      { k:'Puntos',   v: u.points  || 0           },
                      { k:'MMR',      v: (u.mmr_estimate || 0) + ' MMR' },
                      { k:'Victorias',v: u.wins    || 0           },
                      { k:'Derrotas', v: u.losses  || 0           },
                      { k:'Win Rate', v: wr                        },
                      { k:'Steam',    v: u.steam_name || 'No vinculado' },
                    ].map(row => (
                      <div className="expanded-stat" key={row.k}>
                        <span className="expanded-stat-key">{row.k}</span>
                        <span className="expanded-stat-val" style={row.k==='Tier'?{color}:{}}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón cerrar (solo visible expandido) */}
              <button className="close-btn" onClick={e => { e.stopPropagation(); toggleCard(m.id) }}>×</button>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── INFO TAB ─────────────────────────────────────────────────────────────────
function InfoTab({ community, accessLabel }) {
  return (
    <div className="info-grid">
      {[
        { k:'Nombre',        v: community.name },
        { k:'Tag',           v: `/c/${community.tag}` },
        { k:'Plataforma',    v: community.platform },
        { k:'Modo de acceso',v: accessLabel[community.access_mode] },
        { k:'Canal',         v: community.channel_url },
        { k:'Creada',        v: new Date(community.created_at).toLocaleDateString('es-PE') },
      ].map(row => (
        <div className="info-item" key={row.k}>
          <div className="info-key">{row.k}</div>
          <div className="info-val">{row.v}</div>
        </div>
      ))}
      {community.description && (
        <div className="info-item" style={{gridColumn:'1/-1'}}>
          <div className="info-key">Descripción</div>
          <div className="info-val">{community.description}</div>
        </div>
      )}
    </div>
  )
}

function Loader() {
  return (
    <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span>
    </div>
  )
}
