import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/message-forms";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Contact · Rivl" };

export default function ContactPage() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto flex max-w-[1240px] flex-wrap items-start gap-12 px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <p className="m-0 self-start rounded-full bg-data-tint px-3.5 py-2 text-sm font-semibold text-data-dark">Contact</p>
          <h1 className="m-0 font-display text-[40px] leading-[1.05] font-semibold tracking-[-1.2px] sm:text-[52px]">Talk to us</h1>
          <p className="m-0 text-lg leading-[1.55] text-body">
            Questions about Rivl, a price that looks wrong, or interest in a multi-site plan: send us a message and we’ll reply
            by email.
          </p>
          <p className="m-0 text-[15px] leading-normal text-muted">
            Prefer email? Write to [CONTACT EMAIL]. Want Rivl in your area?{" "}
            <Link href="/#waitlist" className="font-semibold text-data-dark underline hover:text-ink">
              Register your interest
            </Link>
            .
          </p>
        </div>
        <div className="min-w-0 flex-[1.4_1_480px] rounded-[28px] border border-line bg-surface px-5 py-7 sm:p-10">
          <ContactForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
