// pages/panel/salas/[id].js
// Pagina de sala activa.
// - Jugadores: ven la contrasena, su estado y el countdown WO
// - Streamer: ve quien entro, puede cancelar o forzar inicio
// Se actualiza en tiempo real via polling cada 5 segundos.

import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

const STATUS_LABEL = {
  queued:    { text:'En cola — bot preparando lobby...', color:'#fbbf24' },
  waiting:   { text:'Esperando jugadores',               color:'#3b82f6' },
  active:    { text:'Partida en curso',                  color:'#22c55e' },
  completed: { text:'Finalizada',                        color:'#6b7280' },
  cancelled: { text:'Cancelada',                         color:'#ef4444' },
}

export default function SalaPage() {
  const router  = useRouter()
  const { id }  = router.query

  const [user,     setUser]     = useState(null)
  const [sala,     setSala]     = useState(null)
  const [players,  setPlayers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [copied,   setCopied]   = useState(false)
  const [joining,  setJoining]  = useState(false)
  const [acting,   setActing]   = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)

  const pollRef = useRef(null)

  // ─── Cargar usuario ──────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => {
        if (!user) return router.replace('/')
        setUser(user)
      })
  }, [])

  // ─── Polling de sala ─────────────────────────────────────────────────────────
  const fetchSala = async () => {
    if (!id) return
    try {
      const res  = await apiFetch(`/api/salas/${id}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSala(data.sala)
      setPlayers(data.players ?? [])
      setLoading(false)
    } catch { setError('Error de conexion') }
  }

  useEffect(() => {
    if (!id) return
    fetchSala()
    pollRef.current = setInterval(fetchSala, 5000)
    return () => clearInterval(pollRef.current)
  }, [id])

  // ─── Countdown WO ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sala || sala.status !== 'waiting') return
    // wo_deadline = started_at (o created_at) + wo_timer minutos
    const base = sala.started_at || sala.created_at
    const deadline = new Date(base).getTime() + (sala.wo_timer || 5) * 60 * 1000
    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
      setTimeLeft(left)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [sala?.started_at, sala?.created_at, sala?.status, sala?.wo_timer])

  // ─── Copiar contrasena ───────────────────────────────────────────────────────
  const copyPassword = () => {
    navigator.clipboard.writeText(sala.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── Unirse a la sala ────────────────────────────────────────────────────────
  const handleJoin = async () => {
    setJoining(true)
    try {
      const res  = await apiFetch(`/api/salas/${id}/unirse`, { method:'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      fetchSala()
    } catch (err) {
      setError(err.message)
    }
    setJoining(false)
  }

  // ─── Acciones del streamer ───────────────────────────────────────────────────
  const handleAction = async (action) => {
    setActing(true)
    try {
      const res  = await apiFetch(`/api/salas/${id}/${action}`, { method:'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      fetchSala()
    } catch (err) {
      setError(err.message)
    }
    setActing(false)
  }

  if (loading) return <Loader />
  if (error && !sala) return <ErrorScreen msg={error} />

  const isOwner   = user && sala && user.id === sala.created_by
  const isPlayer  = user && players.some(p => p.user_id === user.id)
  const isFull    = players.filter(p => p.confirmed).length >= 10
  const confirmed = players.filter(p => p.confirmed).length
  const status    = STATUS_LABEL[sala?.status] ?? { text: sala?.status, color:'#6b7280' }
  const modeLabel = { ap:'All Pick', cm:'Captains Mode', turbo:'Turbo', ar:'All Random' }[sala?.mode] ?? sala?.mode

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <>
      <Head>
        <title>Sala #{sala?.id?.slice(0,6).toUpperCase()} — LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; }
        a { text-decoration:none; color:inherit; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes countdown-warn { 0%,100%{color:#ef4444} 50%{color:#fbbf24} }
      `}</style>

      <style jsx>{`
        /* NAV */
        nav {
          height:56px; padding:0 32px;
          display:flex; align-items:center; justify-content:space-between;
          background:#080605; border-bottom:1px solid rgba(255,255,255,.04);
          position:sticky; top:0; z-index:50;
        }
        .nav-logo { font-family:'Bebas Neue'; font-size:18px; letter-spacing:4px; color:#dc2626; }
        .nav-back { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; transition:color .2s; }
        .nav-back:hover { color:#9ca3af; }
        .nav-user { display:flex; align-items:center; gap:8px; }
        .nav-avatar { width:26px; height:26px; border-radius:50%; object-fit:cover; }
        .nav-username { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1px; color:#6b7280; }

        /* PAGE */
        .page { max-width:1000px; margin:0 auto; padding:32px 32px; }

        /* SALA HEADER */
        .sala-header { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; margin-bottom:28px; animation:fadeUp .4s ease both; }
        .sala-id { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#374151; margin-bottom:6px; }
        .sala-title { font-family:'Bebas Neue'; font-size:38px; letter-spacing:2px; line-height:1; margin-bottom:10px; }
        .sala-meta { display:flex; gap:10px; flex-wrap:wrap; }
        .meta-pill {
          display:inline-flex; align-items:center; gap:5px; padding:4px 10px;
          background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
          border-radius:2px; font-family:'Barlow Condensed'; font-size:11px; font-weight:700;
          letter-spacing:1.5px; text-transform:uppercase; color:#6b7280;
        }
        .status-badge {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 14px; border-radius:2px;
          font-family:'Barlow Condensed'; font-size:12px; font-weight:700;
          letter-spacing:2px; text-transform:uppercase;
        }
        .status-dot { width:7px; height:7px; border-radius:50%; animation:pulse 2s infinite; }

        /* LAYOUT */
        .layout { display:grid; grid-template-columns:1fr 320px; gap:20px; align-items:start; }

        /* CARD */
        .card { background:#0f0d0b; border:1px solid #1a1410; border-radius:3px; overflow:hidden; margin-bottom:16px; }
        .card:last-child { margin-bottom:0; }
        .card-header { padding:12px 18px; border-bottom:1px solid #1a1410; display:flex; align-items:center; justify-content:space-between; }
        .card-title { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#6b7280; }

        /* CONTRASENA */
        .password-block {
          padding:20px 18px; display:flex; align-items:center; gap:16px;
          background:rgba(220,38,38,.04); border-bottom:1px solid #1a1410;
        }
        .password-val {
          font-family:'JetBrains Mono'; font-size:32px; font-weight:600;
          letter-spacing:8px; color:#f1f0ef; flex:1;
        }
        .btn-copy {
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700;
          letter-spacing:2px; text-transform:uppercase;
          padding:8px 16px; background:rgba(220,38,38,.1); border:1px solid rgba(220,38,38,.2);
          color:#ef4444; border-radius:2px; cursor:pointer; transition:all .2s; white-space:nowrap;
        }
        .btn-copy:hover { background:rgba(220,38,38,.2); }
        .btn-copy.copied { background:rgba(34,197,94,.1); border-color:rgba(34,197,94,.2); color:#22c55e; }
        .password-hint { padding:10px 18px; font-size:12px; color:#374151; line-height:1.5; border-bottom:1px solid #1a1410; }

        /* COUNTDOWN */
        .countdown-block {
          padding:16px 18px; display:flex; align-items:center; justify-content:space-between;
        }
        .countdown-label { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#6b7280; }
        .countdown-val {
          font-family:'JetBrains Mono'; font-size:28px; font-weight:600;
          color:#fbbf24;
        }
        .countdown-val.urgent { animation:countdown-warn 1s ease-in-out infinite; }

        /* PLAYERS LIST */
        .players-list { }
        .player-slot {
          display:flex; align-items:center; gap:10px;
          padding:9px 18px; border-bottom:1px solid #131109;
          transition:background .15s;
        }
        .player-slot:last-child { border:none; }
        .player-slot.filled:hover { background:rgba(255,255,255,.02); }
        .slot-num { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; color:#2a2418; width:20px; flex-shrink:0; }
        .slot-avatar { width:24px; height:24px; border-radius:50%; object-fit:cover; flex-shrink:0; }
        .slot-avatar-empty { width:24px; height:24px; border-radius:50%; background:#1a1410; flex-shrink:0; }
        .slot-name { font-size:13px; font-weight:600; flex:1; }
        .slot-name.empty { color:#2a2418; font-style:italic; }
        .slot-team {
          font-family:'Barlow Condensed'; font-size:10px; font-weight:700;
          letter-spacing:1.5px; text-transform:uppercase; padding:2px 7px; border-radius:2px;
        }
        .slot-team.radiant { background:rgba(34,197,94,.1);  color:#22c55e; }
        .slot-team.dire    { background:rgba(239,68,68,.1);  color:#ef4444; }
        .slot-mmr { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:1px; color:#374151; }

        /* PROGRESS BAR */
        .progress-wrap { padding:14px 18px 0; }
        .progress-label { display:flex; justify-content:space-between; margin-bottom:6px; }
        .progress-key { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; }
        .progress-val { font-family:'Bebas Neue'; font-size:18px; }
        .progress-track { height:4px; background:#1a1410; border-radius:2px; margin-bottom:14px; }
        .progress-fill { height:100%; background:linear-gradient(90deg,#dc2626,#fbbf24); border-radius:2px; transition:width .5s ease; }

        /* ACCIONES STREAMER */
        .actions-card { background:#0f0d0b; border:1px solid #1a1410; border-radius:3px; padding:18px; }
        .actions-title { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; margin-bottom:14px; }
        .btn-action {
          width:100%; margin-bottom:8px; padding:11px 16px;
          font-family:'Barlow Condensed'; font-size:13px; font-weight:700;
          letter-spacing:1.5px; text-transform:uppercase;
          border-radius:2px; cursor:pointer; transition:all .2s;
          display:flex; align-items:center; justify-content:center; gap:8px;
          border:none;
        }
        .btn-action:last-child { margin-bottom:0; }
        .btn-action:disabled { opacity:.4; cursor:not-allowed; }
        .btn-action.green { background:rgba(34,197,94,.1); color:#22c55e; border:1px solid rgba(34,197,94,.2); }
        .btn-action.green:hover:not(:disabled) { background:rgba(34,197,94,.2); }
        .btn-action.red   { background:rgba(220,38,38,.1); color:#ef4444; border:1px solid rgba(220,38,38,.2); }
        .btn-action.red:hover:not(:disabled)   { background:rgba(220,38,38,.2); }

        /* JOIN BUTTON */
        .join-section { padding:16px 18px; border-top:1px solid #1a1410; }
        .btn-join {
          width:100%; padding:13px;
          font-family:'Barlow Condensed'; font-size:14px; font-weight:900;
          letter-spacing:2px; text-transform:uppercase;
          background:#dc2626; color:white; border:none; border-radius:2px;
          cursor:pointer; transition:all .2s;
          clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
        }
        .btn-join:hover:not(:disabled) { background:#ef4444; }
        .btn-join:disabled { opacity:.5; cursor:not-allowed; }
        .btn-joined { width:100%; padding:11px; text-align:center; font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#22c55e; background:rgba(34,197,94,.06); border:1px solid rgba(34,197,94,.15); border-radius:2px; }

        /* RESULTADO */
        .resultado-block { padding:20px 18px; text-align:center; }
        .resultado-winner { font-family:'Bebas Neue'; font-size:44px; letter-spacing:3px; margin-bottom:6px; }
        .resultado-winner.radiant { color:#22c55e; }
        .resultado-winner.dire    { color:#ef4444;  }
        .resultado-sub { font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#374151; }

        /* SPINNER */
        .queued-block { padding:24px 18px; text-align:center; }
        .spinner { width:28px; height:28px; border:2px solid #1a1410; border-top-color:#fbbf24; border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 12px; }
        .queued-text { font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#4b5563; }

        /* ERROR */
        .error-strip { background:rgba(239,68,68,.06); border:1px solid rgba(239,68,68,.15); border-radius:2px; padding:10px 14px; margin-bottom:16px; font-size:13px; color:#ef4444; }

        @media(max-width:800px) {
          nav { padding:0 20px; }
          .page { padding:20px 16px; }
          .layout { grid-template-columns:1fr; }
          .sala-header { flex-direction:column; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <a href="/" className="nav-logo">LlamaLeague</a>
        <a href="/panel/salas" className="nav-back">← Mis salas</a>
        {user && (
          <div className="nav-user">
            <img src={user.avatar_url} alt="" className="nav-avatar" />
            <span className="nav-username">{user.display_name}</span>
          </div>
        )}
      </nav>

      <div className="page">

        {/* HEADER SALA */}
        <div className="sala-header">
          <div>
            <div className="sala-id">Sala #{sala.id.slice(0,8).toUpperCase()}</div>
            <h1 className="sala-title">{modeLabel} · {sala.server.toUpperCase()}</h1>
            <div className="sala-meta">
              <span className="meta-pill">🎮 {modeLabel}</span>
              <span className="meta-pill">🌎 {sala.server}</span>
              <span className="meta-pill">⏱ WO {sala.wo_timer}min</span>
              {sala.balance_mmr && <span className="meta-pill">⚖ Balance MMR</span>}
            </div>
          </div>
          <div
            className="status-badge"
            style={{ background:`${status.color}15`, border:`1px solid ${status.color}30`, color:status.color }}
          >
            <span className="status-dot" style={{ background:status.color }} />
            {status.text}
          </div>
        </div>

        {error && <div className="error-strip">{error}</div>}

        <div className="layout">
          {/* COLUMNA IZQUIERDA */}
          <div>

            {/* Contrasena — solo visible si la sala esta waiting o active */}
            {['waiting','active'].includes(sala.status) && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Contrasena del lobby</span>
                </div>
                <div className="password-block">
                  <div className="password-val">{sala.password}</div>
                  <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copyPassword}>
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <div className="password-hint">
                  Abre Dota 2 → Buscar partida → Lobbies privados → ingresa la contrasena de arriba.
                </div>

                {/* Countdown WO */}
                {sala.status === 'waiting' && timeLeft !== null && (
                  <div className="countdown-block">
                    <div className="countdown-label">Tiempo para WO</div>
                    <div className={`countdown-val ${timeLeft < 60 ? 'urgent' : ''}`}>
                      {fmt(timeLeft)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* En cola — bot preparando */}
            {sala.status === 'queued' && (
              <div className="card">
                <div className="queued-block">
                  <div className="spinner" />
                  <div className="queued-text">Bot preparando el lobby en Dota 2...</div>
                </div>
              </div>
            )}

            {/* Resultado */}
            {sala.status === 'completed' && sala.winner_team && (
              <div className="card">
                <div className="resultado-block">
                  <div className={`resultado-winner ${sala.winner_team}`}>
                    {sala.winner_team === 'radiant' ? 'RADIANT GANA' : 'DIRE GANA'}
                  </div>
                  <div className="resultado-sub">Partida finalizada</div>
                </div>
              </div>
            )}

            {/* Lista de jugadores */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Jugadores</span>
              </div>

              {/* Progress */}
              <div className="progress-wrap">
                <div className="progress-label">
                  <span className="progress-key">En sala</span>
                  <span className="progress-val" style={{color: confirmed>=10 ? '#22c55e' : '#f1f0ef'}}>
                    {confirmed}/10
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{width:`${(confirmed/10)*100}%`}} />
                </div>
              </div>

              {/* Slots */}
              <div className="players-list">
                {Array.from({length:10}, (_, i) => {
                  const p = players[i]
                  return (
                    <div key={i} className={`player-slot ${p ? 'filled' : ''}`}>
                      <span className="slot-num">{i+1}</span>
                      {p ? (
                        <>
                          <img src={p.avatar_url || '/default-avatar.png'} alt="" className="slot-avatar" />
                          <span className="slot-name">{p.display_name}</span>
                          {p.mmr && <span className="slot-mmr">{p.mmr} MMR</span>}
                          {p.team && (
                            <span className={`slot-team ${p.team}`}>
                              {p.team === 'radiant' ? 'Radiant' : 'Dire'}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="slot-avatar-empty" />
                          <span className="slot-name empty">Esperando...</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Boton unirse — jugador */}
              {!isOwner && ['waiting','queued'].includes(sala.status) && (
                <div className="join-section">
                  {isPlayer
                    ? <div className="btn-joined">✓ Ya estas en la sala</div>
                    : (
                      <button
                        className="btn-join"
                        onClick={handleJoin}
                        disabled={joining || isFull}
                      >
                        {joining ? 'Uniendote...' : isFull ? 'Sala llena' : 'Confirmar asistencia'}
                      </button>
                    )
                  }
                </div>
              )}
            </div>

            {/* Notas */}
            {sala.notes && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Notas del streamer</span>
                </div>
                <div style={{padding:'14px 18px', fontSize:13, color:'#6b7280', lineHeight:1.65}}>
                  {sala.notes}
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA — solo streamer */}
          {isOwner && (
            <div>
              <div className="actions-card">
                <div className="actions-title">Controles del streamer</div>

                {/* Cancelar */}
                {['queued','waiting'].includes(sala.status) && (
                  <button
                    className="btn-action red"
                    onClick={() => handleAction('cancelar')}
                    disabled={acting}
                  >
                    ✕ Cancelar sala
                  </button>
                )}

                {/* Forzar inicio con los que esten */}
                {sala.status === 'waiting' && confirmed >= 6 && (
                  <button
                    className="btn-action green"
                    onClick={() => handleAction('iniciar')}
                    disabled={acting}
                  >
                    ▶ Iniciar con {confirmed} jugadores
                  </button>
                )}

                {/* Reportar resultado manualmente */}
                {sala.status === 'active' && (
                  <>
                    <button
                      className="btn-action green"
                      onClick={() => handleAction('win-radiant')}
                      disabled={acting}
                    >
                      ✓ Radiant gana
                    </button>
                    <button
                      className="btn-action red"
                      onClick={() => handleAction('win-dire')}
                      disabled={acting}
                    >
                      ✓ Dire gana
                    </button>
                  </>
                )}

                {['completed','cancelled'].includes(sala.status) && (
                  <div style={{fontSize:12, color:'#374151', textAlign:'center', padding:'8px 0'}}>
                    Sala finalizada
                  </div>
                )}
              </div>

              {/* Info sala */}
              <div style={{marginTop:16, padding:'14px', background:'#0f0d0b', border:'1px solid #1a1410', borderRadius:3}}>
                {[
                  {k:'ID',         v:sala.id.slice(0,8).toUpperCase()},
                  {k:'Modo',       v:modeLabel},
                  {k:'Servidor',   v:sala.server},
                  {k:'WO timer',   v:`${sala.wo_timer} min`},
                  {k:'Balance MMR',v:sala.balance_mmr ? 'Si' : 'No'},
                ].map(r => (
                  <div key={r.k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #131109'}}>
                    <span style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#374151'}}>{r.k}</span>
                    <span style={{fontFamily:'Barlow Condensed',fontSize:12,fontWeight:700,letterSpacing:'1px',color:'#6b7280'}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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

function ErrorScreen({ msg }) {
  return (
    <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
      <span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#ef4444'}}>{msg}</span>
      <a href="/panel" style={{fontFamily:'Barlow Condensed',fontSize:12,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'#4b5563'}}>← Volver al panel</a>
    </div>
  )
}
