// pages/index.js — LlamaLeague Landing v2

import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

function ParticleField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.4, vy: -(Math.random() * 0.5 + 0.15),
      r: Math.random() * 2.5 + 0.8, life: Math.random(),
      decay: Math.random() * 0.004 + 0.002,
      col: [[220,38,38],[251,191,36],[239,68,68],[234,179,8]][Math.floor(Math.random()*4)]
    }))
    let raf
    const loop = (t) => {
      ctx.clearRect(0, 0, c.width, c.height)
      pts.forEach(p => {
        p.x += p.vx + Math.sin(t * 0.0007 + p.y * 0.01) * 0.2
        p.y += p.vy; p.life -= p.decay
        if (p.life <= 0 || p.y < -10) {
          p.x = Math.random() * c.width; p.y = c.height + 10; p.life = 1
        }
        const a = Math.max(0, p.life) * 0.7
        const [r, g, b] = p.col
        const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
        g2.addColorStop(0, `rgba(${r},${g},${b},${a})`)
        g2.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = g2; ctx.fill()
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2 }} />
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [counts, setCounts] = useState({ salas: 0, jugadores: 0, comunidades: 0 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const targets = { salas: 1240, jugadores: 8700, comunidades: 34 }
    const duration = 2000
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setCounts({
        salas: Math.floor(ease * targets.salas),
        jugadores: Math.floor(ease * targets.jugadores),
        comunidades: Math.floor(ease * targets.comunidades),
      })
      if (p < 1) requestAnimationFrame(tick)
    }
    const t = setTimeout(() => requestAnimationFrame(tick), 400)
    return () => clearTimeout(t)
  }, [])

  const features = [
    { num: '01', title: 'Inhouses Automaticos', desc: 'Bot crea la sala, balancea equipos por MMR y reporta resultados. Zero friccion.' },
    { num: '02', title: 'Ranking por Temporada', desc: '+35 por ganar, -10 por perder. Top 3 ganan LlamaCoins y badges permanentes.' },
    { num: '03', title: 'Control de Acceso', desc: 'El streamer decide quien entra. Solo subs, lista blanca, o sala abierta.' },
    { num: '04', title: 'LlamaCoins', desc: 'Moneda interna ganada jugando. Canjeable en torneos y beneficios futuros.' },
    { num: '05', title: 'Roster Oficial', desc: 'Arma tu lineup con posiciones fijas para la Copa LlamaLeague mensual.' },
    { num: '06', title: 'Historial Completo', desc: 'Estadisticas por partida, winrate, KDA y progresion visible para todos.' },
  ]

  return (
    <>
      <Head>
        <title>LlamaLeague — La Liga Latina de Dota 2</title>
        <meta name="description" content="Plataforma de inhouses y torneos para comunidades latinas de Dota 2" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #0c0a09;
          color: #f1f0ef;
          font-family: 'Barlow', sans-serif;
          overflow-x: hidden;
        }
        a { text-decoration: none; color: inherit; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideRight { from { transform:scaleX(0) } to { transform:scaleX(1) } }
        @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes shimmer {
          0% { background-position: -200% center }
          100% { background-position: 200% center }
        }
      `}</style>

      <style jsx>{`
        /* ─── NAV ─── */
        nav {
          position: fixed; top:0; left:0; right:0; z-index:100;
          height: 68px; padding: 0 48px;
          display: flex; align-items: center; justify-content: space-between;
          transition: all .3s ease;
        }
        nav.scrolled {
          background: rgba(12,10,9,.95);
          border-bottom: 1px solid rgba(220,38,38,.2);
          backdrop-filter: blur(20px);
        }
        .nav-logo {
          font-family: 'Bebas Neue'; font-size: 28px; letter-spacing: 5px;
          background: linear-gradient(90deg, #ef4444, #fbbf24, #ef4444);
          background-size: 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .nav-links { display:flex; align-items:center; gap:32px; }
        .nav-links a {
          font-family: 'Barlow Condensed'; font-size:13px; font-weight:700;
          letter-spacing:2px; text-transform:uppercase; color:#9ca3af;
          transition: color .2s;
        }
        .nav-links a:hover { color:#f1f0ef; }
        .nav-actions { display:flex; gap:10px; align-items:center; }
        .btn-ghost {
          font-family:'Barlow Condensed'; font-size:13px; font-weight:700;
          letter-spacing:1.5px; text-transform:uppercase;
          padding:9px 20px; border:1px solid rgba(241,240,239,.15);
          color:#9ca3af; background:transparent; border-radius:2px;
          cursor:pointer; transition:all .2s;
        }
        .btn-ghost:hover { border-color:#ef4444; color:#ef4444; }
        .btn-cta {
          font-family:'Barlow Condensed'; font-size:13px; font-weight:900;
          letter-spacing:2px; text-transform:uppercase;
          padding:9px 24px; background:#dc2626; color:white;
          border:none; border-radius:2px; cursor:pointer; transition:all .2s;
          position:relative; overflow:hidden;
        }
        .btn-cta::before {
          content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);
          transition: left .4s;
        }
        .btn-cta:hover { background:#ef4444; transform:translateY(-1px); }
        .btn-cta:hover::before { left:100%; }

        /* ─── HERO ─── */
        .hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            linear-gradient(105deg, rgba(12,10,9,.96) 0%, rgba(12,10,9,.75) 50%, rgba(12,10,9,.55) 100%),
            url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80') center/cover no-repeat;
        }
        .hero-bg::after {
          content:''; position:absolute; bottom:0; left:0; right:0; height:300px;
          background: linear-gradient(to top, #0c0a09, transparent);
        }
        /* Diagonal cut */
        .hero-diagonal {
          position:absolute; bottom:-2px; left:0; right:0; z-index:3;
          height:120px; background:#0c0a09;
          clip-path: polygon(0 60%, 100% 0%, 100% 100%, 0% 100%);
        }
        .hero-content {
          position:relative; z-index:3; max-width:1200px; margin:0 auto;
          padding:120px 48px 160px; width:100%;
        }
        .hero-eyebrow {
          display:inline-flex; align-items:center; gap:10px;
          font-family:'Barlow Condensed'; font-size:12px; font-weight:700;
          letter-spacing:4px; text-transform:uppercase; color:#fbbf24;
          margin-bottom:24px;
          animation: fadeIn .6s ease both;
        }
        .eyebrow-line {
          display:block; width:40px; height:2px; background:#fbbf24;
          transform-origin:left; animation: slideRight .6s .2s ease both;
        }
        .hero-title {
          font-family:'Bebas Neue'; font-size:clamp(72px,12vw,148px);
          line-height:.88; letter-spacing:4px;
          margin-bottom:24px;
          animation: fadeUp .7s .1s ease both;
        }
        .hero-title .line1 { display:block; color:#f1f0ef; }
        .hero-title .line2 {
          display:block;
          background: linear-gradient(90deg, #dc2626, #ef4444, #fbbf24);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .hero-sub {
          font-size:18px; font-weight:400; color:#9ca3af; line-height:1.6;
          max-width:520px; margin-bottom:40px;
          animation: fadeUp .7s .2s ease both;
        }
        .hero-actions {
          display:flex; gap:16px; flex-wrap:wrap; margin-bottom:72px;
          animation: fadeUp .7s .3s ease both;
        }
        .btn-hero-primary {
          font-family:'Barlow Condensed'; font-size:15px; font-weight:900;
          letter-spacing:3px; text-transform:uppercase;
          padding:16px 48px; background:#dc2626; color:white;
          border:none; border-radius:2px; cursor:pointer;
          transition:all .25s; display:inline-flex; align-items:center; gap:10px;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
        }
        .btn-hero-primary:hover { background:#ef4444; transform:translateY(-3px); box-shadow:0 12px 40px rgba(220,38,38,.4); }
        .btn-hero-secondary {
          font-family:'Barlow Condensed'; font-size:15px; font-weight:700;
          letter-spacing:2px; text-transform:uppercase;
          padding:16px 40px; color:#f1f0ef; background:transparent;
          border:1px solid rgba(241,240,239,.2); border-radius:2px; cursor:pointer;
          transition:all .25s;
        }
        .btn-hero-secondary:hover { border-color:rgba(241,240,239,.5); background:rgba(241,240,239,.05); }

        /* STATS STRIP */
        .stats-strip {
          display:flex; gap:0; flex-wrap:wrap;
          animation: fadeUp .7s .4s ease both;
        }
        .stat-item {
          padding-right:48px; margin-right:48px;
          border-right:1px solid rgba(241,240,239,.08);
        }
        .stat-item:last-child { border:none; }
        .stat-num {
          font-family:'Bebas Neue'; font-size:52px; line-height:1;
          color:#f1f0ef;
        }
        .stat-num span { color:#dc2626; }
        .stat-lbl {
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700;
          letter-spacing:3px; text-transform:uppercase; color:#6b7280; margin-top:4px;
        }

        /* LOGO FLOAT — columna derecha */
        .hero-visual {
          position:absolute; right:80px; top:50%; transform:translateY(-50%);
          z-index:3; display:flex; align-items:center; justify-content:center;
        }
        .logo-container {
          position:relative; width:340px; height:340px;
          animation: fadeIn .8s .4s ease both;
        }
        .logo-hexagon {
          position:absolute; inset:0;
          background: linear-gradient(135deg, rgba(220,38,38,.15), rgba(251,191,36,.08));
          clip-path: polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);
          animation: pulse 3s ease-in-out infinite;
        }
        .logo-img {
          position:relative; z-index:2; width:260px; height:260px;
          object-fit:contain;
          filter: drop-shadow(0 0 30px rgba(220,38,38,.5)) drop-shadow(0 0 60px rgba(220,38,38,.2));
          animation: floatY 5s ease-in-out infinite;
          margin:40px;
        }
        .logo-ring {
          position:absolute; inset:-16px; border-radius:50%;
          border:1px solid rgba(220,38,38,.12);
          animation: pulse 4s ease-in-out infinite;
        }
        .logo-ring2 {
          position:absolute; inset:-40px; border-radius:50%;
          border:1px solid rgba(251,191,36,.06);
        }

        /* ─── TICKER BAR ─── */
        .ticker {
          position:relative; z-index:5; background:#dc2626;
          padding:10px 0; overflow:hidden;
        }
        .ticker-inner {
          display:flex; gap:64px; white-space:nowrap;
          animation: ticker-scroll 20s linear infinite;
        }
        @keyframes ticker-scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .ticker-item {
          font-family:'Barlow Condensed'; font-size:12px; font-weight:700;
          letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,.85);
          display:flex; align-items:center; gap:16px; flex-shrink:0;
        }
        .ticker-dot { width:4px; height:4px; border-radius:50%; background:rgba(255,255,255,.5); }

        /* ─── FEATURES ─── */
        .section { max-width:1200px; margin:0 auto; padding:100px 48px; }
        .section-header { margin-bottom:64px; }
        .section-tag {
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700;
          letter-spacing:4px; text-transform:uppercase; color:#dc2626;
          display:flex; align-items:center; gap:12px; margin-bottom:16px;
        }
        .section-tag::before { content:''; width:32px; height:2px; background:#dc2626; }
        .section-title {
          font-family:'Bebas Neue'; font-size:clamp(44px,6vw,76px);
          letter-spacing:2px; line-height:.92; color:#f1f0ef;
        }
        .section-title em { color:#dc2626; font-style:normal; }

        .features-grid {
          display:grid; grid-template-columns:repeat(3,1fr); gap:2px;
          background:#1a1410;
        }
        .feat {
          background:#0f0d0b; padding:36px 32px;
          border-left:3px solid transparent;
          transition:all .25s; cursor:default; position:relative; overflow:hidden;
        }
        .feat::after {
          content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg,#dc2626,#fbbf24);
          transform:scaleX(0); transform-origin:left; transition:transform .3s;
        }
        .feat:hover { background:#131109; border-left-color:#dc2626; }
        .feat:hover::after { transform:scaleX(1); }
        .feat-num {
          font-family:'Bebas Neue'; font-size:44px; line-height:1;
          color:rgba(220,38,38,.15); margin-bottom:16px;
          transition:color .25s;
        }
        .feat:hover .feat-num { color:rgba(220,38,38,.4); }
        .feat-title {
          font-family:'Barlow Condensed'; font-size:18px; font-weight:700;
          letter-spacing:1px; text-transform:uppercase; color:#f1f0ef;
          margin-bottom:10px;
        }
        .feat-desc { font-size:14px; color:#6b7280; line-height:1.65; }

        /* ─── COPA SECTION ─── */
        .copa-section {
          position:relative; overflow:hidden;
          background:
            linear-gradient(135deg, rgba(12,10,9,.97) 0%, rgba(20,15,10,.95) 100%),
            url('https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?auto=format&fit=crop&w=1920&q=80') center/cover;
        }
        .copa-diagonal-top {
          width:100%; height:100px; background:#0c0a09;
          clip-path:polygon(0 0,100% 0,100% 40%,0 100%);
        }
        .copa-diagonal-bot {
          width:100%; height:100px; background:#0c0a09;
          clip-path:polygon(0 60%,100% 0,100% 100%,0 100%);
        }
        .copa-inner {
          max-width:1200px; margin:0 auto; padding:60px 48px;
          display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center;
        }
        .copa-label {
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700;
          letter-spacing:4px; text-transform:uppercase; color:#fbbf24;
          display:flex; align-items:center; gap:12px; margin-bottom:16px;
        }
        .copa-label::before { content:''; width:32px; height:2px; background:#fbbf24; }
        .copa-title {
          font-family:'Bebas Neue'; font-size:clamp(52px,7vw,92px);
          letter-spacing:3px; line-height:.88; color:#f1f0ef; margin-bottom:20px;
        }
        .copa-title span { color:#fbbf24; }
        .copa-desc { font-size:16px; color:#9ca3af; line-height:1.7; margin-bottom:40px; max-width:420px; }
        .copa-stats { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
        .copa-stat {
          background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06);
          padding:20px; border-radius:2px; border-left:3px solid #fbbf24;
        }
        .copa-stat-num {
          font-family:'Bebas Neue'; font-size:40px; color:#fbbf24; line-height:1;
        }
        .copa-stat-lbl {
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700;
          letter-spacing:2px; text-transform:uppercase; color:#6b7280; margin-top:4px;
        }

        /* ─── CTA FINAL ─── */
        .cta-section {
          background:#dc2626; padding:80px 48px; text-align:center;
          position:relative; overflow:hidden;
        }
        .cta-section::before {
          content:'LLAMALEAGUE'; position:absolute; top:50%; left:50%;
          transform:translate(-50%,-50%);
          font-family:'Bebas Neue'; font-size:220px; letter-spacing:8px;
          color:rgba(0,0,0,.08); white-space:nowrap; pointer-events:none;
          line-height:1;
        }
        .cta-title {
          font-family:'Bebas Neue'; font-size:clamp(44px,6vw,72px);
          letter-spacing:3px; color:white; margin-bottom:12px; position:relative;
        }
        .cta-sub { font-size:16px; color:rgba(255,255,255,.75); margin-bottom:36px; position:relative; }
        .btn-cta-white {
          font-family:'Barlow Condensed'; font-size:15px; font-weight:900;
          letter-spacing:3px; text-transform:uppercase;
          padding:16px 56px; background:white; color:#dc2626;
          border:none; border-radius:2px; cursor:pointer; transition:all .2s;
          display:inline-flex; align-items:center; gap:10px;
          position:relative;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
        }
        .btn-cta-white:hover { background:#fef2f2; transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,.3); }

        /* ─── FOOTER ─── */
        footer {
          background:#080605; padding:40px 48px;
          display:flex; align-items:center; justify-content:space-between;
          border-top:1px solid rgba(255,255,255,.04);
        }
        .footer-logo {
          font-family:'Bebas Neue'; font-size:22px; letter-spacing:4px; color:#dc2626;
        }
        .footer-text { font-size:13px; color:#374151; }
        .footer-text a { color:#6b7280; transition:color .2s; }
        .footer-text a:hover { color:#dc2626; }

        /* ─── RESPONSIVE ─── */
        @media(max-width:1100px) { .hero-visual { display:none; } }
        @media(max-width:960px) {
          .features-grid { grid-template-columns:1fr 1fr; }
          .copa-inner { grid-template-columns:1fr; gap:40px; }
          .section { padding:72px 24px; }
          nav { padding:0 24px; }
          .hero-content { padding:100px 24px 140px; }
        }
        @media(max-width:600px) {
          .features-grid { grid-template-columns:1fr; }
          .stats-strip { gap:32px; flex-direction:column; }
          .stat-item { border:none; padding:0; margin:0; }
          footer { flex-direction:column; gap:16px; text-align:center; }
        }
      `}</style>

      <ParticleField />

      {/* NAV */}
      <nav className={scrolled ? 'scrolled' : ''}>
        <div className="nav-logo">LlamaLeague</div>
        <div className="nav-links">
          <a href="#features">Plataforma</a>
          <a href="#copa">Copa</a>
          <a href="#precios">Precios</a>
        </div>
        <div className="nav-actions">
          <a href="/registro" className="btn-ghost">Iniciar Sesion</a>
          <a href="/registro" className="btn-cta">Registrar</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />

        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-line" />
            Temporada 2025 · Peru · Latam
          </div>

          <h1 className="hero-title">
            <span className="line1">La Liga Latina</span>
            <span className="line2">de Dota 2</span>
          </h1>

          <p className="hero-sub">
            Crea tu comunidad, organiza inhouses con balanceo automatico por MMR
            y compite en la Copa LlamaLeague mensual.
          </p>

          <div className="hero-actions">
            <a href="/registro" className="btn-hero-primary">
              Unirse ahora
              <span style={{fontSize:18}}>→</span>
            </a>
            <a href="#features" className="btn-hero-secondary">Ver plataforma</a>
          </div>

          <div className="stats-strip">
            <div className="stat-item">
              <div className="stat-num">{counts.salas.toLocaleString()}<span>+</span></div>
              <div className="stat-lbl">Salas jugadas</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{counts.jugadores.toLocaleString()}<span>+</span></div>
              <div className="stat-lbl">Jugadores activos</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{counts.comunidades}<span>+</span></div>
              <div className="stat-lbl">Comunidades</div>
            </div>
          </div>
        </div>

        {/* Logo flotante */}
        <div className="hero-visual">
          <div className="logo-container">
            <div className="logo-ring" />
            <div className="logo-ring2" />
            <div className="logo-hexagon" />
            <img src="/logo-copa.svg" alt="Copa LlamaLeague" className="logo-img" />
          </div>
        </div>

        <div className="hero-diagonal" />
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-inner">
          {Array.from({length: 2}, (_, i) => (
            ['INHOUSES AUTOMATICOS', 'RANKING MENSUAL', 'COPA LLAMALEAGUE', 'BALANCE POR MMR', 'LLAMACOINS', 'COMUNIDADES LATINAS', 'BOT DE DOTA 2', 'HISTORIAL COMPLETO'].map((t, j) => (
              <div key={`${i}-${j}`} className="ticker-item">
                {t}<span className="ticker-dot" />
              </div>
            ))
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div className="section" id="features">
        <div className="section-header">
          <div className="section-tag">Plataforma</div>
          <h2 className="section-title">Todo lo que necesitas<br />para tu <em>comunidad</em></h2>
        </div>
        <div className="features-grid">
          {features.map(f => (
            <div className="feat" key={f.num}>
              <div className="feat-num">{f.num}</div>
              <div className="feat-title">{f.title}</div>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* COPA */}
      <section className="copa-section" id="copa">
        <div className="copa-diagonal-top" />
        <div className="copa-inner">
          <div>
            <div className="copa-label">Torneo mensual</div>
            <h2 className="copa-title">Copa<br /><span>LlamaLeague</span></h2>
            <p className="copa-desc">
              Cada mes las mejores comunidades compiten por el titulo de liga latina.
              Premio variable segun inscripciones y donaciones de viewers.
            </p>
            <a href="/registro" className="btn-hero-primary" style={{display:'inline-flex'}}>
              Inscribir mi comunidad
            </a>
          </div>
          <div className="copa-stats">
            {[
              {num:'8', lbl:'Equipos maximos'},
              {num:'Variable', lbl:'Prize pool'},
              {num:'Gratis', lbl:'Con plan Pro'},
              {num:'Mensual', lbl:'Frecuencia'},
            ].map(s => (
              <div className="copa-stat" key={s.lbl}>
                <div className="copa-stat-num">{s.num}</div>
                <div className="copa-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="copa-diagonal-bot" />
      </section>

      {/* CTA */}
      <section className="cta-section" id="precios">
        <h2 className="cta-title">Empieza gratis hoy</h2>
        <p className="cta-sub">Sin tarjeta de credito. Sin contratos. Solo Dota 2.</p>
        <a href="/registro" className="btn-cta-white">
          Crear mi cuenta
          <span style={{fontSize:18}}>→</span>
        </a>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">LlamaLeague</div>
        <div className="footer-text">
          La liga latina de Dota 2 · <a href="https://kick.com/vadja">kick.com/vadja</a>
        </div>
        <div className="footer-text" style={{color:'#1f2937'}}>
          2025 LlamaLeague · llamaleague.vip
        </div>
      </footer>
    </>
  )
}
