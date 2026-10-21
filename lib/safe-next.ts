/** Only ever redirect within Rivl after login: a relative path, never "//evil.com" or a full URL. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
