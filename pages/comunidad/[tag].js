// pages/comunidad/[tag].js
// Pagina publica de una comunidad.
// URL: llamaleague.vip/comunidad/vadja-gaming
// Visible para todos — logueados o no.
// Si el usuario esta logueado puede unirse / ver su ranking.

import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'
import { createClient } from '@supabase/supabase-js'

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ─── getServerSideProps ────────────────────────────────────────────────────────
export async function getServerSideProps({ params }) {
  const { tag } = params

  const { data: community, error } = await supabasePublic
    .from('communities')
    .select(`
      id, name, tag, description, platform, channel_url, access_mode,
      created_at,
      owner:owner_id (
        id, username, avatar_url, steam_id
      )
    `)
    .eq('tag', tag)
    .single()

  if (error || !community) return { notFound: true }

  // Top 10 ranking de esta comunidad
  const { data: ranking } = await supabasePublic
    .from('ranking')
    .select(`
      position, points, wins, losses,
      user:user_id ( id, username, avatar_url )
    `)
    .eq('community_id', community.id)
    .order('position', { ascending: true })
    .limit(10)

  // Ultimas 5 salas finalizadas
  const { data: salas } = await supabasePublic
    .from('lobbies')
    .select('id, mode, status, winner, created_at, player_count')
    .eq('community_id', community.id)
    .in('status', ['completed', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    props: {
      community,
      ranking:  ranking  ?? [],
      salas:    salas    ?? [],
    }
  }
}

// ─── Componente ────────────────────────────────────────────────────────────────
export default function ComunidadPublica({ community, ranking, salas }) {
  const router = useRouter()
  const [user,       setUser]       = useState(null)
  const [isMember,   setIsMember]   = useState(false)
  const [joining,    setJoining]    = useState(false)
  const [joinMsg,    setJoinMsg]    = useState(null)

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(r => r.json())
      .then(async ({ user }) => {
        if (!user) return
        setUser(user)
        // Verificar si ya es miembro
        const { data } = await supabasePublic
          .from('roster')
          .select('id')
          .eq('community_id', community.id)
          .eq('user_id', user.id)
          .single()
        if (data) setIsMember(true)
      })
  }, [])

  const handleJoin = async () => {
    if (!user) return router.push('/api/auth/steam')
    setJoining(true)
    setJoinMsg(null)
    try {
      const res  = await apiFetch('/api/comunidad/unirse', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ community_id: community.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setIsMember(true)
      setJoinMsg('Te uniste a la comunidad.')
    } catch (err) {
      setJoinMsg(err.message)
    }
    setJoining(false)
  }

  const platformIcon = { kick:'🟢', twitch:'🟣', youtube:'🔴' }[community.platform] ?? '🎮'
  const accessLabel  = { open:'Abierta', subs_only:'Solo subs', whitelist:'Lista blanca' }[community.access_mode]

  return (
    <>
      <Head>
        <title>{community.name} — LlamaLeague</title>
        <meta name="description" content={community.description || `Comunidad de Dota 2 de ${community.owner.username} en LlamaLeague`} />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; }
        a { text-decoration:none; color:inherit; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>

      <style jsx>{`
        /* NAV */
        nav {
          position:sticky; top:0; z-index:50;
          height:60px; padding:0 48px;
          display:flex; align-items:center; justify-content:space-between;
          background:rgba(12,10,9,.96); border-bottom:1px solid rgba(255,255,255,.04);
          backdrop-filter:blur(16px);
        }
        .nav-logo {
          font-family:'Bebas Neue'; font-size:20px; letter-spacing:4px;
          background:linear-gradient(90deg,#ef4444,#fbbf24,#ef4444); background-size:200%;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:shimmer 3s linear infinite;
        }
        .nav-right { display:flex; gap:10px; align-items:center; }
        .btn-nav-ghost {
          font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
          padding:7px 16px; border:1px solid rgba(255,255,255,.1); color:#9ca3af; background:transparent; border-radius:2px;
          cursor:pointer; transition:all .2s;
        }
        .btn-nav-ghost:hover { border-color:#dc2626; color:#ef4444; }
        .btn-nav-red {
          font-family:'Barlow Condensed'; font-size:12px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase;
          padding:7px 18px; background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer; transition:all .2s;
        }
        .btn-nav-red:hover { background:#ef4444; }

        /* HERO COMUNIDAD */
        .hero {
          position:relative; overflow:hidden;
          background: linear-gradient(135deg, rgba(220,38,38,.06) 0%, transparent 60%), #0e0c0a;
          border-bottom:1px solid rgba(255,255,255,.04);
          padding:48px 48px 40px;
          animation:fadeUp .4s ease both;
        }
        .hero::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:linear-gradient(90deg,#dc2626,#fbbf24,#dc2626);
        }
        .hero-inner { max-width:1100px; margin:0 auto; display:flex; align-items:flex-start; gap:32px; }
        .owner-avatar { width:72px; height:72px; border-radius:50%; object-fit:cover; border:2px solid rgba(220,38,38,.3); flex-shrink:0; }
        .hero-info { flex:1; }
        .hero-tag { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-bottom:6px; }
        .hero-name { font-family:'Bebas Neue'; font-size:clamp(32px,5vw,52px); letter-spacing:2px; line-height:1; margin-bottom:10px; }
        .hero-desc { font-size:14px; color:#6b7280; line-height:1.65; max-width:580px; margin-bottom:16px; }
        .hero-meta { display:flex; gap:16px; flex-wrap:wrap; }
        .meta-chip {
          display:inline-flex; align-items:center; gap:6px;
          padding:4px 12px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
          border-radius:2px; font-family:'Barlow Condensed'; font-size:11px; font-weight:700;
          letter-spacing:1.5px; text-transform:uppercase; color:#9ca3af;
        }
        .hero-actions { display:flex; flex-direction:column; align-items:flex-end; gap:10px; flex-shrink:0; }
        .btn-join {
          font-family:'Barlow Condensed'; font-size:14px; font-weight:900; letter-spacing:2px; text-transform:uppercase;
          padding:12px 32px; background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer; transition:all .2s;
          clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
          white-space:nowrap;
        }
        .btn-join:hover:not(:disabled) { background:#ef4444; transform:translateY(-2px); box-shadow:0 8px 24px rgba(220,38,38,.35); }
        .btn-join:disabled { opacity:.5; cursor:not-allowed; }
        .btn-joined {
          font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase;
          padding:10px 24px; background:rgba(34,197,94,.1); border:1px solid rgba(34,197,94,.25);
          color:#22c55e; border-radius:2px;
        }
        .join-msg { font-size:12px; color:#6b7280; }
        .channel-link {
          display:inline-flex; align-items:center; gap:6px;
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
          color:#4b5563; transition:color .2s;
        }
        .channel-link:hover { color:#9ca3af; }

        /* CONTENIDO */
        .content { max-width:1100px; margin:0 auto; padding:40px 48px; }
        .two-col { display:grid; grid-template-columns:1fr 360px; gap:24px; align-items:start; }

        /* CARD */
        .card { background:#0f0d0b; border:1px solid #1a1410; border-radius:3px; overflow:hidden; margin-bottom:20px; }
        .card-header { padding:14px 18px; border-bottom:1px solid #1a1410; display:flex; align-items:center; justify-content:space-between; }
        .card-title { font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#9ca3af; }
        .card-link { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#dc2626; transition:color .2s; }
        .card-link:hover { color:#ef4444; }

        /* RANKING */
        .rank-row {
          display:flex; align-items:center; gap:12px; padding:10px 18px;
          border-bottom:1px solid #131109; transition:background .15s;
        }
        .rank-row:last-child { border:none; }
        .rank-row:hover { background:rgba(255,255,255,.02); }
        .rank-pos { font-family:'Bebas Neue'; font-size:20px; width:28px; text-align:center; flex-shrink:0; }
        .rank-pos.gold   { color:#fbbf24; }
        .rank-pos.silver { color:#94a3b8; }
        .rank-pos.bronze { color:#cd7c4f; }
        .rank-pos.normal { color:#374151; }
        .rank-avatar { width:28px; height:28px; border-radius:50%; object-fit:cover; flex-shrink:0; }
        .rank-name { font-size:13px; font-weight:600; flex:1; }
        .rank-pts { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1px; color:#6b7280; }
        .rank-pts span { color:#f1f0ef; }
        .rank-record { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1px; color:#374151; }
        .rank-record .w { color:#22c55e; }
        .rank-record .l { color:#dc2626; }

        /* SALAS */
        .sala-row {
          display:flex; align-items:center; gap:12px; padding:10px 18px;
          border-bottom:1px solid #131109;
        }
        .sala-row:last-child { border:none; }
        .sala-status { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .sala-status.completed { background:#22c55e; }
        .sala-status.cancelled { background:#374151; }
        .sala-info { flex:1; }
        .sala-mode { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#9ca3af; }
        .sala-date { font-size:11px; color:#374151; margin-top:1px; }
        .sala-winner {
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
          padding:3px 8px; border-radius:2px;
        }
        .sala-winner.radiant { background:rgba(34,197,94,.1);  color:#22c55e; border:1px solid rgba(34,197,94,.2);  }
        .sala-winner.dire    { background:rgba(220,38,38,.1);  color:#ef4444; border:1px solid rgba(220,38,38,.2);  }
        .sala-winner.none    { background:rgba(255,255,255,.04); color:#6b7280; border:1px solid rgba(255,255,255,.08); }

        /* EMPTY */
        .empty { padding:32px 18px; text-align:center; }
        .empty-icon { font-size:28px; display:block; margin-bottom:10px; opacity:.3; }
        .empty-title { font-family:'Barlow Condensed'; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#374151; }

        @media(max-width:900px) {
          nav { padding:0 24px; }
          .hero { padding:32px 24px; }
          .hero-inner { flex-direction:column; gap:20px; }
          .hero-actions { flex-direction:row; align-items:center; }
          .content { padding:28px 20px; }
          .two-col { grid-template-columns:1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <a href="/" className="nav-logo">LlamaLeague</a>
        <div className="nav-right">
          {user ? (
            <a href="/panel" className="btn-nav-ghost">Mi panel</a>
          ) : (
            <>
              <a href="https://llamaleague-api.onrender.com/api/auth/steam" className="btn-nav-ghost">Iniciar sesion</a>
              <a href="/register"       className="btn-nav-red">Registrar</a>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-inner">
          <img src={community.owner.avatar_url} alt={community.owner.username} className="owner-avatar" />

          <div className="hero-info">
            <div className="hero-tag">Comunidad · {community.tag}</div>
            <h1 className="hero-name">{community.name}</h1>
            {community.description && <p className="hero-desc">{community.description}</p>}
            <div className="hero-meta">
              <span className="meta-chip">{platformIcon} {community.platform}</span>
              <span className="meta-chip">🔒 {accessLabel}</span>
              <span className="meta-chip">👤 {community.owner.username}</span>
              <a href={community.channel_url} target="_blank" rel="noopener noreferrer" className="channel-link">
                Ver canal →
              </a>
            </div>
          </div>

          <div className="hero-actions">
            {isMember ? (
              <div className="btn-joined">✓ Ya eres miembro</div>
            ) : (
              <button
                className="btn-join"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? 'Uniendote...' : user ? 'Unirme' : 'Iniciar sesion para unirme'}
              </button>
            )}
            {joinMsg && <div className="join-msg">{joinMsg}</div>}
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="content">
        <div className="two-col">

          {/* Ranking */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Ranking — {community.name}</span>
            </div>
            {ranking.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">🏆</span>
                <div className="empty-title">Sin datos todavia</div>
              </div>
            ) : (
              ranking.map((r, i) => (
                <div key={r.user.id} className="rank-row">
                  <div className={`rank-pos ${i===0?'gold':i===1?'silver':i===2?'bronze':'normal'}`}>
                    {r.position}
                  </div>
                  <img src={r.user.avatar_url} alt="" className="rank-avatar" />
                  <div className="rank-name">{r.user.username}</div>
                  <div className="rank-record">
                    <span className="w">{r.wins}W</span> <span className="l">{r.losses}L</span>
                  </div>
                  <div className="rank-pts"><span>{r.points}</span> pts</div>
                </div>
              ))
            )}
          </div>

          {/* Ultimas salas */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Ultimas salas</span>
            </div>
            {salas.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">🎮</span>
                <div className="empty-title">Sin partidas todavia</div>
              </div>
            ) : (
              salas.map(s => (
                <div key={s.id} className="sala-row">
                  <div className={`sala-status ${s.status}`} />
                  <div className="sala-info">
                    <div className="sala-mode">{s.mode || 'All Pick'}</div>
                    <div className="sala-date">{formatDate(s.created_at)}</div>
                  </div>
                  <div className={`sala-winner ${s.winner || 'none'}`}>
                    {s.winner === 'radiant' ? 'Radiant' : s.winner === 'dire' ? 'Dire' : s.status === 'cancelled' ? 'Cancelada' : '—'}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })
}
