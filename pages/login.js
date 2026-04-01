import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [panel, setPanel] = useState('login')

  useEffect(() => {
    if (router.query.panel === 'register') setPanel('register')
  }, [router.query])

  const [loginForm, setLoginForm]     = useState({ email: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError]   = useState(null)

  const [regForm, setRegForm]     = useState({ display_name: '', email: '', password: '', country: 'Perú' })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError]   = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true); setLoginError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(loginForm),
    })
    const data = await res.json()
    if (!res.ok) { setLoginError(data.error); setLoginLoading(false); return }
    router.push('/panel')
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegLoading(true); setRegError(null)
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regForm),
    })
    const data = await res.json()
    if (!res.ok) { setRegError(data.error); setRegLoading(false); return }
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: regForm.email, password: regForm.password }),
    })
    if (loginRes.ok) router.push('/onboarding')
    else { setRegError('Cuenta creada. Inicia sesión.'); setRegLoading(false) }
  }

  return (
    <>
      <Head>
        <title>LlamaLeague — Acceso</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0c0a09; font-family:'Barlow',sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; }
        a { text-decoration:none; color:inherit; }
        @keyframes slideIn  { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideOut { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>

      <style jsx>{`
        .back {
          position:fixed; top:20px; left:24px;
          font-family:'Barlow Condensed'; font-size:11px; font-weight:700;
          letter-spacing:2px; text-transform:uppercase; color:#374151; transition:color .2s;
        }
        .back:hover { color:#9ca3af; }

        .wrap {
          width:100%; max-width:860px; min-height:520px;
          display:flex; border-radius:4px; overflow:hidden;
          box-shadow:0 32px 80px rgba(0,0,0,.7); margin:24px 16px;
        }

        /* LEFT */
        .left {
          width:320px; flex-shrink:0;
          background:linear-gradient(145deg,#dc2626 0%,#7f1d1d 100%);
          padding:48px 36px; display:flex; flex-direction:column;
          justify-content:center; position:relative; overflow:hidden;
        }
        .left::after {
          content:'LL'; position:absolute; bottom:-20px; right:-16px;
          font-family:'Bebas Neue'; font-size:200px; letter-spacing:-8px;
          color:rgba(0,0,0,.12); line-height:1; pointer-events:none;
        }
        .left-logo {
          font-family:'Bebas Neue'; font-size:22px; letter-spacing:6px;
          color:rgba(255,255,255,.8); margin-bottom:40px;
        }
        .left-title {
          font-family:'Bebas Neue'; font-size:38px; letter-spacing:2px;
          color:white; line-height:1.05; margin-bottom:12px;
        }
        .left-sub {
          font-size:14px; color:rgba(255,255,255,.65); line-height:1.65;
          margin-bottom:36px; max-width:210px;
        }
        .left-btn {
          font-family:'Barlow Condensed'; font-size:12px; font-weight:900;
          letter-spacing:2.5px; text-transform:uppercase; padding:11px 28px;
          background:transparent; border:2px solid rgba(255,255,255,.5); color:white;
          border-radius:2px; cursor:pointer; transition:all .2s; width:fit-content;
          clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
        }
        .left-btn:hover { background:rgba(255,255,255,.12); border-color:white; }
        .dots { display:flex; gap:6px; margin-top:auto; padding-top:40px; }
        .dot {
          height:7px; border-radius:4px; background:rgba(255,255,255,.3);
          cursor:pointer; transition:all .25s;
        }
        .dot.on { background:white; }

        /* RIGHT */
        .right {
          flex:1; background:#0f0d0b; padding:48px 44px;
          display:flex; flex-direction:column; justify-content:center;
        }
        .form-tag {
          font-family:'Barlow Condensed'; font-size:10px; font-weight:700;
          letter-spacing:4px; text-transform:uppercase; color:#dc2626; margin-bottom:6px;
        }
        .form-title {
          font-family:'Bebas Neue'; font-size:34px; letter-spacing:2px;
          color:#f1f0ef; margin-bottom:4px;
        }
        .form-sub { font-size:13px; color:#4b5563; margin-bottom:26px; }

        .field { margin-bottom:13px; }
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .label {
          font-family:'Barlow Condensed'; font-size:10px; font-weight:700;
          letter-spacing:2px; text-transform:uppercase; color:#4b5563;
          display:block; margin-bottom:6px;
        }
        .input {
          width:100%; background:#080605; border:1px solid #1e1c1a; border-radius:2px;
          color:#f1f0ef; font-family:'Barlow'; font-size:14px; padding:10px 13px;
          outline:none; transition:border-color .15s;
        }
        .input:focus { border-color:#dc2626; }
        .input::placeholder { color:#2a2418; }

        .btn-submit {
          width:100%; margin-top:6px; padding:13px;
          font-family:'Barlow Condensed'; font-size:14px; font-weight:900;
          letter-spacing:2.5px; text-transform:uppercase;
          background:#dc2626; color:white; border:none; border-radius:2px;
          cursor:pointer; transition:all .2s;
          clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .btn-submit:hover:not(:disabled) { background:#ef4444; transform:translateY(-1px); box-shadow:0 6px 24px rgba(220,38,38,.35); }
        .btn-submit:disabled { opacity:.4; cursor:not-allowed; }

        .error {
          background:rgba(220,38,38,.08); border:1px solid rgba(220,38,38,.2);
          border-radius:2px; padding:9px 12px; font-size:13px; color:#ef4444; margin-bottom:14px;
        }
        .divider { display:flex; align-items:center; gap:12px; margin:18px 0 14px; }
        .div-line { flex:1; height:1px; background:#1a1410; }
        .div-text {
          font-family:'Barlow Condensed'; font-size:10px; font-weight:700;
          letter-spacing:2px; text-transform:uppercase; color:#2a2418;
        }
        .switch-txt { text-align:center; font-size:13px; color:#374151; }
        .switch-link { color:#dc2626; cursor:pointer; font-weight:600; transition:color .15s; }
        .switch-link:hover { color:#ef4444; }

        @media(max-width:600px) {
          .left { display:none; }
          .wrap { max-width:400px; }
          .right { padding:36px 24px; }
          .field-row { grid-template-columns:1fr; }
        }
      `}</style>

      <a href="/" className="back">← Inicio</a>

      <div className="wrap">
        {/* IZQUIERDA */}
        <div className="left">
          <div className="left-logo">LlamaLeague</div>
          {panel === 'login' ? (
            <>
              <div className="left-title">¿Eres nuevo aquí?</div>
              <div className="left-sub">Únete a la liga latina de Dota 2. Es gratis y tarda menos de un minuto.</div>
              <button className="left-btn" onClick={() => setPanel('register')}>Crear cuenta</button>
            </>
          ) : (
            <>
              <div className="left-title">¿Ya tienes cuenta?</div>
              <div className="left-sub">Inicia sesión para acceder a tu panel, salas y ranking.</div>
              <button className="left-btn" onClick={() => setPanel('login')}>Iniciar sesión</button>
            </>
          )}
          <div className="dots">
            <div className={`dot ${panel === 'login' ? 'on' : ''}`} style={{width: panel==='login' ? 22 : 7}} onClick={() => setPanel('login')} />
            <div className={`dot ${panel === 'register' ? 'on' : ''}`} style={{width: panel==='register' ? 22 : 7}} onClick={() => setPanel('register')} />
          </div>
        </div>

        {/* DERECHA */}
        <div className="right">
          {panel === 'login' ? (
            <div style={{animation:'slideOut .28s ease both'}}>
              <div className="form-tag">Acceso</div>
              <div className="form-title">Bienvenido de vuelta</div>
              <div className="form-sub">Ingresa tus datos para continuar</div>

              {loginError && <div className="error">{loginError}</div>}

              <form onSubmit={handleLogin}>
                <div className="field">
                  <label className="label">Correo electrónico</label>
                  <input className="input" type="email" placeholder="tu@email.com"
                    value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required />
                </div>
                <div className="field">
                  <label className="label">Contraseña</label>
                  <input className="input" type="password" placeholder="••••••••"
                    value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
                </div>
                <button className="btn-submit" disabled={loginLoading}>
                  {loginLoading ? 'Ingresando...' : 'Iniciar sesión'}
                  {!loginLoading && <span style={{fontSize:16}}>→</span>}
                </button>
              </form>

              <div className="divider"><div className="div-line"/><span className="div-text">o</span><div className="div-line"/></div>
              <div className="switch-txt">
                ¿No tienes cuenta?{' '}
                <span className="switch-link" onClick={() => setPanel('register')}>Regístrate gratis</span>
              </div>
            </div>
          ) : (
            <div style={{animation:'slideIn .28s ease both'}}>
              <div className="form-tag">Registro</div>
              <div className="form-title">Crear cuenta</div>
              <div className="form-sub">Únete y demuestra tu nivel en Dota 2</div>

              {regError && <div className="error">{regError}</div>}

              <form onSubmit={handleRegister}>
                <div className="field-row">
                  <div className="field">
                    <label className="label">Nick de jugador</label>
                    <input className="input" placeholder="ej. Qhapaq99"
                      value={regForm.display_name} onChange={e => setRegForm({...regForm, display_name: e.target.value})}
                      maxLength={20} required />
                  </div>
                  <div className="field">
                    <label className="label">País</label>
                    <select className="input" value={regForm.country} onChange={e => setRegForm({...regForm, country: e.target.value})}>
                      {['Perú','Chile','Argentina','Brasil','Colombia','México','Ecuador','Bolivia','Venezuela','Uruguay','Paraguay'].map(p =>
                        <option key={p}>{p}</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Correo electrónico</label>
                  <input className="input" type="email" placeholder="tu@email.com"
                    value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} required />
                </div>
                <div className="field">
                  <label className="label">Contraseña</label>
                  <input className="input" type="password" placeholder="Mínimo 8 caracteres"
                    value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})}
                    minLength={8} required />
                </div>
                <button className="btn-submit" disabled={regLoading}>
                  {regLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                  {!regLoading && <span style={{fontSize:16}}>→</span>}
                </button>
              </form>

              <div className="divider"><div className="div-line"/><span className="div-text">o</span><div className="div-line"/></div>
              <div className="switch-txt">
                ¿Ya tienes cuenta?{' '}
                <span className="switch-link" onClick={() => setPanel('login')}>Iniciar sesión</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
