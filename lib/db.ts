import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the secret key (never sent to browsers).
 * Returns null when the database isn't configured, e.g. on a laptop without
 * keys, so the site keeps working on URL-only profiles.
 */
let client: SupabaseClient | null | undefined;

export function db() {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Vercel won't let sensitive values be downloaded, so local copies may be placeholders.
  client = url?.startsWith("https://") && key && key.length > 30 ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}
