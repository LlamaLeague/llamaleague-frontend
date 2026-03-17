// lib/api.js
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function apiFetch(path, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}
