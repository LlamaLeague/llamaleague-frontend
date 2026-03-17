# LlamaLeague — La Liga Latina de Dota 2

Plataforma de inhouses y torneos para comunidades latinas de Dota 2.

## Stack

- **Frontend/Backend**: Next.js 15 (Pages Router)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Steam OpenID (manual, sin paquete `openid`)
- **Sesiones**: iron-session v8
- **Bot Dota 2**: steam-user + dota2 (proyecto separado en `/bot`)

---

## Instalación (Next.js app)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Edita .env.local con tus claves reales

# 3. Iniciar en desarrollo
npm run dev
```

Abre http://localhost:3000

---

## Instalación (Bot)

```bash
cd bot
npm install
node index.js
```

El bot se conecta a Steam, escucha salas en Supabase con status `queued`
y crea los lobbies de Dota 2 automáticamente.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública de Supabase |
| `SUPABASE_SERVICE_KEY` | Clave service_role de Supabase (solo backend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Alias de la anterior (para lib/supabase.js) |
| `STEAM_API_KEY` | Clave de la Steam Web API |
| `NEXT_PUBLIC_URL` | URL base del proyecto (ej: http://localhost:3000) |
| `SESSION_SECRET` | Contraseña para iron-session (mínimo 32 chars) |
| `BOT_STEAM_USER` | Usuario Steam del bot |
| `BOT_STEAM_PASS` | Contraseña Steam del bot |
| `MP_ACCESS_TOKEN` | Token de Mercado Pago (opcional) |

---

## Estructura

```
pages/
  index.js                    — Landing pública
  onboarding.js               — Elegir rol (jugador / streamer)
  panel.js                    — Dashboard post-login
  comunidad/[tag].js          — Página pública de comunidad
  panel/
    comunidad/nueva.js        — Crear comunidad (streamer)
    salas/nueva.js            — Crear sala (streamer)
    salas/[id].js             — Sala activa (tiempo real)
  api/
    auth/                     — Steam OAuth, sesión, logout
    comunidad/                — CRUD comunidades
    salas/                    — CRUD + acciones de salas
    panel/stats.js            — KPIs del dashboard

lib/
  session.js                  — Helpers de iron-session
  supabase.js                 — Clientes Supabase
  ranking.js                  — Lógica de actualización de ranking

bot/
  index.js                    — Bot de Dota 2 (Node.js standalone)
```

---

## Flujo principal

1. Usuario hace clic en **Iniciar sesión** → redirige a Steam
2. Steam redirige a `/api/auth/callback` → verifica firma OpenID
3. Se crea/actualiza el usuario en Supabase + se guarda sesión
4. Si es nuevo → `/onboarding` → elige rol (jugador / streamer)
5. **Streamer**: crea comunidad → crea sala → bot crea lobby en Dota 2
6. **Jugador**: se une a la comunidad → entra a la sala → ve contraseña del lobby
7. Al terminar la partida → streamer reporta ganador → ranking se actualiza
