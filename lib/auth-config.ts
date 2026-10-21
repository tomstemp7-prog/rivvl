/**
 * Supabase Auth settings shared by the proxy and server code. Logins are
 * switched off (and every helper returns "nobody signed in") when the keys
 * are missing or are Vercel's placeholders, e.g. on a laptop.
 */
export const AUTH_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const AUTH_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const authConfigured = AUTH_URL.startsWith("https://") && AUTH_KEY.length > 30;

/** The header's "Log in" goes to the real login once this is on (after email is set up). */
export const loginLive = process.env.NEXT_PUBLIC_LOGIN_LIVE === "1";
