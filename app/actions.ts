"use server";

import { parsePrice } from "@/lib/profile";
import { itemsFor, RADII, SECTORS } from "@/lib/sectors";
import { saveInterest, saveMessage, saveSite } from "@/lib/sites";
import { POSTCODE_SHAPE } from "@/lib/postcode";

/*
 * Server functions behind the sign-up and register-interest forms. They're
 * public endpoints, so every field is checked here, not just in the browser.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function submitSignup(input: {
  name: string;
  email: string;
  sector: string;
  postcode: string;
  radius: string;
  prices: Record<string, number>;
  extras: { label: string; price: number }[];
}): Promise<{ id: string | null } | { error: string }> {
  const name = text(input.name, 120);
  const email = text(input.email, 200);
  const sector = SECTORS.some((s) => s.label === input.sector) ? input.sector : null;
  const radius = (RADII as readonly string[]).includes(input.radius) ? input.radius : null;
  const postcode = text(input.postcode, 10).toUpperCase();
  if (!name || !EMAIL.test(email) || !sector || !radius || !POSTCODE_SHAPE.test(postcode)) return { error: "Some details are missing." };

  const allowed = new Set(itemsFor(sector).map((i) => i.id));
  const prices = Object.fromEntries(
    Object.entries(input.prices ?? {}).filter(([id, v]) => allowed.has(id) && typeof v === "number" && v >= 0 && v < 100000),
  );
  const extras = (input.extras ?? [])
    .slice(0, 20)
    .map((e) => ({ label: text(e.label, 80), price: typeof e.price === "number" ? e.price : NaN }))
    .filter((e) => e.label && e.price >= 0 && e.price < 100000);

  try {
    return { id: await saveSite({ name, email, sector, postcode, radius, prices, extras }) };
  } catch (e) {
    console.error(e);
    return { error: "We couldn’t save your details just now." };
  }
}

export async function submitInterest(form: FormData): Promise<{ ok: boolean }> {
  if (text(form.get("_gotcha"), 10)) return { ok: true }; // spam trap filled: quietly ignore
  const business = text(form.get("business"), 120);
  const email = text(form.get("email"), 200);
  const sectorRaw = text(form.get("sector"), 40);
  const sector = SECTORS.some((s) => s.label === sectorRaw) ? sectorRaw : "Gym";
  if (!business || !EMAIL.test(email)) return { ok: false };
  const postcode = text(form.get("postcode"), 10).toUpperCase();
  const priceValue = form.get("price_consent") === "yes" ? parsePrice(text(form.get("price_raw"), 20)) : null;
  try {
    await saveInterest({
      business,
      name: text(form.get("name"), 120) || null,
      email,
      phone: text(form.get("phone"), 40) || null,
      sector,
      postcode: POSTCODE_SHAPE.test(postcode) ? postcode : null,
      town: text(form.get("town"), 80) || null,
      source: text(form.get("source"), 40) || "home",
      price: priceValue !== null && priceValue < 100000 ? { itemId: itemsFor(sector)[0].id, value: priceValue } : null,
    });
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Contact form, page feedback and "correct this price", all into the messages table. */
export async function submitMessage(form: FormData): Promise<{ ok: boolean }> {
  if (text(form.get("_gotcha"), 10)) return { ok: true }; // spam trap filled: quietly ignore
  const kindRaw = text(form.get("kind"), 20);
  const kind = kindRaw === "contact" || kindRaw === "feedback" || kindRaw === "correction" ? kindRaw : null;
  if (!kind) return { ok: false };
  const email = text(form.get("email"), 200);
  const body = text(form.get("body"), 4000);
  const usefulRaw = text(form.get("useful"), 5);
  const site = text(form.get("site"), 40);
  const price = parsePrice(text(form.get("suggested_price"), 20));
  // Contact needs a way to reply and something to say; corrections need a description; feedback needs a rating or a comment.
  if (email && !EMAIL.test(email)) return { ok: false };
  if (kind === "contact" && (!email || !body)) return { ok: false };
  if (kind === "correction" && !body && price === null) return { ok: false };
  if (kind === "feedback" && !body && !usefulRaw) return { ok: false };
  try {
    await saveMessage({
      kind,
      page: text(form.get("page"), 200) || null,
      siteId: UUID.test(site) ? site : null,
      businessId: text(form.get("business_id"), 80) || null,
      itemId: text(form.get("item_id"), 40) || null,
      suggestedPrice: price !== null && price < 100000 ? price : null,
      useful: usefulRaw === "yes" ? true : usefulRaw === "no" ? false : null,
      name: text(form.get("name"), 120) || null,
      email: email || null,
      body: body || null,
    });
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}
