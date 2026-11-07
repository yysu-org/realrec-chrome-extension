import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

const storage = {
  getItem: async (key: string) => {
    const stored = await chrome.storage.local.get(key);
    const value = stored[key];
    return typeof value === "string" ? value : null;
  },
  setItem: async (key: string, value: string) => {
    await chrome.storage.local.set({ [key]: value });
  },
  removeItem: async (key: string) => {
    await chrome.storage.local.remove(key);
  },
};

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage,
        flowType: "pkce",
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}

export async function getAccessToken(): Promise<{ configured: boolean; token: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { configured: false, token: null };
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return { configured: true, token: null };
  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
  if (expiresAt && expiresAt < Date.now() + 30_000) {
    const refreshed = await supabase.auth.refreshSession();
    return { configured: true, token: refreshed.data.session?.access_token ?? null };
  }
  return { configured: true, token: session.access_token };
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("還沒設定 Supabase 網址與 publishable key。");
  const redirectTo = chrome.identity.getRedirectURL();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) throw new Error("登入沒有開始。");
  let responseUrl: string | undefined;
  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({ url: data.url, interactive: true });
  } catch {
    throw new Error("登入沒有完成。");
  }
  if (!responseUrl) throw new Error("登入沒有完成。");
  const returned = new URL(responseUrl);
  const code = returned.searchParams.get("code");
  if (!code) throw new Error("登入沒有完成。");
  const exchanged = await supabase.auth.exchangeCodeForSession(code);
  if (exchanged.error) throw new Error("登入沒有完成。");
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
