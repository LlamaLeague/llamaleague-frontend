// pages/panel/comunidad/index.js
// Vista de la comunidad del streamer — editar, ver stats, gestionar roster

import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function MiComunidad() {
  const router = useRouter()
  const [user,      setUser]      = useState(null)
  const [community, setCommunity] = useState(null)
  const [roster,    setRoster]    = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(async ({ user }) => {
        if (!user)                    return router.replace('/')
        if (!user.type)               return router.replace('/onboarding')
        if (user.type !== 'streamer') return router.replace('/panel')
        setUser(user)

        const res  = await fetch('/api/comunidad/mia')
        const data = await res.json()
        if (!data.community) return router.replace('/panel/comunidad/nueva')
        setCommunity(data.community)
        setLoading(false)
      })
  }, [])

  if (loading) return <Loader />

  const accessLabel = { open: 'Abierta', subs_only: 'Solo subs', whitelist: 'Lista blanca' }
  const platformIcon = { kick: '🟢', twitch: '🟣', youtube: '🔴' }

  return (
    <>
      <Head>
        <title>Mi Comunidad — LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; }
        a { text-decoration:none; color:inherit; }
      `}</style>

      <style jsx>{`
        .shell { display:flex; min-height:100vh; }
        .sidebar {
          width:220px; background:#080605;
          border-right:1px solid rgba(255,255,255,.04);
          display:flex; flex-direction:column;
          position:fixed; top:0; left:0; bottom:0; z-index:50;
        }
        .sb-logo { padding:22px 24px 18px; font-family:'Bebas Neue'; font-size:20px; letter-spacing:4px; color:#dc2626; border-bottom:1px solid rgba(255,255,255,.04); }
        .sb-nav { padding:16px 12px; flex:1; }
        .sb-item {
          display:flex; align-items:center; gap:10px;
          padding:10px; border-radius:2px; margin-bottom:2px;
          font-family:'Barlow Condensed'; font-size:13px; font-weight:700;
          letter-spacing:1px; text-transform:uppercase; color:#4b5563; transition:all .15s;
        }
        .sb-item:hover { color:#f1f0ef; background:rgba(255,255,255,.03); }
        .sb-item.active { color:#f1f0ef; background:rgba(220,38,38,.08); border-left:2px solid #dc2626; }
        .sb-footer { padding:16px; border-top:1px solid rgba(255,255,255,.04); display:flex; align-items:center; gap:10px; }
        .sb-avatar { width:30px; height:30px; border-radius:50%; object-fit:cover; }
        .sb-name { font-size:13px; font-weight:600; }
        .sb-type { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; }
        .sb-logout { margin-left:auto; font-size:12px; color:#374151; transition:color .2s; }
        .sb-logout:hover { color:#dc2626; }

        .main { margin-left:220px; flex:1; padding:32px 36px; max-width:calc(220px + 900px); }
        .page-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; }
        .page-tag { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-bottom:4px; }
        .page-title { font-family:'Bebas Neue'; font-size:36px; letter-spacing:2px; }

        .card { background:#0f0d0b; border:1px solid #1a1410; border-radius:3px; overflow:hidden; margin-bottom:16px; }
        .card-header { padding:14px 18px; border-bottom:1px solid #1a1410; display:flex; align-items:center; justify-content:space-between; }
        .card-title { font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#9ca3af; }
        .card-body { padding:20px 18px; }

        .info-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .info-item { }
        .info-key { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; margin-bottom:6px; }
        .info-val { font-size:14px; color:#f1f0ef; font-weight:500; }

        .community-hero {
          background: linear-gradient(135deg, rgba(220,38,38,.08), rgba(12,10,9,0)), #0f0d0b;
          border:1px solid rgba(220,38,38,.15); border-radius:3px;
          padding:24px 24px; margin-bottom:16px;
          display:flex; align-items:center; gap:20px;
        }
        .community-avatar {
          width:64px; height:64px; border-radius:50%;
          object-fit:cover; border:2px solid rgba(220,38,38,.3); flex-shrink:0;
        }
        .community-name { font-family:'Bebas Neue'; font-size:32px; letter-spacing:2px; margin-bottom:4px; }
        .community-tag { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#dc2626; }
        .community-desc { font-size:13px; color:#6b7280; margin-top:6px; line-height:1.6; }

        .chip {
          display:inline-flex; align-items:center; gap:6px; padding:4px 12px;
          background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
          border-radius:2px; font-family:'Barlow Condensed'; font-size:11px;
          font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#9ca3af;
          margin-right:8px; margin-top:8px;
        }

        .btn-primary {
          font-family:'Barlow Condensed'; font-size:13px; font-weight:900; letter-spacing:2px; text-transform:uppercase;
          padding:10px 24px; background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer;
          transition:all .2s; display:inline-flex; align-items:center; gap:8px;
          clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
        }
        .btn-primary:hover { background:#ef4444; }

        .public-link {
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px;
          text-transform:uppercase; color:#dc2626; transition:color .2s;
        }
        .public-link:hover { color:#ef4444; }
      `}</style>

      <div className="shell">
        <aside className="sidebar">
          <div className="sb-logo">LlamaLeague</div>
          <nav className="sb-nav">
            <a href="/panel"           className="sb-item">Dashboard</a>
            <a href="/panel/comunidad" className="sb-item active">Mi Comunidad</a>
            <a href="/panel/salas"     className="sb-item">Salas</a>
            <a href="/panel/ranking"   className="sb-item">Ranking</a>
          </nav>
          <div className="sb-footer">
            <img src={user.avatar_url} alt="" className="sb-avatar" />
            <div>
              <div className="sb-name">{user.username}</div>
              <div className="sb-type">Streamer</div>
            </div>
            <a href="/api/auth/logout" className="sb-logout">✕</a>
          </div>
        </aside>

        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-tag">Streamer · Comunidad</div>
              <h1 className="page-title">Mi Comunidad</h1>
            </div>
            <a href={`/comunidad/${community.tag}`} className="public-link" target="_blank">
              Ver página pública →
            </a>
          </div>

          {/* Hero */}
          <div className="community-hero">
            <img src={user.avatar_url} alt="" className="community-avatar" />
            <div>
              <div className="community-name">{community.name}</div>
              <div className="community-tag">/c/{community.tag}</div>
              {community.description && <div className="community-desc">{community.description}</div>}
              <div style={{marginTop:8}}>
                <span className="chip">{platformIcon[community.platform] ?? '🎮'} {community.platform}</span>
                <span className="chip">🔒 {accessLabel[community.access_mode]}</span>
                <a href={community.channel_url} target="_blank" rel="noopener noreferrer" className="chip" style={{cursor:'pointer'}}>
                  Ver canal →
                </a>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Detalles</span>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-key">Nombre</div>
                  <div className="info-val">{community.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-key">Tag</div>
                  <div className="info-val">{community.tag}</div>
                </div>
                <div className="info-item">
                  <div className="info-key">Plataforma</div>
                  <div className="info-val">{community.platform}</div>
                </div>
                <div className="info-item">
                  <div className="info-key">Modo de acceso</div>
                  <div className="info-val">{accessLabel[community.access_mode]}</div>
                </div>
                <div className="info-item">
                  <div className="info-key">Canal</div>
                  <div className="info-val">
                    <a href={community.channel_url} target="_blank" rel="noopener noreferrer" style={{color:'#dc2626'}}>
                      {community.channel_url}
                    </a>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-key">Creada</div>
                  <div className="info-val">{new Date(community.created_at).toLocaleDateString('es-PE')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Acciones</span>
            </div>
            <div className="card-body" style={{display:'flex', gap:12}}>
              <a href="/panel/salas/nueva" className="btn-primary">+ Nueva sala</a>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

function Loader() {
  return (
    <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span>
    </div>
  )
}
