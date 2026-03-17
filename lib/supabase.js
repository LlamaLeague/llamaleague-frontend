// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Cliente público (frontend)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Cliente admin (backend/API routes únicamente)
// Usa SUPABASE_SERVICE_KEY — consistente con todas las API routes del proyecto
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
