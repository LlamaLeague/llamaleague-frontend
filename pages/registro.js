import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'

const PAISES = ['Perú','Chile','Argentina','Brasil','Colombia','México','Ecuador','Bolivia','Venezuela','Uruguay','Paraguay']
const TIERS = ['Wawa','Kawsay','Ayllu','Sinchi','Apu','Willka','Inti','Supay','Wiñay','Qhapaq','Apukuna','Hatun Kuraka','Inmortal']

export default function Registro() {
  const router = useRouter()
  const [form, setForm] = useState({ email:'', password:'', display_name:'', country:'Perú' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    // Auto login
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: form.email, password: form.password })
    })
    if (loginRes.ok) router.push('/perfil')
    else { setError('Error al iniciar sesión'); setLoading(false) }
  }

  return (
    <>
      <Head>
        <title>Registro — LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#0c0a09;color:#f1f0ef;font-family:'Barlow',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}a{text-decoration:none;color:inherit}`}</style>
      <style jsx>{`
        .wrap{width:100%;max-width:420px;padding:24px 16px}
        .logo{text-align:center;margin-bottom:32px}
        .logo-box{width:52px;height:52px;background:#dc2626;border-radius:6px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue';font-size:22px;letter-spacing:2px;color:#fff;clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))}
        .logo-title{font-family:'Bebas Neue';font-size:28px;letter-spacing:4px;color:#f1f0ef}
        .logo-sub{font-family:'Barlow Condensed';font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#4b5563;margin-top:4px}
        .card{background:#0f0d0b;border:1px solid #1a1410;border-radius:4px;padding:28px}
        .card-title{font-family:'Bebas Neue';font-size:24px;letter-spacing:2px;margin-bottom:4px}
        .card-sub{font-size:13px;color:#6b7280;margin-bottom:24px}
        .field{margin-bottom:16px}
        .label{font-family:'Barlow Condensed';font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:6px}
        .input{width:100%;background:#080605;border:1px solid #1e1c1a;border-radius:2px;color:#f1f0ef;font-family:'Barlow';font-size:14px;padding:10px 12px;outline:none;transition:border-color .15s}
        .input:focus{border-color:#dc2626}
        .input::placeholder{color:#374151}
        select.input{cursor:pointer}
        .btn{width:100%;font-family:'Barlow Condensed';font-size:14px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:12px;background:#dc2626;color:#fff;border:none;border-radius:2px;cursor:pointer;transition:background .2s;clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));margin-top:8px}
        .btn:hover:not(:disabled){background:#ef4444}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .error{background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.2);border-radius:2px;padding:10px 12px;font-size:13px;color:#ef4444;margin-bottom:16px}
        .footer{text-align:center;margin-top:16px;font-size:13px;color:#4b5563}
        .link{color:#dc2626;cursor:pointer}
        .link:hover{color:#ef4444}
        .hint{font-size:11px;color:#374151;margin-top:4px}
      `}</style>
      <div className="wrap">
        <div className="logo">
          <div className="logo-box">LL</div>
          <div className="logo-title">LlamaLeague</div>
          <div className="logo-sub">La Liga Latina de Dota 2</div>
        </div>
        <div className="card">
          <div className="card-title">Crear cuenta</div>
          <div className="card-sub">Únete a la liga y demuestra tu nivel</div>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Nick de jugador</label>
              <input className="input" placeholder="ej. Qhapaq99" value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} maxLength={20} required />
              <div className="hint">Este será tu nombre en la plataforma. Puedes cambiarlo después.</div>
            </div>
            <div className="field">
              <label className="label">País</label>
              <select className="input" value={form.country} onChange={e => setForm({...form, country: e.target.value})}>
                {PAISES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Correo electrónico</label>
              <input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="field">
              <label className="label">Contraseña</label>
              <input className="input" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={8} required />
            </div>
            <button className="btn" disabled={loading}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</button>
          </form>
          <div className="footer">
            ¿Ya tienes cuenta? <a className="link" href="/login">Inicia sesión</a>
          </div>
        </div>
      </div>
    </>
  )
}
