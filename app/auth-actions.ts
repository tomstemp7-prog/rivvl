"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient, claimSites, currentUser } from "@/lib/auth";
import { authConfigured } from "@/lib/auth-config";
import { safeNext } from "@/lib/safe-next";
import { itemsFor, RADII } from "@/lib/sectors";
import { loadSite, ownedSiteId, updateSitePrices } from "@/lib/sites";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails a one-time login code (and link). New emails get an account automatically. */
export async function sendLoginCode(emailRaw: string, nextRaw?: string): Promise<{ ok: true } | { error: string }> {
  if (!authConfigured) return { error: "Logins aren’t switched on yet." };
  const email = emailRaw.trim().toLowerCase().slice(0, 200);
  if (!EMAIL.test(email)) return { error: "Enter a valid email address." };
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const next = safeNext(nextRaw);
  const { error } = await (await authClient()).auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    console.error("sendLoginCode", error.message);
    return { error: error.status === 429 ? "Too many attempts. Please wait a minute and try again." : "We couldn’t send a code just now. Please try again." };
  }
  return { ok: true };
}

/** Checks the 6-digit code from the email and signs the user in. */
export async function verifyLoginCode(emailRaw: string, codeRaw: string): Promise<{ ok: true } | { error: string }> {
  if (!authConfigured) return { error: "Logins aren’t switched on yet." };
  const email = emailRaw.trim().toLowerCase();
  const token = codeRaw.replace(/\s+/g, "");
  if (!/^\d{6,10}$/.test(token)) return { error: "Enter the code from the email." };
  const { error } = await (await authClient()).auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: "That code didn’t work. Check it, or send a new one." };
  const user = await currentUser();
  if (user) await claimSites(user);
  return { ok: true };
}

export async function signOut() {
  if (authConfigured) await (await authClient()).auth.signOut();
  redirect("/");
}

/** Saves the signed-in owner's prices and radius. Which business is decided by the login, never by the browser. */
export async function saveMyPrices(input: { radius: string; prices: Record<string, number> }): Promise<{ ok: true } | { error: string }> {
  const user = await currentUser();
  if (!user) return { error: "Please log in again." };
  const siteId = await ownedSiteId(user.id);
  const saved = siteId ? await loadSite(siteId) : null;
  if (!siteId || !saved) return { error: "There’s no business linked to your login." };
  const radius = (RADII as readonly string[]).includes(input.radius) ? input.radius : saved.profile.radius;
  const allowed = new Set(itemsFor(saved.profile.sector).map((i) => i.id));
  const prices = Object.fromEntries(
    Object.entries(input.prices ?? {}).filter(([id, v]) => allowed.has(id) && typeof v === "number" && v >= 0 && v < 100000),
  );
  try {
    await updateSitePrices(siteId, { sector: saved.profile.sector, radius, prices });
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { error: "We couldn’t save your prices just now. Please try again." };
  }
}
