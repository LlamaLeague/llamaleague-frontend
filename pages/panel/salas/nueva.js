// pages/panel/salas/nueva.js
// El streamer configura y lanza una nueva sala de inhouse.
// El bot de Dota 2 se activa desde el API al confirmar.

import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '@/lib/api'

const MODOS = [
  { val:'ap',    label:'All Pick',       desc:'Cada jugador elige libremente su heroe.' },
  { val:'cm',    label:'Captains Mode',  desc:'Los capitanes banean y pickean heroes.' },
  { val:'turbo', label:'Turbo',          desc:'Partida rapida con recursos aumentados.' },
  { val:'ar',    label:'All Random',     desc:'Heroes asignados al azar.' },
]

const WO_TIMERS = [
  { val:3,  label:'3 minutos'  },
  { val:5,  label:'5 minutos'  },
  { val:10, label:'10 minutos' },
]

export default function NuevaSala() {
  const router  = useRouter()
  const [user,      setUser]      = useState(null)
  const [community, setCommunity] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)

  const [form, setForm] = useState({
    mode:       'ap',
    wo_timer:   5,
    server:     'peru',
    balance:    true,   // balancear por MMR
    fill_bots:  false,  // rellenar con bots si faltan jugadores (futuro)
    notes:      '',
  })

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(r => r.json())
      .then(async ({ user }) => {
        if (!user)                    return router.replace('/')
        if (!user.type)               return router.replace('/onboarding')
        if (user.type !== 'streamer') return router.replace('/panel')
        setUser(user)

        // Cargar comunidad del streamer
        const res  = await apiFetch('/api/comunidad/mia')
        const data = await res.json()
        if (!data.community) return router.replace('/panel/comunidad/nueva')
        setCommunity(data.community)
        setLoading(false)
      })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res  = await apiFetch('/api/salas/crear', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, community_id: community.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear sala')
      router.replace(`/panel/salas/${data.sala.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <Loader />

  const canSubmit = !saving

  return (
    <>
      <Head>
        <title>Nueva sala — LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; }
        a { text-decoration:none; color:inherit; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <style jsx>{`
        .shell { display:flex; min-height:100vh; }

        /* SIDEBAR */
        .sidebar {
          width:220px; background:#080605;
          border-right:1px solid rgba(255,255,255,.04);
          display:flex; flex-direction:column;
          position:fixed; top:0; left:0; bottom:0; z-index:50;
        }
        .sb-logo { padding:22px 24px 18px; font-family:'Bebas Neue'; font-size:20px; letter-spacing:4px; color:#dc2626; border-bottom:1px solid rgba(255,255,255,.04); }
        .sb-back { display:flex; align-items:center; gap:8px; margin:16px 12px 0; padding:10px; font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; border-radius:2px; transition:color .2s; }
        .sb-back:hover { color:#f1f0ef; }
        .sb-community { margin:8px 12px 0; padding:12px; background:rgba(220,38,38,.06); border:1px solid rgba(220,38,38,.12); border-radius:2px; }
        .sb-community-label { font-family:'Barlow Condensed'; font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#4b5563; margin-bottom:4px; }
        .sb-community-name { font-family:'Barlow Condensed'; font-size:14px; font-weight:700; letter-spacing:1px; color:#f1f0ef; }
        .sb-community-tag { font-size:11px; color:#6b7280; margin-top:2px; }
        .sb-footer { margin-top:auto; padding:16px; border-top:1px solid rgba(255,255,255,.04); display:flex; align-items:center; gap:10px; }
        .sb-avatar { width:30px; height:30px; border-radius:50%; object-fit:cover; }
        .sb-name { font-size:13px; font-weight:600; }
        .sb-type { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; }

        /* MAIN */
        .main { margin-left:220px; flex:1; padding:40px 48px; }
        .inner { max-width:720px; }

        /* HEADER */
        .page-header { margin-bottom:36px; animation:fadeUp .4s ease both; }
        .page-tag { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-bottom:6px; }
        .page-title { font-family:'Bebas Neue'; font-size:40px; letter-spacing:2px; }
        .page-sub { font-size:14px; color:#6b7280; margin-top:6px; }

        /* SECCIONES */
        .section-label {
          font-family:'Barlow Condensed'; font-size:10px; font-weight:700;
          letter-spacing:3px; text-transform:uppercase; color:#374151;
          display:flex; align-items:center; gap:12px;
          margin:28px 0 18px;
        }
        .section-label::after { content:''; flex:1; height:1px; background:#1a1410; }

        /* MODO — cards seleccionables */
        .modo-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .modo-opt {
          background:#0f0d0b; border:2px solid #1a1410; border-radius:2px;
          padding:16px 14px; cursor:pointer; transition:all .2s;
          position:relative; overflow:hidden;
        }
        .modo-opt::before {
          content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg,#dc2626,#fbbf24);
          transform:scaleX(0); transform-origin:left; transition:transform .25s;
        }
        .modo-opt:hover { border-color:#2a2018; }
        .modo-opt.selected { border-color:#dc2626; background:rgba(220,38,38,.05); }
        .modo-opt.selected::before { transform:scaleX(1); }
        .modo-check {
          position:absolute; top:8px; right:8px; width:14px; height:14px;
          border-radius:50%; background:#dc2626;
          display:flex; align-items:center; justify-content:center;
          font-size:8px; color:white; font-weight:900;
          opacity:0; transition:opacity .15s;
        }
        .modo-opt.selected .modo-check { opacity:1; }
        .modo-name { font-family:'Barlow Condensed'; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#9ca3af; margin-bottom:4px; }
        .modo-opt.selected .modo-name { color:#f1f0ef; }
        .modo-desc { font-size:11px; color:#374151; line-height:1.5; }

        /* CAMPOS */
        .field { margin-bottom:16px; }
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        label { display:block; font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#6b7280; margin-bottom:8px; }
        select, input[type=text], textarea {
          width:100%; background:#0f0d0b; border:1px solid #1e1c1a; border-radius:2px;
          color:#f1f0ef; font-family:'Barlow'; font-size:14px; font-weight:500;
          padding:11px 14px; transition:border-color .2s; outline:none;
          appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 14px center;
        }
        select:focus, input[type=text]:focus, textarea:focus { border-color:#dc2626; }
        textarea { resize:vertical; min-height:70px; background-image:none; }
        input[type=text]::placeholder, textarea::placeholder { color:#374151; }
        select option { background:#0f0d0b; }

        /* TOGGLE */
        .toggle-row { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:#0f0d0b; border:1px solid #1a1410; border-radius:2px; margin-bottom:10px; }
        .toggle-info { }
        .toggle-label { font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#9ca3af; }
        .toggle-desc { font-size:12px; color:#374151; margin-top:2px; }
        .toggle {
          position:relative; width:36px; height:20px; flex-shrink:0;
          background:#1a1410; border-radius:10px; cursor:pointer; transition:background .2s;
          border:none; outline:none;
        }
        .toggle.on { background:#dc2626; }
        .toggle::after {
          content:''; position:absolute; top:3px; left:3px;
          width:14px; height:14px; border-radius:50%;
          background:white; transition:transform .2s;
        }
        .toggle.on::after { transform:translateX(16px); }

        /* PREVIEW BOX */
        .preview {
          background:rgba(220,38,38,.04); border:1px solid rgba(220,38,38,.12);
          border-radius:3px; padding:18px 20px; margin-bottom:0;
          display:flex; flex-wrap:wrap; gap:16px; align-items:center;
        }
        .preview-item { }
        .preview-key { font-family:'Barlow Condensed'; font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#4b5563; margin-bottom:2px; }
        .preview-val { font-family:'Bebas Neue'; font-size:22px; color:#f1f0ef; letter-spacing:1px; }
        .preview-val.red { color:#dc2626; }

        /* FOOTER */
        .form-footer { margin-top:28px; display:flex; align-items:center; gap:16px; }
        .btn-submit {
          font-family:'Barlow Condensed'; font-size:15px; font-weight:900;
          letter-spacing:2px; text-transform:uppercase;
          padding:14px 48px; background:#dc2626; color:white;
          border:none; border-radius:2px; cursor:pointer; transition:all .2s;
          clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
          display:flex; align-items:center; gap:8px;
        }
        .btn-submit:hover:not(:disabled) { background:#ef4444; transform:translateY(-2px); box-shadow:0 8px 28px rgba(220,38,38,.4); }
        .btn-submit:disabled { opacity:.4; cursor:not-allowed; }
        .btn-cancel { font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; transition:color .2s; }
        .btn-cancel:hover { color:#9ca3af; }
        .error-msg { margin-top:12px; font-size:13px; color:#ef4444; }

        /* INFO BOX */
        .info-box {
          display:flex; gap:10px; padding:12px 14px;
          background:rgba(251,191,36,.04); border:1px solid rgba(251,191,36,.12);
          border-radius:2px; margin-bottom:16px;
        }
        .info-icon { font-size:14px; flex-shrink:0; margin-top:1px; }
        .info-text { font-size:12px; color:#6b7280; line-height:1.6; }

        @media(max-width:900px) {
          .sidebar { width:64px; }
          .sb-logo { font-size:14px; letter-spacing:0; padding:18px 10px; text-align:center; }
          .sb-community, .sb-back span, .sb-name, .sb-type { display:none; }
          .main { margin-left:64px; padding:24px 16px; }
          .modo-grid { grid-template-columns:1fr 1fr; }
          .field-row { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="shell">
        <aside className="sidebar">
          <div className="sb-logo">LlamaLeague</div>
          <a href="/panel" className="sb-back">← <span>Panel</span></a>
          {community && (
            <div className="sb-community">
              <div className="sb-community-label">Comunidad</div>
              <div className="sb-community-name">{community.name}</div>
              <div className="sb-community-tag">/c/{community.tag}</div>
            </div>
          )}
          <div className="sb-footer">
            <img src={user.avatar_url} alt="" className="sb-avatar" />
            <div>
              <div className="sb-name">{user.username}</div>
              <div className="sb-type">Streamer</div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="inner">
            <div className="page-header">
              <div className="page-tag">Salas · Nueva</div>
              <h1 className="page-title">Crear Sala</h1>
              <p className="page-sub">El bot de Dota 2 creara el lobby automaticamente al confirmar.</p>
            </div>

            <form onSubmit={handleSubmit}>

              {/* MODO */}
              <div className="section-label">Modo de juego</div>
              <div className="modo-grid">
                {MODOS.map(m => (
                  <div
                    key={m.val}
                    className={`modo-opt ${form.mode === m.val ? 'selected' : ''}`}
                    onClick={() => set('mode', m.val)}
                  >
                    <div className="modo-check">✓</div>
                    <div className="modo-name">{m.label}</div>
                    <div className="modo-desc">{m.desc}</div>
                  </div>
                ))}
              </div>

              {/* CONFIGURACION */}
              <div className="section-label">Configuracion</div>
              <div className="field-row">
                <div className="field">
                  <label>Servidor</label>
                  <select value={form.server} onChange={e => set('server', e.target.value)}>
                    <option value="peru">Peru</option>
                    <option value="chile">Chile</option>
                    <option value="brazil">Brasil</option>
                    <option value="argentina">Argentina</option>
                    <option value="us_east">US East</option>
                  </select>
                </div>
                <div className="field">
                  <label>Timer WO (sin jugadores)</label>
                  <select value={form.wo_timer} onChange={e => set('wo_timer', Number(e.target.value))}>
                    {WO_TIMERS.map(t => (
                      <option key={t.val} value={t.val}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* OPCIONES TOGGLE */}
              <div className="section-label">Opciones</div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <div className="toggle-label">Balanceo por MMR</div>
                  <div className="toggle-desc">Los equipos se arman automaticamente para minimizar la diferencia de MMR.</div>
                </div>
                <button
                  type="button"
                  className={`toggle ${form.balance ? 'on' : ''}`}
                  onClick={() => set('balance', !form.balance)}
                />
              </div>

              {/* NOTAS */}
              <div className="section-label">Notas para jugadores</div>
              <div className="field">
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Opcional — reglas especiales, instrucciones, etc."
                  maxLength={200}
                />
              </div>

              {/* INFO BOX */}
              <div className="info-box">
                <span className="info-icon">⚡</span>
                <p className="info-text">
                  El bot crea el lobby en Dota 2 con contrasena automatica. Los jugadores ven el codigo en la pagina de la sala.
                  Si no se completan los 10 jugadores en <strong>{form.wo_timer} minutos</strong>, la sala se cierra por WO.
                </p>
              </div>

              {/* PREVIEW */}
              <div className="section-label">Resumen</div>
              <div className="preview">
                <div className="preview-item">
                  <div className="preview-key">Modo</div>
                  <div className="preview-val red">{MODOS.find(m => m.val === form.mode)?.label}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-key">Servidor</div>
                  <div className="preview-val">{form.server.toUpperCase()}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-key">Timer WO</div>
                  <div className="preview-val">{form.wo_timer}min</div>
                </div>
                <div className="preview-item">
                  <div className="preview-key">Balance MMR</div>
                  <div className="preview-val">{form.balance ? 'SI' : 'NO'}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-key">Comunidad</div>
                  <div className="preview-val">{community?.tag?.toUpperCase()}</div>
                </div>
              </div>

              {/* SUBMIT */}
              <div className="form-footer">
                <button type="submit" className="btn-submit" disabled={!canSubmit}>
                  {saving ? 'Creando...' : 'Lanzar sala'}
                  {!saving && <span style={{fontSize:16}}>→</span>}
                </button>
                <a href="/panel" className="btn-cancel">Cancelar</a>
              </div>
              {error && <p className="error-msg">{error}</p>}

            </form>
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
