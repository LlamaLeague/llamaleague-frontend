// pages/panel.js
// Panel principal post-login.
// Se adapta segun user.type: 'player' | 'streamer'

import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

// ─── Hook de usuario ──────────────────────────────────────────────────────────
function useUser() {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => {
        if (!user)       return router.replace('/')
        if (!user.type)  return router.replace('/onboarding')
        setUser(user)
        setLoading(false)
      })
  }, [])

  return { user, loading }
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Panel() {
  const { user, loading } = useUser()

  if (loading) return <Loader />
  if (!user)   return null

  return (
    <>
      <Head>
        <title>Panel — LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <Styles />

      <div className="shell">
        <Sidebar user={user} />
        <main className="main">
          {user.type === 'streamer'
            ? <StreamerPanel user={user} />
            : <PlayerPanel   user={user} />
          }
        </main>
      </div>
    </>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ user }) {
  const router   = useRouter()
  const isStream = user.type === 'streamer'

  const nav = isStream
    ? [
        { href:'/panel',              label:'Dashboard'    },
        { href:'/panel/comunidad',    label:'Mi Comunidad' },
        { href:'/panel/salas',        label:'Salas'        },
        { href:'/panel/ranking',      label:'Ranking'      },
        { href:'/panel/copa',         label:'Copa'         },
      ]
    : [
        { href:'/panel',              label:'Dashboard'    },
        { href:'/panel/comunidades',  label:'Comunidades'  },
        { href:'/panel/ranking',      label:'Mi Ranking'   },
        { href:'/panel/historial',    label:'Historial'    },
      ]

  return (
    <aside className="sidebar">
      <div className="sb-logo">LlamaLeague</div>

      <nav className="sb-nav">
        <div className="sb-section-label">Menu</div>
        {nav.map(n => (
          <a
            key={n.href}
            href={n.href}
            className={`sb-item ${router.pathname === n.href ? 'active' : ''}`}
          >
            <span className="sb-item-bar" />
            {n.label}
          </a>
        ))}
      </nav>

      <div className="sb-footer">
        <img src={user.avatar_url} alt="" className="sb-avatar" />
        <div>
          <div className="sb-name">{user.username}</div>
          <div className="sb-type">{user.type === 'streamer' ? 'Streamer' : 'Jugador'}</div>
        </div>
        <a href="https://llamaleague-api.onrender.com/api/auth/logout" className="sb-logout" title="Cerrar sesion">✕</a>
      </div>
    </aside>
  )
}

// ─── PANEL STREAMER ───────────────────────────────────────────────────────────
function StreamerPanel({ user }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    apiFetch('/api/panel/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => setStats({}))
  }, [])

  return (
    <div className="panel-content">
      <div className="page-header">
        <div>
          <div className="page-tag">Streamer</div>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <a href="/panel/salas/nueva" className="btn-primary">
          + Nueva sala
        </a>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {[
          { label:'Salas este mes', value: stats?.salas_mes    ?? '—', color:'red'    },
          { label:'Jugadores activos', value: stats?.jugadores ?? '—', color:'amber'  },
          { label:'Victorias Radiant', value: stats?.rad_wins  ?? '—', color:'green'  },
          { label:'Victorias Dire',    value: stats?.dire_wins ?? '—', color:'blue'   },
        ].map(k => (
          <div key={k.label} className={`kpi kpi-${k.color}`}>
            <div className="kpi-val">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Dos columnas */}
      <div className="two-col">
        {/* Ultimas salas */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Ultimas salas</span>
            <a href="/panel/salas" className="card-link">Ver todas →</a>
          </div>
          <EmptyState
            icon="🎮"
            title="Sin salas todavia"
            desc="Crea tu primera sala para empezar a jugar con tu comunidad."
            action={{ href:'/panel/salas/nueva', label:'Crear sala' }}
          />
        </div>

        {/* Top jugadores */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top jugadores</span>
            <a href="/panel/ranking" className="card-link">Ver ranking →</a>
          </div>
          <EmptyState
            icon="🏆"
            title="Sin datos aun"
            desc="El ranking se construye automaticamente con cada sala jugada."
          />
        </div>
      </div>

      {/* Setup checklist */}
      <SetupChecklist user={user} />
    </div>
  )
}

// ─── PANEL JUGADOR ────────────────────────────────────────────────────────────
function PlayerPanel({ user }) {
  return (
    <div className="panel-content">
      <div className="page-header">
        <div>
          <div className="page-tag">Jugador</div>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <a href="/panel/comunidades" className="btn-primary">
          Explorar comunidades
        </a>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {[
          { label:'Partidas jugadas', value:'0',    color:'red'   },
          { label:'Victorias',        value:'0',    color:'green' },
          { label:'Winrate',          value:'—',    color:'amber' },
          { label:'LlamaCoins',       value:'0',    color:'blue'  },
        ].map(k => (
          <div key={k.label} className={`kpi kpi-${k.color}`}>
            <div className="kpi-val">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        {/* Mis comunidades */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Mis comunidades</span>
            <a href="/panel/comunidades" className="card-link">Explorar →</a>
          </div>
          <EmptyState
            icon="👥"
            title="Sin comunidades"
            desc="Unete a la comunidad de tu streamer favorito para jugar inhouses."
            action={{ href:'/panel/comunidades', label:'Explorar comunidades' }}
          />
        </div>

        {/* Historial */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Ultimas partidas</span>
            <a href="/panel/historial" className="card-link">Ver todo →</a>
          </div>
          <EmptyState
            icon="📋"
            title="Sin partidas"
            desc="Tu historial aparece aqui despues de tu primera sala."
          />
        </div>
      </div>
    </div>
  )
}

// ─── CHECKLIST DE SETUP (solo streamer) ───────────────────────────────────────
function SetupChecklist({ user }) {
  const steps = [
    { id:'account',   label:'Cuenta creada con Steam',         done: true  },
    { id:'type',      label:'Rol configurado como Streamer',   done: true  },
    { id:'community', label:'Crear tu comunidad',              done: false, href:'/panel/comunidad/nueva' },
    { id:'sala',      label:'Crear tu primera sala',           done: false, href:'/panel/salas/nueva'     },
  ]
  const pct = Math.round(steps.filter(s => s.done).length / steps.length * 100)

  return (
    <div className="card" style={{marginTop:0}}>
      <div className="card-header">
        <span className="card-title">Configuracion inicial</span>
        <span style={{fontFamily:'Barlow Condensed',fontSize:13,fontWeight:700,color:'#dc2626'}}>{pct}%</span>
      </div>
      <div className="checklist-bar-track">
        <div className="checklist-bar-fill" style={{width:`${pct}%`}} />
      </div>
      <div className="checklist-steps">
        {steps.map(s => (
          <div key={s.id} className={`checklist-step ${s.done ? 'done' : ''}`}>
            <div className="step-check">{s.done ? '✓' : ''}</div>
            <span className="step-label">{s.label}</span>
            {!s.done && s.href && (
              <a href={s.href} className="step-action">Completar →</a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <div className="empty-title">{title}</div>
      <p className="empty-desc">{desc}</p>
      {action && (
        <a href={action.href} className="btn-secondary">{action.label}</a>
      )}
    </div>
  )
}

// ─── LOADER ───────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span>
    </div>
  )
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
function Styles() {
  return (
    <style jsx global>{`
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; }
      a { text-decoration:none; color:inherit; }

      /* SHELL */
      .shell { display:flex; min-height:100vh; }

      /* SIDEBAR */
      .sidebar {
        width:220px; min-height:100vh; background:#080605;
        border-right:1px solid rgba(255,255,255,.04);
        display:flex; flex-direction:column;
        position:fixed; top:0; left:0; bottom:0; z-index:50;
      }
      .sb-logo {
        padding:22px 24px 18px;
        font-family:'Bebas Neue'; font-size:20px; letter-spacing:4px; color:#dc2626;
        border-bottom:1px solid rgba(255,255,255,.04);
      }
      .sb-nav { padding:16px 12px; flex:1; }
      .sb-section-label {
        font-family:'Barlow Condensed'; font-size:9px; font-weight:700;
        letter-spacing:3px; text-transform:uppercase; color:#374151;
        padding:6px 10px 8px;
      }
      .sb-item {
        display:flex; align-items:center; gap:10px;
        padding:10px 10px; border-radius:2px; margin-bottom:2px;
        font-family:'Barlow Condensed'; font-size:13px; font-weight:700;
        letter-spacing:1px; text-transform:uppercase; color:#4b5563;
        transition:all .15s; position:relative;
      }
      .sb-item:hover { color:#f1f0ef; background:rgba(255,255,255,.03); }
      .sb-item.active { color:#f1f0ef; background:rgba(220,38,38,.08); border-left:2px solid #dc2626; }
      .sb-item-bar { display:none; }
      .sb-footer {
        padding:16px; border-top:1px solid rgba(255,255,255,.04);
        display:flex; align-items:center; gap:10px;
      }
      .sb-avatar { width:30px; height:30px; border-radius:50%; object-fit:cover; flex-shrink:0; }
      .sb-name { font-size:13px; font-weight:600; color:#f1f0ef; }
      .sb-type { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; }
      .sb-logout { margin-left:auto; font-size:12px; color:#374151; transition:color .2s; padding:4px; }
      .sb-logout:hover { color:#dc2626; }

      /* MAIN */
      .main { margin-left:220px; flex:1; }
      .panel-content { padding:32px 36px; max-width:1100px; }

      /* PAGE HEADER */
      .page-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; }
      .page-tag { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-bottom:4px; }
      .page-title { font-family:'Bebas Neue'; font-size:36px; letter-spacing:2px; }

      /* BOTONES */
      .btn-primary {
        font-family:'Barlow Condensed'; font-size:13px; font-weight:900; letter-spacing:2px; text-transform:uppercase;
        padding:10px 24px; background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer;
        transition:all .2s; display:inline-flex; align-items:center; gap:8px;
        clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
      }
      .btn-primary:hover { background:#ef4444; }
      .btn-secondary {
        font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
        padding:8px 18px; border:1px solid rgba(220,38,38,.3); color:#dc2626; border-radius:2px;
        transition:all .2s; display:inline-flex; margin-top:12px;
      }
      .btn-secondary:hover { background:rgba(220,38,38,.08); }

      /* KPIs */
      .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
      .kpi {
        background:#0f0d0b; border:1px solid #1a1410; border-radius:3px;
        padding:20px 20px; position:relative; overflow:hidden;
      }
      .kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
      .kpi-red::before   { background:#dc2626; }
      .kpi-amber::before { background:#fbbf24; }
      .kpi-green::before { background:#22c55e; }
      .kpi-blue::before  { background:#3b82f6; }
      .kpi-val { font-family:'Bebas Neue'; font-size:40px; line-height:1; margin-bottom:6px; }
      .kpi-red   .kpi-val { color:#dc2626; }
      .kpi-amber .kpi-val { color:#fbbf24; }
      .kpi-green .kpi-val { color:#22c55e; }
      .kpi-blue  .kpi-val { color:#3b82f6; }
      .kpi-label { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#4b5563; }

      /* CARDS */
      .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
      .card { background:#0f0d0b; border:1px solid #1a1410; border-radius:3px; overflow:hidden; margin-bottom:16px; }
      .card-header { padding:14px 18px; border-bottom:1px solid #1a1410; display:flex; align-items:center; justify-content:space-between; }
      .card-title { font-family:'Barlow Condensed'; font-size:14px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#9ca3af; }
      .card-link { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#dc2626; transition:color .2s; }
      .card-link:hover { color:#ef4444; }

      /* EMPTY STATE */
      .empty { padding:36px 24px; text-align:center; }
      .empty-icon { font-size:32px; display:block; margin-bottom:12px; opacity:.4; }
      .empty-title { font-family:'Barlow Condensed'; font-size:16px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#4b5563; margin-bottom:6px; }
      .empty-desc { font-size:13px; color:#374151; line-height:1.6; max-width:280px; margin:0 auto; }

      /* CHECKLIST */
      .checklist-bar-track { height:3px; background:#1a1410; margin:0 0 16px; }
      .checklist-bar-fill  { height:100%; background:linear-gradient(90deg,#dc2626,#fbbf24); transition:width .5s ease; }
      .checklist-steps { padding:0 18px 18px; display:flex; flex-direction:column; gap:10px; }
      .checklist-step { display:flex; align-items:center; gap:12px; }
      .step-check {
        width:20px; height:20px; border-radius:50%; flex-shrink:0;
        background:#1a1410; border:1px solid #2a2018;
        display:flex; align-items:center; justify-content:center;
        font-size:10px; font-weight:900; color:#22c55e;
      }
      .checklist-step.done .step-check { background:rgba(34,197,94,.1); border-color:rgba(34,197,94,.3); }
      .step-label { font-size:13px; color:#6b7280; flex:1; }
      .checklist-step.done .step-label { color:#9ca3af; }
      .step-action { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#dc2626; transition:color .2s; }
      .step-action:hover { color:#ef4444; }

      @media(max-width:960px) {
        .sidebar { width:64px; }
        .sb-logo { font-size:14px; letter-spacing:0; padding:18px 14px; text-align:center; }
        .sb-nav { padding:8px; }
        .sb-item span:not(.sb-item-bar) { display:none; }
        .sb-item { justify-content:center; padding:12px 0; }
        .sb-footer .sb-name, .sb-footer .sb-type, .sb-logout { display:none; }
        .sb-footer { justify-content:center; }
        .main { margin-left:64px; }
        .kpi-grid { grid-template-columns:1fr 1fr; }
        .two-col { grid-template-columns:1fr; }
        .panel-content { padding:24px 16px; }
      }
    `}</style>
  )
}
