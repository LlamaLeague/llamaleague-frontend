// pages/_app.js
// ── App global — estilos base para todas las páginas ─────────

import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
