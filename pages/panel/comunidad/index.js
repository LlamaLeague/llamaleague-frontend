// pages/panel/comunidad/index.js
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

const TIER_COLORS = {
  'Wawa':'#6b7280','Kawsay':'#22c55e','Ayllu':'#3b82f6','Sinchi':'#8b5cf6',
  'Apu':'#f59e0b','Willka':'#ef4444','Inti':'#f97316','Supay':'#dc2626',
  'Wiñay':'#7c3aed','Qhapaq':'#0891b2','Apukuna':'#be185d',
  'Hatun Kuraka':'#854d0e','Inmortal':'#fbbf24',
}

export default function MiComunidad() {
  const router = useRouter()
  const [user,      setUser]      = useState(null)
  const [community, setCommunity] = useState(null)
  const [members,   setMembers]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('roster')
  const [expanded,  setExpanded]  = useState(null)
  const [uploading, setUploading] = useState(null)
  const [uploadMsg, setUploadMsg] = useState(null)
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

  const handleUpload = async (type, file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg({ ok: false, text: 'La imagen no puede superar 5MB' })
      setTimeout(() => setUploadMsg(null), 3000)
      return
    }
    setUploading(type)
    setUploadMsg(null)
    try {
      const fileBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch('/api/comunidad/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, fileBase64, mimeType: file.type, fileName: file.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCommunity(prev => ({ ...prev, [type === 'banner' ? 'banner_url' : 'logo_url']: data.url }))
      setUploadMsg({ ok: true, text: `${type === 'banner' ? 'Banner' : 'Logo'} actualizado ✓` })
    } catch(e) {
      setUploadMsg({ ok: false, text: e.message })
    }
    setUploading(null)
    setTimeout(() => setUploadMsg(null), 3000)
  }

  const toggleExpand = (id) => {
    const next = expanded === id ? null : id
    setExpanded(next)
    document.body.style.overflow = next ? 'hidden' : ''
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setExpanded(null); document.body.style.overflow = '' } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span>
    </div>
  )

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

        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shine    { 0%{left:-100%} 20%{left:200%} 100%{left:200%} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        /* SHELL */
        .ll-shell { display:flex; min-height:100vh; }

        /* SIDEBAR */
        .ll-sidebar { width:220px; background:#080605; border-right:1px solid rgba(255,255,255,.04); display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0; z-index:50; }
        .ll-sb-logo { padding:22px 24px 18px; font-family:'Bebas Neue'; font-size:20px; letter-spacing:4px; color:#dc2626; border-bottom:1px solid rgba(255,255,255,.04); }
        .ll-sb-nav  { padding:16px 12px; flex:1; }
        .ll-sb-item { display:flex; align-items:center; gap:10px; padding:10px; border-radius:2px; margin-bottom:2px; font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#4b5563; transition:all .15s; }
        .ll-sb-item:hover  { color:#f1f0ef; background:rgba(255,255,255,.03); }
        .ll-sb-item.active { color:#f1f0ef; background:rgba(220,38,38,.08); border-left:2px solid #dc2626; }
        .ll-sb-footer { padding:16px; border-top:1px solid rgba(255,255,255,.04); display:flex; align-items:center; gap:10px; }
        .ll-sb-av   { width:30px; height:30px; border-radius:50%; object-fit:cover; }
        .ll-sb-name { font-size:13px; font-weight:600; }
        .ll-sb-type { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; }
        .ll-sb-out  { margin-left:auto; font-size:12px; color:#374151; transition:color .2s; }
        .ll-sb-out:hover { color:#dc2626; }

        /* MAIN */
        .ll-main { margin-left:220px; flex:1; }

        /* BANNER */
        .ll-banner {
          position:relative; height:220px; overflow:hidden;
          background:linear-gradient(135deg, rgba(220,38,38,.2) 0%, rgba(12,10,9,1) 100%);
        }
        .ll-banner-img { width:100%; height:100%; object-fit:cover; opacity:.55; }
        .ll-banner-grad { position:absolute; inset:0; background:linear-gradient(to top, #0c0a09 0%, transparent 60%); }
        .ll-banner-btn {
          position:absolute; bottom:14px; right:18px; z-index:10;
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
          padding:8px 16px; background:rgba(0,0,0,.65); color:#9ca3af;
          border:1px solid rgba(255,255,255,.15); border-radius:2px; cursor:pointer; transition:all .2s;
          display:inline-flex; align-items:center; gap:6px;
        }
        .ll-banner-btn:hover { color:#f1f0ef; border-color:rgba(255,255,255,.35); }

        /* HERO */
        .ll-hero { padding:0 36px 20px; display:flex; align-items:flex-end; gap:20px; margin-top:-48px; position:relative; z-index:5; }
        .ll-logo-wrap { position:relative; flex-shrink:0; }
        .ll-logo {
          width:84px; height:84px; border-radius:10px; object-fit:cover;
          border:3px solid #0c0a09; background:#1a1410; display:block;
        }
        .ll-logo-overlay {
          position:absolute; inset:0; border-radius:10px; background:rgba(0,0,0,.65);
          display:flex; align-items:center; justify-content:center;
          opacity:0; transition:opacity .2s; cursor:pointer; font-size:20px;
        }
        .ll-logo-wrap:hover .ll-logo-overlay { opacity:1; }
        .ll-hero-text  { flex:1; padding-bottom:4px; }
        .ll-com-name   { font-family:'Bebas Neue'; font-size:38px; letter-spacing:2px; line-height:1; }
        .ll-com-tag    { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-top:4px; }
        .ll-chips      { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
        .ll-chip       { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:2px; font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#9ca3af; }
        .ll-chip-link  { cursor:pointer; transition:color .2s; }
        .ll-chip-link:hover { color:#dc2626; }
        .ll-pub-link { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#374151; padding-bottom:4px; transition:color .2s; }
        .ll-pub-link:hover { color:#dc2626; }

        /* TABS */
        .ll-tabs { display:flex; border-bottom:1px solid #1a1410; padding:0 36px; margin-bottom:0; }
        .ll-tab  { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:12px 20px; color:#4b5563; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all .2s; }
        .ll-tab:hover  { color:#9ca3af; }
        .ll-tab.active { color:#f1f0ef; border-bottom-color:#dc2626; }

        /* TAB CONTENT */
        .ll-tab-content { padding:32px 36px; }

        /* ROSTER */
        .ll-roster-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
        .ll-roster-title { font-family:'Bebas Neue'; font-size:28px; letter-spacing:2px; }
        .ll-roster-count { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; }
        .ll-roster-grid  { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:20px; }
        .ll-empty { text-align:center; padding:60px 24px; color:#374151; font-family:'Barlow Condensed'; font-size:13px; letter-spacing:2px; text-transform:uppercase; }

        /* MEMBER CARD */
        .ll-card {
          background:rgba(15,13,11,.95);
          border:1px solid rgba(255,255,255,.06);
          border-radius:16px;
          overflow:hidden;
          cursor:pointer;
          position:relative;
          height:230px;
          display:flex;
          flex-direction:column;
          transition:all .4s cubic-bezier(.34,1.56,.64,1);
          opacity:0;
          transform:translateY(30px);
          animation:fadeInUp .5s ease-out forwards;
        }
        .ll-card:hover { transform:translateY(-10px) scale(1.02); border-color:rgba(255,255,255,.12); }
        .ll-card-bg {
          position:absolute; inset:0; z-index:0;
          background-size:cover; background-position:center top; opacity:.2;
        }
        .ll-card-bg::after {
          content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
          background:linear-gradient(to right,transparent,rgba(255,255,255,.1),transparent);
          transform:skewX(-20deg); animation:shine 7s infinite;
        }
        .ll-card-sticker {
          position:absolute; top:10px; right:14px; width:100px; height:100px; z-index:20; pointer-events:none;
        }
        .ll-card-sticker img {
          width:100%; height:100%; object-fit:cover; border-radius:50%;
          border:3px solid rgba(255,255,255,.15);
          filter:drop-shadow(0 6px 12px rgba(0,0,0,.6));
          animation:floatY 4s ease-in-out infinite;
        }
        .ll-card-body {
          padding:18px; flex:1; display:flex; flex-direction:column;
          justify-content:flex-end; z-index:10; position:relative;
        }
        .ll-card-name   { font-family:'Bebas Neue'; font-size:22px; letter-spacing:1px; line-height:1.1; margin-bottom:2px; }
        .ll-card-tier   { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
        .ll-card-stats  { display:flex; gap:12px; margin-top:8px; }
        .ll-card-stat   { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:rgba(255,255,255,.35); }
        .ll-card-stat span { color:rgba(255,255,255,.75); }

        /* EXPANDED */
        .ll-card.is-exp {
          position:fixed; top:0; left:0; right:0; bottom:0;
          width:100vw; height:100vh; z-index:200;
          border-radius:0; cursor:default;
          flex-direction:row; align-items:center; justify-content:center;
          background:rgba(5,5,8,.97);
          backdrop-filter:blur(24px);
          border:none; overflow-y:auto;
          animation:none; opacity:1; transform:none;
        }
        .ll-card.is-exp:hover { transform:none; }
        .ll-card.is-exp .ll-card-bg { opacity:.06; width:100%; height:100%; position:absolute; }
        .ll-card.is-exp .ll-card-sticker {
          position:relative; top:auto; right:auto; flex-shrink:0;
          width:32vw; max-width:320px; height:auto;
        }
        .ll-card.is-exp .ll-card-sticker img {
          width:100%; height:auto; border-radius:14px; animation:none; border-width:4px;
        }
        .ll-card.is-exp .ll-card-body { max-width:480px; padding:48px 36px; justify-content:center; }
        .ll-card.is-exp .ll-card-name { font-size:52px; margin-bottom:8px; }
        .ll-card.is-exp .ll-card-tier { font-size:15px; margin-bottom:20px; }
        .ll-exp-details { animation:fadeUp .4s ease .15s both; }
        .ll-exp-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.05); }
        .ll-exp-key { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; }
        .ll-exp-val { font-family:'Barlow Condensed'; font-size:13px; font-weight:700; color:#9ca3af; }
        .ll-close {
          position:fixed; top:24px; right:28px; z-index:210;
          width:48px; height:48px; border-radius:50%;
          background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
          color:white; font-size:22px; display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all .25s; opacity:0; pointer-events:none;
        }
        .ll-card.is-exp .ll-close { opacity:1; pointer-events:auto; }
        .ll-close:hover { background:rgba(220,38,38,.2); color:#ef4444; transform:rotate(90deg); }

        /* INFO GRID */
        .ll-info-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .ll-info-item { background:#0f0d0b; border:1px solid #1a1410; border-radius:3px; padding:16px; }
        .ll-info-key  { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; margin-bottom:6px; }
        .ll-info-val  { font-size:13px; color:#f1f0ef; font-weight:500; word-break:break-all; }

        /* ACCIONES */
        .ll-actions { display:flex; gap:12px; margin-top:24px; padding:0 36px 32px; }
        .ll-btn-primary { font-family:'Barlow Condensed'; font-size:13px; font-weight:900; letter-spacing:2px; text-transform:uppercase; padding:10px 24px; background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:8px; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
        .ll-btn-primary:hover { background:#ef4444; }
        .ll-btn-ghost { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:10px 20px; background:transparent; color:#6b7280; border:1px solid #1a1410; border-radius:2px; cursor:pointer; transition:all .2s; }
        .ll-btn-ghost:hover { color:#f1f0ef; border-color:#374151; }

        /* UPLOAD TOAST */
        .ll-toast { position:fixed; bottom:24px; right:24px; z-index:300; padding:12px 20px; border-radius:4px; font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:1px; animation:fadeUp .3s ease; }
        .ll-toast.ok  { background:rgba(34,197,94,.15); border:1px solid rgba(34,197,94,.3); color:#22c55e; }
        .ll-toast.err { background:rgba(220,38,38,.15); border:1px solid rgba(220,38,38,.3); color:#ef4444; }

        @media(max-width:960px) {
          .ll-main     { margin-left:0; }
          .ll-sidebar  { display:none; }
          .ll-info-grid { grid-template-columns:1fr 1fr; }
          .ll-card.is-exp { flex-direction:column; justify-content:flex-start; }
          .ll-card.is-exp .ll-card-sticker { width:160px; margin-top:60px; }
          .ll-hero { padding:0 16px 16px; }
          .ll-tab-content { padding:24px 16px; }
          .ll-actions { padding:0 16px 24px; }
        }
      `}</style>

      <div className="ll-shell">
        {/* SIDEBAR */}
        <aside className="ll-sidebar">
          <div className="ll-sb-logo">LlamaLeague</div>
          <nav className="ll-sb-nav">
            {[
              { href:'/panel',             label:'Dashboard'    },
              { href:'/panel/comunidad',   label:'Mi Comunidad', active:true },
              { href:'/panel/salas',       label:'Salas'        },
              { href:'/panel/comunidades', label:'Comunidades'  },
              { href:'/panel/ranking',     label:'Ranking'      },
              { href:'/panel/historial',   label:'Historial'    },
            ].map(n => (
              <a key={n.href} href={n.href} className={`ll-sb-item ${n.active ? 'active' : ''}`}>{n.label}</a>
            ))}
          </nav>
          <div className="ll-sb-footer">
            <img src={avatar} alt="" className="ll-sb-av" />
            <div>
              <div className="ll-sb-name">{user.display_name}</div>
              <div className="ll-sb-type">Streamer</div>
            </div>
            <a href="/api/auth/logout" className="ll-sb-out">✕</a>
          </div>
        </aside>

        <main className="ll-main">

          {/* BANNER */}
          <div className="ll-banner">
            {community.banner_url
              ? <img src={community.banner_url} alt="" className="ll-banner-img" />
              : null
            }
            <div className="ll-banner-grad" />
            <input ref={bannerRef} type="file" accept="image/*" style={{display:'none'}}
              onChange={e => handleUpload('banner', e.target.files[0])} />
            <button className="ll-banner-btn" onClick={() => bannerRef.current.click()}
              disabled={uploading === 'banner'}>
              📷 {uploading === 'banner' ? 'Subiendo...' : 'Cambiar banner'}
            </button>
          </div>

          {/* HERO */}
          <div className="ll-hero">
            <div className="ll-logo-wrap">
              <img src={community.logo_url || avatar} alt="" className="ll-logo" />
              <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e => handleUpload('logo', e.target.files[0])} />
              <div className="ll-logo-overlay" onClick={() => logoRef.current.click()}>
                {uploading === 'logo' ? '⏳' : '📷'}
              </div>
            </div>
            <div className="ll-hero-text">
              <div className="ll-com-name">{community.name}</div>
              <div className="ll-com-tag">/c/{community.tag}</div>
              <div className="ll-chips">
                <span className="ll-chip">{platformIcon[community.platform] ?? '🎮'} {community.platform}</span>
                <span className="ll-chip">🔒 {accessLabel[community.access_mode]}</span>
                <span className="ll-chip">👥 {members.length} miembros</span>
                <a href={community.channel_url} target="_blank" rel="noopener noreferrer"
                  className="ll-chip ll-chip-link">Ver canal →</a>
              </div>
            </div>
            <a href={`/comunidad/${community.tag}`} target="_blank" className="ll-pub-link">
              Página pública →
            </a>
          </div>

          {/* TABS */}
          <div className="ll-tabs">
            <div className={`ll-tab ${tab === 'roster' ? 'active' : ''}`} onClick={() => setTab('roster')}>
              Roster ({members.length})
            </div>
            <div className={`ll-tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
              Detalles
            </div>
          </div>

          {/* TAB: ROSTER */}
          {tab === 'roster' && (
            <div className="ll-tab-content">
              <div className="ll-roster-hd">
                <div className="ll-roster-title">Jugadores</div>
                <div className="ll-roster-count">{members.length} miembros activos</div>
              </div>

              {members.length === 0 ? (
                <div className="ll-empty">
                  Sin miembros todavía — comparte el link de tu comunidad
                </div>
              ) : (
                <div className="ll-roster-grid">
                  {members.map((m, idx) => {
                    const u      = m.user
                    const color  = TIER_COLORS[u?.tier] || '#dc2626'
                    const isExp  = expanded === m.id
                    const wr     = (u?.wins + u?.losses) > 0
                      ? Math.round((u.wins / (u.wins + u.losses)) * 100) + '%' : '—'
                    const imgSrc = u?.steam_avatar || u?.avatar_url
                      || `https://api.dicebear.com/7.x/initials/svg?seed=${u?.display_name}&backgroundColor=${color.replace('#','')}&textColor=ffffff`

                    return (
                      <div
                        key={m.id}
                        className={`ll-card ${isExp ? 'is-exp' : ''}`}
                        style={{ animationDelay:`${idx * 0.08}s` }}
                        onClick={() => !isExp && toggleExpand(m.id)}
                        onMouseEnter={e => {
                          if (!isExp) e.currentTarget.style.boxShadow = `0 20px 40px -10px ${color}55`
                        }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '' }}
                      >
                        <div className="ll-card-bg"
                          style={{background:`linear-gradient(135deg,${color}50 0%,#0c0a09 100%)`}} />

                        <div className="ll-card-sticker">
                          <img src={imgSrc} alt={u?.display_name}
                            style={{animationDelay:`${idx * 0.25}s`}} />
                        </div>

                        <div className="ll-card-body">
                          <div className="ll-card-name">{u?.display_name}</div>
                          <div className="ll-card-tier" style={{color}}>{u?.tier || 'Wawa'}</div>

                          {!isExp && (
                            <div className="ll-card-stats">
                              <div className="ll-card-stat"><span>{u?.points || 0}</span> pts</div>
                              <div className="ll-card-stat"><span>{u?.wins || 0}</span>W</div>
                              <div className="ll-card-stat"><span>{u?.mmr_estimate || '?'}</span> mmr</div>
                            </div>
                          )}

                          {isExp && (
                            <div className="ll-exp-details">
                              {[
                                { k:'País',      v: u?.country || '—' },
                                { k:'Tier',      v: u?.tier || 'Wawa', color },
                                { k:'Puntos',    v: u?.points || 0 },
                                { k:'MMR',       v: `${u?.mmr_estimate || 0} MMR` },
                                { k:'Victorias', v: u?.wins || 0 },
                                { k:'Derrotas',  v: u?.losses || 0 },
                                { k:'Win Rate',  v: wr },
                                { k:'Steam',     v: u?.steam_name || 'No vinculado' },
                              ].map(row => (
                                <div className="ll-exp-row" key={row.k}>
                                  <span className="ll-exp-key">{row.k}</span>
                                  <span className="ll-exp-val" style={row.color ? {color:row.color} : {}}>{row.v}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button className="ll-close"
                          onClick={e => { e.stopPropagation(); toggleExpand(m.id) }}>
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: DETALLES */}
          {tab === 'info' && (
            <div className="ll-tab-content">
              <div className="ll-info-grid">
                {[
                  { k:'Nombre',        v: community.name },
                  { k:'Tag',           v: `/c/${community.tag}` },
                  { k:'Plataforma',    v: community.platform },
                  { k:'Modo acceso',   v: accessLabel[community.access_mode] },
                  { k:'Canal',         v: community.channel_url },
                  { k:'Creada',        v: new Date(community.created_at).toLocaleDateString('es-PE') },
                ].map(row => (
                  <div className="ll-info-item" key={row.k}>
                    <div className="ll-info-key">{row.k}</div>
                    <div className="ll-info-val">{row.v}</div>
                  </div>
                ))}
                {community.description && (
                  <div className="ll-info-item" style={{gridColumn:'1/-1'}}>
                    <div className="ll-info-key">Descripción</div>
                    <div className="ll-info-val">{community.description}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACCIONES */}
          <div className="ll-actions">
            <a href="/panel/salas/nueva" className="ll-btn-primary">+ Nueva sala</a>
            <a href={`/comunidad/${community.tag}`} target="_blank" className="ll-btn-ghost">
              Ver página pública
            </a>
          </div>

        </main>
      </div>

      {uploadMsg && (
        <div className={`ll-toast ${uploadMsg.ok ? 'ok' : 'err'}`}>{uploadMsg.text}</div>
      )}
    </>
  )
}
