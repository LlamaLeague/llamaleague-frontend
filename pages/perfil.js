import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const TIERS = {
  'Wawa':0,'Kawsay':500,'Ayllu':1000,'Sinchi':1500,'Apu':2000,
  'Willka':3000,'Inti':4000,'Supay':5000,'Wiñay':6000,'Qhapaq':7000,
  'Apukuna':8000,'Hatun Kuraka':9000,'Inmortal':10000
}
const TIER_COLORS = {
  'Wawa':'#6b7280','Kawsay':'#22c55e','Ayllu':'#3b82f6','Sinchi':'#8b5cf6',
  'Apu':'#f59e0b','Willka':'#ef4444','Inti':'#f97316','Supay':'#dc2626',
  'Wiñay':'#7c3aed','Qhapaq':'#0891b2','Apukuna':'#be185d','Hatun Kuraka':'#854d0e','Inmortal':'#fbbf24'
}
const PAISES = ['Perú','Chile','Argentina','Brasil','Colombia','México','Ecuador','Bolivia','Venezuela','Uruguay','Paraguay']

function getTier(points) {
  const entries = Object.entries(TIERS).reverse()
  for (const [name, min] of entries) {
    if (points >= min) return name
  }
  return 'Wawa'
}

export default function Perfil() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name:'', country:'' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    fetch('/api/auth/me', { credentials:'include' })
      .then(r => r.json())
      .then(({ user }) => {
        if (!user) { router.replace('/login'); return }
        setUser(user)
        setForm({ display_name: user.display_name, country: user.country || 'Perú' })
        setLoading(false)
      })

    // Mostrar mensajes de URL
    if (router.query.steam === 'linked') setMsg({ text: '✓ Steam vinculado correctamente', ok: true })
    if (router.query.error) setMsg({ text: 'Error al vincular Steam. Intenta de nuevo.', ok: false })
  }, [router.query])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      setUser({...user, ...form})
      setEditing(false)
      setMsg({ text: '✓ Perfil actualizado', ok: true })
    } else {
      setMsg({ text: data.error, ok: false })
    }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  if (loading) return <div style={{minHeight:'100vh',background:'#0c0a09',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:4,color:'#374151'}}>CARGANDO...</span></div>

  const tier = getTier(user.points || 0)
  const tierColor = TIER_COLORS[tier] || '#6b7280'
  const winRate = user.wins + user.losses > 0 ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0

  return (
    <>
      <Head>
        <title>Perfil — LlamaLeague</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#0c0a09;color:#f1f0ef;font-family:'Barlow',sans-serif}a{text-decoration:none;color:inherit}`}</style>
      <style jsx>{`
        .shell{display:flex;min-height:100vh}
        .nav{width:220px;background:#080605;border-right:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50}
        .nav-logo{padding:22px 24px 18px;font-family:'Bebas Neue';font-size:20px;letter-spacing:4px;color:#dc2626;border-bottom:1px solid rgba(255,255,255,.04)}
        .nav-links{padding:16px 12px;flex:1}
        .nav-item{display:block;padding:10px;border-radius:2px;margin-bottom:2px;font-family:'Barlow Condensed';font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#4b5563;transition:all .15s}
        .nav-item:hover{color:#f1f0ef;background:rgba(255,255,255,.03)}
        .nav-item.active{color:#f1f0ef;background:rgba(220,38,38,.08);border-left:2px solid #dc2626}
        .nav-foot{padding:16px;border-top:1px solid rgba(255,255,255,.04);display:flex;align-items:center;gap:10px}
        .nav-av{width:30px;height:30px;border-radius:50%;object-fit:cover;background:#1a1a1a}
        .nav-name{font-size:13px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .nav-logout{font-size:12px;color:#374151;transition:color .2s;cursor:pointer}
        .nav-logout:hover{color:#dc2626}
        .main{margin-left:220px;flex:1;padding:32px 36px;max-width:820px}
        .page-tag{font-family:'Barlow Condensed';font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#dc2626;margin-bottom:4px}
        .page-title{font-family:'Bebas Neue';font-size:36px;letter-spacing:2px;margin-bottom:28px}
        .profile-card{background:#0f0d0b;border:1px solid #1a1410;border-radius:3px;padding:24px;margin-bottom:20px}
        .profile-top{display:flex;align-items:center;gap:20px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #1a1410}
        .avatar-wrap{position:relative;flex-shrink:0}
        .avatar{width:72px;height:72px;border-radius:50%;object-fit:cover;background:#1a1a1a;border:2px solid #1a1410}
        .profile-info{flex:1}
        .profile-name{font-family:'Bebas Neue';font-size:28px;letter-spacing:1px}
        .profile-country{font-size:13px;color:#6b7280;margin-top:2px}
        .tier-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:2px;margin-top:8px;font-family:'Barlow Condensed';font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase}
        .btn-edit{font-family:'Barlow Condensed';font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:8px 20px;background:transparent;color:#6b7280;border:1px solid #1e1c1a;border-radius:2px;cursor:pointer;transition:all .2s}
        .btn-edit:hover{color:#f1f0ef;border-color:#374151}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
        .stat-box{background:#080605;border:1px solid #131109;border-radius:2px;padding:14px;text-align:center}
        .stat-val{font-family:'Bebas Neue';font-size:28px;line-height:1}
        .stat-lbl{font-family:'Barlow Condensed';font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#374151;margin-top:4px}
        .steam-box{background:#080605;border:1px solid #131109;border-radius:2px;padding:16px;margin-bottom:16px}
        .steam-title{font-family:'Barlow Condensed';font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#374151;margin-bottom:12px}
        .steam-content{display:flex;align-items:center;gap:12px}
        .steam-avatar{width:44px;height:44px;border-radius:4px;object-fit:cover;background:#1a1a1a}
        .steam-name{font-size:14px;font-weight:600}
        .steam-mmr{font-size:12px;color:#6b7280;margin-top:2px}
        .verified-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);border-radius:2px;font-family:'Barlow Condensed';font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#22c55e;margin-left:auto}
        .btn-steam{font-family:'Barlow Condensed';font-size:12px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;padding:10px 24px;background:#1b2838;color:#fff;border:none;border-radius:2px;cursor:pointer;transition:background .2s;display:inline-flex;align-items:center;gap:8px}
        .btn-steam:hover{background:#2a3f5f}
        .wallet-box{background:#080605;border:1px solid #131109;border-radius:2px;padding:16px;display:flex;align-items:center;justify-content:space-between}
        .wallet-bal{font-family:'Bebas Neue';font-size:32px;color:#fbbf24}
        .wallet-lbl{font-family:'Barlow Condensed';font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#374151;margin-top:2px}
        .btn-deposit{font-family:'Barlow Condensed';font-size:13px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:10px 24px;background:#dc2626;color:#fff;border:none;border-radius:2px;cursor:pointer;transition:background .2s;clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))}
        .btn-deposit:hover{background:#ef4444}
        .edit-form{background:#080605;border:1px solid #1a1410;border-radius:2px;padding:20px;margin-bottom:16px}
        .edit-title{font-family:'Barlow Condensed';font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;margin-bottom:16px}
        .field{margin-bottom:14px}
        .label{font-family:'Barlow Condensed';font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:6px}
        .input{width:100%;background:#0c0a09;border:1px solid #1e1c1a;border-radius:2px;color:#f1f0ef;font-family:'Barlow';font-size:14px;padding:10px 12px;outline:none;transition:border-color .15s}
        .input:focus{border-color:#dc2626}
        select.input{cursor:pointer}
        .edit-actions{display:flex;gap:10px;margin-top:16px}
        .btn-save{font-family:'Barlow Condensed';font-size:12px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;padding:10px 24px;background:#dc2626;color:#fff;border:none;border-radius:2px;cursor:pointer}
        .btn-cancel{font-family:'Barlow Condensed';font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:10px 24px;background:transparent;color:#6b7280;border:1px solid #1e1c1a;border-radius:2px;cursor:pointer}
        .msg{padding:10px 14px;border-radius:2px;font-size:13px;font-weight:600;margin-bottom:16px}
        .msg-ok{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:#22c55e}
        .msg-err{background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.2);color:#ef4444}
        @media(max-width:768px){.nav{display:none}.main{margin-left:0;padding:20px 16px}.stats-grid{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      <div className="shell">
        <aside className="nav">
          <div className="nav-logo">LlamaLeague</div>
          <nav className="nav-links">
            <a href="/panel" className="nav-item">Dashboard</a>
            <a href="/salas" className="nav-item">Salas</a>
            <a href="/ranking" className="nav-item">Ranking</a>
            <a href="/perfil" className="nav-item active">Mi Perfil</a>
          </nav>
          <div className="nav-foot">
            <img src={user.steam_avatar || user.avatar_url || '/favicon.ico'} alt="" className="nav-av" />
            <span className="nav-name">{user.display_name}</span>
            <a href="/api/auth/logout" className="nav-logout">✕</a>
          </div>
        </aside>

        <main className="main">
          <div className="page-tag">Jugador</div>
          <h1 className="page-title">Mi Perfil</h1>

          {msg && <div className={`msg ${msg.ok ? 'msg-ok' : 'msg-err'}`}>{msg.text}</div>}

          <div className="profile-card">
            <div className="profile-top">
              <div className="avatar-wrap">
                <img src={user.steam_avatar || user.avatar_url || '/favicon.ico'} alt="" className="avatar" />
              </div>
              <div className="profile-info">
                <div className="profile-name">{user.display_name}</div>
                <div className="profile-country">{user.country}</div>
                <div className="tier-badge" style={{background:`${tierColor}18`, border:`1px solid ${tierColor}33`, color: tierColor}}>
                  {tier} · {user.points || 0} pts
                </div>
              </div>
              {!editing && (
                <button className="btn-edit" onClick={() => setEditing(true)}>Editar perfil</button>
              )}
            </div>

            {editing && (
              <div className="edit-form">
                <div className="edit-title">Editar perfil</div>
                <div className="field">
                  <label className="label">Nick de jugador</label>
                  <input className="input" value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} maxLength={20} />
                </div>
                <div className="field">
                  <label className="label">País</label>
                  <select className="input" value={form.country} onChange={e => setForm({...form, country: e.target.value})}>
                    {PAISES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="edit-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
                  <button className="btn-cancel" onClick={() => setEditing(false)}>Cancelar</button>
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-val" style={{color:'#22c55e'}}>{user.wins || 0}</div>
                <div className="stat-lbl">Victorias</div>
              </div>
              <div className="stat-box">
                <div className="stat-val" style={{color:'#ef4444'}}>{user.losses || 0}</div>
                <div className="stat-lbl">Derrotas</div>
              </div>
              <div className="stat-box">
                <div className="stat-val" style={{color:'#fbbf24'}}>{winRate}%</div>
                <div className="stat-lbl">Win rate</div>
              </div>
              <div className="stat-box">
                <div className="stat-val">{(user.wins || 0) + (user.losses || 0)}</div>
                <div className="stat-lbl">Partidas</div>
              </div>
            </div>

            {user.steam_id ? (
              <div className="steam-box">
                <div className="steam-title">Steam vinculado</div>
                <div className="steam-content">
                  <img src={user.steam_avatar || '/favicon.ico'} alt="" className="steam-avatar" />
                  <div>
                    <div className="steam-name">{user.steam_name || 'Steam'}</div>
                    <div className="steam-mmr">{user.mmr_estimate || 0} MMR estimado · {user.dota_hours || 0}h jugadas</div>
                  </div>
                  <div className="verified-badge">✓ verificado</div>
                </div>
              </div>
            ) : (
              <div className="steam-box">
                <div className="steam-title">Steam no vinculado</div>
                <p style={{fontSize:13,color:'#6b7280',marginBottom:14}}>Vincula tu cuenta de Steam para poder unirte a salas. Solo se hace una vez.</p>
                <a href="/api/auth/steam-link" className="btn-steam">Vincular Steam</a>
              </div>
            )}

            <div className="wallet-box">
              <div>
                <div className="wallet-bal">{user.lc_balance || 0} LC</div>
                <div className="wallet-lbl">LlamaCoins disponibles</div>
              </div>
              <button className="btn-deposit" onClick={() => router.push('/depositar')}>+ Depositar</button>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
