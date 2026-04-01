// pages/registro.js — Redirige al login que ahora maneja registro también
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Registro() {
  const router = useRouter()
  useEffect(() => { router.replace('/login?panel=register') }, [])
  return null
}
