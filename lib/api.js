// lib/api.js — todas las llamadas van a /api/ local (Vercel)
export function apiFetch(path, options = {}) {
  return fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}
