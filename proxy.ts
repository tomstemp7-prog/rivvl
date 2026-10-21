import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_KEY, AUTH_URL, authConfigured } from "@/lib/auth-config";

/**
 * Keeps Supabase logins fresh: refreshes an expiring session before the page
 * renders and writes the new cookies back. Does nothing when logins aren't
 * configured. Access checks happen in the pages themselves, not here.
 */
export async function proxy(request: NextRequest) {
  if (!authConfigured) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(AUTH_URL, AUTH_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/auth/:path*", "/signup/:path*"],
};
