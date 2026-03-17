// pages/panel/comunidad/nueva.js
// Solo accesible para streamers.
// Crea la comunidad del streamer en Supabase.

import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '../../lib/api'

export default function NuevaComunidad() {
  const router  = useRouter()
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  const [form, setForm] = useState({
    name:        '',
    tag:         '',
    description: '',
    platform:    'kick',    // 'kick' | 'twitch' | 'youtube'
    channel_url: '',
    access_mode: 'open',   // 'open' | 'subs_only' | 'whitelist'
  })

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => {
        if (!user)                  return router.replace('/')
        if (!user.type)             return router.replace('/onboarding')
        if (user.type !== 'streamer') return router.replace('/panel')
        setUser(user)
        setLoading(false)
      })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-generar tag desde el nombre
  const handleName = (v) => {
    set('name', v)
    if (!form.tag || form.tag === slugify(form.name)) {
      set('tag', slugify(v))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res  = await apiFetch('/api/comunidad/crear', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear comunidad')
      router.replace(`/panel/comunidad`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <Loader />

  const tagValid = /^[a-z0-9-]{2,20}$/.test(form.tag)
  const canSubmit = form.name.trim() && tagValid && form.channel_url.trim() && !saving

  return (
    <>
      <Head>
        <title>Crear comunidad — LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0c0a09; color:#f1f0ef; font-family:'Barlow',sans-serif; }
        a { text-decoration:none; color:inherit; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <style jsx>{`
        .shell { display:flex; min-height:100vh; }

        /* SIDEBAR mini */
        .sidebar {
          width:220px; background:#080605;
          border-right:1px solid rgba(255,255,255,.04);
          display:flex; flex-direction:column;
          position:fixed; top:0; left:0; bottom:0; z-index:50;
        }
        .sb-logo { padding:22px 24px 18px; font-family:'Bebas Neue'; font-size:20px; letter-spacing:4px; color:#dc2626; border-bottom:1px solid rgba(255,255,255,.04); }
        .sb-back { display:flex; align-items:center; gap:8px; margin:16px 12px 0; padding:10px 10px; font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; border-radius:2px; transition:color .2s; }
        .sb-back:hover { color:#f1f0ef; }
        .sb-footer { margin-top:auto; padding:16px; border-top:1px solid rgba(255,255,255,.04); display:flex; align-items:center; gap:10px; }
        .sb-avatar { width:30px; height:30px; border-radius:50%; object-fit:cover; }
        .sb-name { font-size:13px; font-weight:600; }
        .sb-type { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; }

        /* MAIN */
        .main { margin-left:220px; flex:1; padding:40px 48px; max-width:calc(220px + 760px); }

        .page-header { margin-bottom:36px; animation:fadeUp .4s ease both; }
        .page-tag { font-family:'Barlow Condensed'; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#dc2626; margin-bottom:6px; }
        .page-title { font-family:'Bebas Neue'; font-size:40px; letter-spacing:2px; }
        .page-sub { font-size:14px; color:#6b7280; margin-top:6px; }

        /* FORM */
        form { display:flex; flex-direction:column; gap:0; }

        .section-divider {
          font-family:'Barlow Condensed'; font-size:10px; font-weight:700;
          letter-spacing:3px; text-transform:uppercase; color:#374151;
          display:flex; align-items:center; gap:12px;
          margin:28px 0 20px;
          animation:fadeUp .4s ease both;
        }
        .section-divider::after { content:''; flex:1; height:1px; background:#1a1410; }

        .field { margin-bottom:20px; animation:fadeUp .4s ease both; }
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        label { display:block; font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#6b7280; margin-bottom:8px; }
        label span { color:#dc2626; margin-left:2px; }
        .hint { font-size:12px; color:#374151; margin-top:5px; line-height:1.5; }

        input[type=text], input[type=url], textarea, select {
          width:100%; background:#0f0d0b; border:1px solid #1e1c1a; border-radius:2px;
          color:#f1f0ef; font-family:'Barlow'; font-size:14px; font-weight:500;
          padding:12px 14px; transition:border-color .2s; outline:none;
        }
        input[type=text]:focus, input[type=url]:focus, textarea:focus, select:focus {
          border-color:#dc2626;
        }
        input[type=text]::placeholder, input[type=url]::placeholder, textarea::placeholder {
          color:#374151;
        }
        textarea { resize:vertical; min-height:90px; }
        select { cursor:pointer; appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 14px center;
        }
        select option { background:#0f0d0b; }

        /* Tag preview */
        .tag-preview {
          display:inline-flex; align-items:center; gap:6px;
          margin-top:8px; padding:4px 10px;
          background:rgba(220,38,38,.08); border:1px solid rgba(220,38,38,.2);
          border-radius:2px; font-family:'Barlow Condensed'; font-size:11px;
          font-weight:700; letter-spacing:1.5px; color:#ef4444;
        }
        .tag-preview.invalid { background:rgba(239,68,68,.08); border-color:rgba(239,68,68,.2); color:#ef4444; }
        .tag-preview.valid   { background:rgba(34,197,94,.08);  border-color:rgba(34,197,94,.2);  color:#22c55e; }

        /* Access mode cards */
        .access-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .access-opt {
          background:#0f0d0b; border:2px solid #1a1410; border-radius:2px;
          padding:16px 14px; cursor:pointer; transition:all .2s; position:relative;
        }
        .access-opt:hover { border-color:#2a2018; }
        .access-opt.selected { border-color:#dc2626; background:rgba(220,38,38,.05); }
        .access-opt-title { font-family:'Barlow Condensed'; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#9ca3af; margin-bottom:4px; }
        .access-opt.selected .access-opt-title { color:#f1f0ef; }
        .access-opt-desc { font-size:12px; color:#374151; line-height:1.5; }
        .access-opt-check {
          position:absolute; top:10px; right:10px;
          width:16px; height:16px; border-radius:50%; background:#dc2626;
          display:flex; align-items:center; justify-content:center;
          font-size:9px; color:white; font-weight:900;
          opacity:0; transition:opacity .15s;
        }
        .access-opt.selected .access-opt-check { opacity:1; }

        /* Submit */
        .form-footer { margin-top:32px; display:flex; align-items:center; gap:16px; animation:fadeUp .4s ease both; }
        .btn-submit {
          font-family:'Barlow Condensed'; font-size:15px; font-weight:900;
          letter-spacing:2px; text-transform:uppercase;
          padding:14px 40px; background:#dc2626; color:white;
          border:none; border-radius:2px; cursor:pointer; transition:all .2s;
          clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
        }
        .btn-submit:hover:not(:disabled) { background:#ef4444; transform:translateY(-2px); box-shadow:0 8px 24px rgba(220,38,38,.35); }
        .btn-submit:disabled { opacity:.4; cursor:not-allowed; }
        .btn-cancel { font-family:'Barlow Condensed'; font-size:13px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#4b5563; transition:color .2s; }
        .btn-cancel:hover { color:#9ca3af; }
        .error-msg { margin-top:12px; font-size:13px; color:#ef4444; }

        @media(max-width:900px) {
          .sidebar { width:64px; }
          .sb-logo { font-size:14px; letter-spacing:0; padding:18px 10px; text-align:center; }
          .sb-back span { display:none; }
          .sb-footer .sb-name, .sb-footer .sb-type { display:none; }
          .main { margin-left:64px; padding:28px 20px; }
          .field-row { grid-template-columns:1fr; }
          .access-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sb-logo">LlamaLeague</div>
          <a href="/panel" className="sb-back">← <span>Volver al panel</span></a>
          <div className="sb-footer">
            <img src={user.avatar_url} alt="" className="sb-avatar" />
            <div>
              <div className="sb-name">{user.username}</div>
              <div className="sb-type">Streamer</div>
            </div>
          </div>
        </aside>

        {/* Contenido */}
        <main className="main">
          <div className="page-header">
            <div className="page-tag">Streamer · Setup</div>
            <h1 className="page-title">Crear Comunidad</h1>
            <p className="page-sub">Configura tu espacio en LlamaLeague. Solo necesitas hacer esto una vez.</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* IDENTIDAD */}
            <div className="section-divider">Identidad</div>

            <div className="field-row">
              <div className="field">
                <label>Nombre de la comunidad <span>*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleName(e.target.value)}
                  placeholder="ej. VaDJa Gaming"
                  maxLength={50}
                  required
                />
              </div>
              <div className="field">
                <label>Tag / URL <span>*</span></label>
                <input
                  type="text"
                  value={form.tag}
                  onChange={e => set('tag', slugify(e.target.value))}
                  placeholder="ej. vadja-gaming"
                  maxLength={20}
                  required
                />
                {form.tag && (
                  <div className={`tag-preview ${tagValid ? 'valid' : 'invalid'}`}>
                    llamaleague.vip/c/{form.tag}
                  </div>
                )}
                <p className="hint">Solo letras, numeros y guiones. 2-20 caracteres.</p>
              </div>
            </div>

            <div className="field">
              <label>Descripcion</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Cuenta de que va tu comunidad, que tipo de partidas juegan, etc."
                maxLength={300}
              />
              <p className="hint">{form.description.length}/300 caracteres</p>
            </div>

            {/* PLATAFORMA */}
            <div className="section-divider">Canal de streaming</div>

            <div className="field-row">
              <div className="field">
                <label>Plataforma <span>*</span></label>
                <select value={form.platform} onChange={e => set('platform', e.target.value)}>
                  <option value="kick">Kick</option>
                  <option value="twitch">Twitch</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div className="field">
                <label>URL de tu canal <span>*</span></label>
                <input
                  type="url"
                  value={form.channel_url}
                  onChange={e => set('channel_url', e.target.value)}
                  placeholder={
                    form.platform === 'kick'    ? 'https://kick.com/vadja' :
                    form.platform === 'twitch'  ? 'https://twitch.tv/vadja' :
                    'https://youtube.com/@vadja'
                  }
                  required
                />
              </div>
            </div>

            {/* ACCESO */}
            <div className="section-divider">Modo de acceso a salas</div>

            <div className="field">
              <label>Quien puede unirse a tus salas</label>
              <div className="access-grid">
                {[
                  { val:'open',        title:'Abierta',     desc:'Cualquier usuario registrado puede entrar a tus salas.' },
                  { val:'subs_only',   title:'Solo subs',   desc:'Solo jugadores verificados como suscriptores de tu canal.' },
                  { val:'whitelist',   title:'Lista blanca', desc:'Tu apruebas manualmente quien puede jugar.' },
                ].map(o => (
                  <div
                    key={o.val}
                    className={`access-opt ${form.access_mode === o.val ? 'selected' : ''}`}
                    onClick={() => set('access_mode', o.val)}
                  >
                    <div className="access-opt-check">✓</div>
                    <div className="access-opt-title">{o.title}</div>
                    <div className="access-opt-desc">{o.desc}</div>
                  </div>
                ))}
              </div>
              <p className="hint" style={{marginTop:10}}>Puedes cambiar esto en cualquier momento desde la configuracion de tu comunidad.</p>
            </div>

            {/* SUBMIT */}
            <div className="form-footer">
              <button type="submit" className="btn-submit" disabled={!canSubmit}>
                {saving ? 'Creando...' : 'Crear comunidad'}
              </button>
              <a href="/panel" className="btn-cancel">Cancelar</a>
            </div>
            {error && <p className="error-msg">{error}</p>}

          </form>
        </main>
      </div>
    </>
  )
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 20)
}

function Loader() {
  return (
    <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span>
    </div>
  )
}
