import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AUTH_KEY, AUTH_URL, authConfigured } from "./auth-config";
import { db } from "./db";

/** Supabase client bound to this request's login cookies (server components, actions, route handlers). */
export async function authClient() {
  const store = await cookies();
  return createServerClient(AUTH_URL, AUTH_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // Server components can't set cookies; the proxy refreshes them instead.
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {}
      },
    },
  });
}

export type Viewer = { id: string; email: string };

/** Who's signed in, or null. Verifies the login token rather than trusting the cookie. */
export async function currentUser(): Promise<Viewer | null> {
  if (!authConfigured) return null;
  const { data } = await (await authClient()).auth.getClaims();
  const claims = data?.claims;
  return claims?.sub ? { id: claims.sub, email: String(claims.email ?? "") } : null;
}

/** Links any unclaimed businesses signed up with this email to the user. */
export async function claimSites(user: Viewer) {
  const client = db();
  if (!client || !user.email) return;
  await client.from("sites").update({ owner_id: user.id }).is("owner_id", null).ilike("contact_email", user.email);
}
