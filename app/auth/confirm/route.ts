import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { authClient, claimSites, currentUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

/** Login link (token style, from Rivl's email template): ?token_hash=…&type=email signs the user in. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  const next = safeNext(url.searchParams.get("next"));
  if (tokenHash) {
    const { error } = await (await authClient()).auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      const user = await currentUser();
      if (user) await claimSites(user);
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
