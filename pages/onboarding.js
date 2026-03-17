// pages/onboarding.js
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Onboarding() {
  const router  = useRouter()
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [choice,  setChoice]  = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => {
        if (!user) return router.replace('/')
        if (user.type) return router.replace('/panel')
        setUser(user)
        setLoading(false)
      })
  }, [])

  const handleConfirm = async () => {
    if (!choice) return
    setSaving(true)
    setError(null)
    try {
      const res  = await fetch('/api/auth/set-type', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: choice }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      router.replace('/panel')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0c0a09', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:'Bebas Neue', fontSize:18, letterSpacing:4, color:'#374151' }}>CARGANDO...</span>
    </div>
  )

  return (
    <>
      <Head>
        <title>Bienvenido a LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; min-height:100vh; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>

      <style jsx>{`
        .page {
          min-height:100vh; display:flex; flex-direction:column;
          align-items:center; justify-content:center; padding:40px 24px;
          background: radial-gradient(ellipse 800px 600px at 50% 0%, rgba(220,38,38,.08) 0%, transparent 70%), #0c0a09;
        }
        .logo {
          font-family:'Bebas Neue'; font-size:22px; letter-spacing:5px;
          background:linear-gradient(90deg,#ef4444,#fbbf24,#ef4444); background-size:200%;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:shimmer 3s linear infinite; margin-bottom:48px;
        }
        .card { width:100%; max-width:680px; animation:fadeIn .5s ease both; }
        .welcome { text-align:center; margin-bottom:40px; animation:fadeUp .5s .1s ease both; }
        .welcome-tag {
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700;
          letter-spacing:4px; text-transform:uppercase; color:#dc2626;
          display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:12px;
        }
        .welcome-tag::before, .welcome-tag::after { content:''; flex:1; max-width:40px; height:1px; background:#dc2626; }
        .welcome h1 { font-family:'Bebas Neue'; font-size:clamp(40px,6vw,60px); letter-spacing:3px; color:#f1f0ef; margin-bottom:10px; }
        .welcome-sub { font-size:16px; color:#6b7280; }
        .welcome-sub strong { color:#9ca3af; }
        .options { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:28px; animation:fadeUp .5s .2s ease both; }
        .option {
          background:#0f0d0b; border:2px solid #1a1410; border-radius:4px; padding:32px 28px;
          cursor:pointer; transition:all .25s; position:relative; overflow:hidden; text-align:left;
        }
        .option::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:linear-gradient(90deg,#dc2626,#fbbf24);
          transform:scaleX(0); transform-origin:left; transition:transform .3s;
        }
        .option:hover { border-color:#2a2018; background:#131109; }
        .option:hover::before { transform:scaleX(1); }
        .option.selected { border-color:#dc2626; background:linear-gradient(135deg,rgba(220,38,38,.08),#0f0d0b); }
        .option.selected::before { transform:scaleX(1); }
        .option-check {
          position:absolute; top:14px; right:14px; width:20px; height:20px; border-radius:50%;
          background:#dc2626; display:flex; align-items:center; justify-content:center;
          opacity:0; transition:opacity .2s; color:white; font-size:11px; font-weight:900;
        }
        .option.selected .option-check { opacity:1; }
        .option-icon { font-size:34px; margin-bottom:14px; display:block; }
        .option-title { font-family:'Barlow Condensed'; font-size:20px; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:#f1f0ef; margin-bottom:8px; }
        .option-desc { font-size:13px; color:#6b7280; line-height:1.6; }
        .option-badge {
          display:inline-flex; margin-top:14px; padding:4px 10px;
          background:rgba(220,38,38,.1); border:1px solid rgba(220,38,38,.2); border-radius:2px;
          font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:2px;
          text-transform:uppercase; color:#ef4444;
        }
        .confirm-wrap { animation:fadeUp .5s .3s ease both; }
        .btn-confirm {
          width:100%; padding:16px;
          font-family:'Barlow Condensed'; font-size:16px; font-weight:900; letter-spacing:3px; text-transform:uppercase;
          background:#dc2626; color:white; border:none; border-radius:2px; cursor:pointer; transition:all .2s;
          clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
          display:flex; align-items:center; justify-content:center; gap:10px;
        }
        .btn-confirm:hover:not(:disabled) { background:#ef4444; transform:translateY(-2px); box-shadow:0 8px 30px rgba(220,38,38,.4); }
        .btn-confirm:disabled { opacity:.4; cursor:not-allowed; transform:none; }
        .error-msg { margin-top:12px; text-align:center; font-size:13px; color:#ef4444; }
        .footer-note { margin-top:20px; text-align:center; font-size:12px; color:#374151; animation:fadeUp .5s .4s ease both; }
        @media(max-width:520px) { .options { grid-template-columns:1fr; } }
      `}</style>

      <div className="page">
        <div className="logo">LlamaLeague</div>
        <div className="card">
          <div className="welcome">
            <div className="welcome-tag">Bienvenido</div>
            <h1>Elige tu rol</h1>
            <p className="welcome-sub">Hola <strong>{user.username}</strong>, esto se configura una sola vez.</p>
          </div>

          <div className="options">
            <div className={`option ${choice === 'player' ? 'selected' : ''}`} onClick={() => setChoice('player')}>
              <div className="option-check">✓</div>
              <span className="option-icon">🎮</span>
              <div className="option-title">Jugador</div>
              <p className="option-desc">Quiero unirme a salas, subir en el ranking y competir en torneos de mi comunidad.</p>
              <span className="option-badge">Para jugadores</span>
            </div>
            <div className={`option ${choice === 'streamer' ? 'selected' : ''}`} onClick={() => setChoice('streamer')}>
              <div className="option-check">✓</div>
              <span className="option-icon">📡</span>
              <div className="option-title">Streamer</div>
              <p className="option-desc">Tengo comunidad en Kick o Twitch y quiero crear salas, rankings y torneos.</p>
              <span className="option-badge">Para creadores</span>
            </div>
          </div>

          <div className="confirm-wrap">
            <button className="btn-confirm" onClick={handleConfirm} disabled={!choice || saving}>
              {saving
                ? 'Guardando...'
                : choice
                  ? `Continuar como ${choice === 'player' ? 'Jugador' : 'Streamer'}`
                  : 'Selecciona una opcion'
              }
              {!saving && choice && <span style={{fontSize:18}}>→</span>}
            </button>
            {error && <p className="error-msg">{error}</p>}
          </div>

          <p className="footer-note">Puedes cambiar esto despues desde tu perfil.</p>
        </div>
      </div>
    </>
  )
}
