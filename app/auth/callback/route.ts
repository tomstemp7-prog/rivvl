import { NextResponse } from "next/server";
import { authClient, claimSites, currentUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

/** Login link (PKCE style): Supabase sends the browser back here with ?code=… to finish signing in. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (code) {
    const { error } = await (await authClient()).auth.exchangeCodeForSession(code);
    if (!error) {
      const user = await currentUser();
      if (user) await claimSites(user);
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
