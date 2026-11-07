export const REALREC_ORIGIN = (import.meta.env.VITE_REALREC_ORIGIN || "https://realrec.app").replace(/\/$/, "");

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";

export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export function supabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}
