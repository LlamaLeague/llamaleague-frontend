// pages/admin/index.js — Panel Admin LlamaLeague PWA
import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

const ADMIN_STEAM_ID = '76561198412917313'

export default function Admin() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('pagos')
  const [pagos, setPagos] = useState([])
  const [salas, setSalas] = useState([])
  const [jugadores, setJugadores] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const sb_url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const sb_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const sbFetch = useCallback(async (path) => {
    const r = await fetch(`${sb_url}/rest/v1/${path}`, {
      headers: { apikey: sb_key, Authorization: `Bearer ${sb_key}` }
    })
    return r.json()
  }, [sb_url, sb_key])

  const sbPatch = useCallback(async (table, id, data) => {
    return fetch(`${sb_url}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: { apikey: sb_key, Authorization: `Bearer ${sb_key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(data)
    })
  }, [sb_url, sb_key])

  const loadAll = useCallback(async () => {
    try {
      const [p, s, j, r] = await Promise.all([
        sbFetch('payments?status=eq.pending&order=created_at.desc&select=*,user:user_id(username,avatar_url)'),
        sbFetch('lobbies?status=in.(queued,waiting,active)&order=created_at.desc&select=*,community:community_id(name,tag)'),
        sbFetch('users?select=id,username,avatar_url,type,created_at&order=created_at.desc&limit=50'),
        sbFetch('roster?approved=eq.false&select=*,user:user_id(username,avatar_url),community:community_id(name,tag)'),
      ])
      setPagos(Array.isArray(p) ? p : [])
      setSalas(Array.isArray(s) ? s : [])
      setJugadores(Array.isArray(j) ? j : [])
      setSolicitudes(Array.isArray(r) ? r : [])
    } catch(e) { console.error(e) }
  }, [sbFetch])

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(({ user }) => {
        if (!user || user.steam_id !== ADMIN_STEAM_ID) { router.replace('/'); return }
        setUser(user)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!loading && user) {
      loadAll()
      const i = setInterval(loadAll, 30000)
      return () => clearInterval(i)
    }
  }, [loading, user, loadAll])

  const showMsg = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000) }

  const aprobarPago = async (pago) => {
    await sbPatch('payments', pago.id, { status: 'approved', approved_at: new Date().toISOString() })
    const wallets = await sbFetch(`wallets?user_id=eq.${pago.user_id}`)
    if (Array.isArray(wallets) && wallets.length > 0) {
      await sbPatch('wallets', wallets[0].id, { balance: wallets[0].balance + pago.coins })
    } else {
      await fetch(`${sb_url}/rest/v1/wallets`, {
        method: 'POST',
        headers: { apikey: sb_key, Authorization: `Bearer ${sb_key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ user_id: pago.user_id, balance: pago.coins })
      })
    }
    showMsg(`✓ ${pago.coins} coins → ${pago.user?.username}`)
    loadAll()
  }

  const rechazarPago = async (pago) => { await sbPatch('payments', pago.id, { status: 'rejected' }); showMsg('✗ Pago rechazado', false); loadAll() }
  const aprobarSolicitud = async (s) => { await sbPatch('roster', s.id, { approved: true }); showMsg(`✓ ${s.user?.username} aprobado`); loadAll() }
  const rechazarSolicitud = async (s) => {
    await fetch(`${sb_url}/rest/v1/roster?id=eq.${s.id}`, { method: 'DELETE', headers: { apikey: sb_key, Authorization: `Bearer ${sb_key}` } })
    showMsg('✗ Solicitud rechazada', false); loadAll()
  }
  const cancelarSala = async (s) => { await sbPatch('lobbies', s.id, { status: 'cancelled', ended_at: new Date().toISOString() }); showMsg('✓ Sala cancelada'); loadAll() }

  if (loading) return <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',color:'#dc2626',fontFamily:'monospace'}}>Verificando acceso...</div>

  const tabs = [
    { id:'pagos',       label:'💰 Pagos',       badge: pagos.length },
    { id:'salas',       label:'🎮 Salas',        badge: salas.length },
    { id:'jugadores',   label:'👥 Jugadores',    badge: null },
    { id:'solicitudes', label:'📋 Solicitudes',  badge: solicitudes.length },
  ]
  const statusColor = { queued:'#fbbf24', waiting:'#3b82f6', active:'#22c55e' }

  return (
    <>
      <Head>
        <title>Admin — LlamaLeague</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="LL Admin" />
        <link rel="manifest" href="/admin-manifest.json" />
      </Head>
      <style jsx global>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#f1f0ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}`}</style>
      <style jsx>{`
        .app{display:flex;flex-direction:column;min-height:100vh;max-width:480px;margin:0 auto}
        .hdr{background:#111;border-bottom:1px solid #1a1a1a;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
        .hdr-title{font-size:16px;font-weight:700;letter-spacing:1px;color:#dc2626}
        .hdr-right{display:flex;align-items:center;gap:8px}
        .hdr-avatar{width:28px;height:28px;border-radius:50%}
        .hdr-name{font-size:11px;color:#6b7280}
        .tabs{display:flex;background:#111;border-bottom:1px solid #1a1a1a;overflow-x:auto}
        .tab{flex:1;min-width:80px;padding:12px 8px;text-align:center;font-size:11px;font-weight:600;color:#4b5563;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;position:relative;transition:color .15s}
        .tab.active{color:#dc2626;border-bottom-color:#dc2626}
        .badge{position:absolute;top:6px;right:6px;background:#dc2626;color:#fff;font-size:9px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center}
        .content{flex:1;padding:12px}
        .card{background:#111;border:1px solid #1a1a1a;border-radius:8px;margin-bottom:10px;overflow:hidden}
        .card-hdr{padding:12px;display:flex;align-items:center;gap:10px}
        .av{width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0}
        .ci{flex:1;min-width:0}
        .cn{font-size:13px;font-weight:600}
        .cs{font-size:11px;color:#6b7280;margin-top:2px}
        .cap{width:100%;max-height:220px;object-fit:cover}
        .coins-box{padding:8px 12px;background:#0f1a0f;border-top:1px solid #1a2a1a}
        .coins-amt{font-size:22px;font-weight:700;color:#22c55e}
        .coins-lbl{font-size:10px;color:#4b5563}
        .actions{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #1a1a1a}
        .btn{flex:1;padding:10px;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer}
        .btn-ok{background:#16a34a;color:#fff}
        .btn-no{background:#1a1a1a;color:#ef4444;border:1px solid #2a2a2a}
        .btn-warn{background:#1a1a1a;color:#fbbf24;border:1px solid #2a2a2a}
        .sala-body{padding:10px 12px}
        .sala-row{display:flex;justify-content:space-between;margin-bottom:4px}
        .sk{font-size:11px;color:#4b5563}
        .sv{font-size:11px;font-weight:600}
        .pr{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #1a1a1a}
        .pr:last-child{border-bottom:none}
        .pt{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:2px 6px;border-radius:3px}
        .pt-s{background:rgba(220,38,38,.15);color:#dc2626}
        .pt-p{background:rgba(59,130,246,.15);color:#3b82f6}
        .empty{text-align:center;padding:60px 20px;color:#374151;font-size:13px}
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:600;z-index:999;white-space:nowrap}
        .rbtn{background:none;border:none;color:#4b5563;font-size:20px;cursor:pointer;padding:4px}
      `}</style>

      <div className="app">
        <div className="hdr">
          <div className="hdr-title">⚡ LL ADMIN</div>
          <div className="hdr-right">
            <button className="rbtn" onClick={loadAll}>↻</button>
            <img src={user?.avatar_url} alt="" className="hdr-avatar" />
            <span className="hdr-name">{user?.username}</span>
          </div>
        </div>

        <div className="tabs">
          {tabs.map(t => (
            <div key={t.id} className={`tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.badge > 0 && <span className="badge">{t.badge > 9 ? '9+' : t.badge}</span>}
            </div>
          ))}
        </div>

        <div className="content">
          {tab === 'pagos' && (pagos.length === 0
            ? <div className="empty">✅ Sin pagos pendientes</div>
            : pagos.map(p => (
              <div className="card" key={p.id}>
                <div className="card-hdr">
                  <img src={p.user?.avatar_url||'/favicon.ico'} alt="" className="av" />
                  <div className="ci">
                    <div className="cn">{p.user?.username}</div>
                    <div className="cs">{new Date(p.created_at).toLocaleString('es-PE')}</div>
                  </div>
                </div>
                {p.capture_url && <img src={p.capture_url} alt="Captura Yape" className="cap" />}
                <div className="coins-box">
                  <div className="coins-amt">+{p.coins} LlamaCoins</div>
                  <div className="coins-lbl">S/ {p.amount_pen} · {p.method || 'Yape'}</div>
                </div>
                <div className="actions">
                  <button className="btn btn-ok" onClick={() => aprobarPago(p)}>✓ Aprobar</button>
                  <button className="btn btn-no" onClick={() => rechazarPago(p)}>✗ Rechazar</button>
                </div>
              </div>
            ))
          )}

          {tab === 'salas' && (salas.length === 0
            ? <div className="empty">Sin salas activas</div>
            : salas.map(s => (
              <div className="card" key={s.id}>
                <div className="card-hdr">
                  <div style={{width:36,height:36,background:'#1a1a1a',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🎮</div>
                  <div className="ci">
                    <div className="cn">{s.community?.name || 'Sin comunidad'}</div>
                    <div className="cs">#{s.id.slice(0,8).toUpperCase()}</div>
                  </div>
                  <span style={{width:8,height:8,borderRadius:'50%',background:statusColor[s.status]||'#374151',display:'inline-block'}} />
                </div>
                <div className="sala-body">
                  <div className="sala-row"><span className="sk">Modo</span><span className="sv">{s.mode?.toUpperCase()}</span></div>
                  <div className="sala-row"><span className="sk">Servidor</span><span className="sv">{s.server}</span></div>
                  <div className="sala-row"><span className="sk">Jugadores</span><span className="sv">{s.player_count||0}/10</span></div>
                  <div className="sala-row"><span className="sk">Contraseña</span><span className="sv" style={{fontFamily:'monospace',color:'#fbbf24'}}>{s.password}</span></div>
                  <div className="sala-row"><span className="sk">Estado</span><span className="sv" style={{color:statusColor[s.status]}}>{s.status}</span></div>
                </div>
                <div className="actions">
                  <button className="btn btn-warn" onClick={() => cancelarSala(s)}>Cancelar sala</button>
                </div>
              </div>
            ))
          )}

          {tab === 'jugadores' && (
            <div className="card">
              {jugadores.length === 0
                ? <div className="empty">Sin jugadores</div>
                : jugadores.map(j => (
                  <div className="pr" key={j.id}>
                    <img src={j.avatar_url||'/favicon.ico'} alt="" className="av" style={{width:32,height:32}} />
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.username}</div>
                      <div style={{fontSize:10,color:'#6b7280'}}>{new Date(j.created_at).toLocaleDateString('es-PE')}</div>
                    </div>
                    {j.type && <span className={`pt ${j.type==='streamer'?'pt-s':'pt-p'}`}>{j.type}</span>}
                  </div>
                ))
              }
            </div>
          )}

          {tab === 'solicitudes' && (solicitudes.length === 0
            ? <div className="empty">✅ Sin solicitudes pendientes</div>
            : solicitudes.map(s => (
              <div className="card" key={s.id}>
                <div className="card-hdr">
                  <img src={s.user?.avatar_url||'/favicon.ico'} alt="" className="av" />
                  <div className="ci">
                    <div className="cn">{s.user?.username}</div>
                    <div className="cs">→ <strong>{s.community?.name}</strong></div>
                  </div>
                </div>
                <div className="actions">
                  <button className="btn btn-ok" onClick={() => aprobarSolicitud(s)}>✓ Aprobar</button>
                  <button className="btn btn-no" onClick={() => rechazarSolicitud(s)}>✗ Rechazar</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {msg && <div className="toast" style={{color:msg.ok?'#22c55e':'#ef4444'}}>{msg.text}</div>}
    </>
  )
}
