import React, { useState } from "react";
import {
  ArrowRight, ArrowLeftRight, CheckCircle2, FileText, Shield, ShieldCheck,
  Wallet, MessageCircle, Send, TrendingUp, Sparkles, Briefcase, Layers, Zap, Receipt, Loader2,
} from "lucide-react";
import { TIERS } from "../XaePay.jsx";
import { supabase, sendEmail } from "../lib/supabase.js";

// =============================================================================
// XaePay user-focused sub-pages — each pitched to one audience.
//
// Routed at xaepay.com/?p=operators, /?p=customers, /?p=providers. Lighter
// than the main homepage; designed to convert visitors who already know
// roughly which role they fit and want the direct value proposition.
// =============================================================================

const WHATSAPP_URL = "https://wa.me/15717245894";

function PageShell({ eyebrow, title, lede, primaryCta, secondaryCta, children }) {
  return (
    <div className="min-h-screen font-ui" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <div className="relative z-[60] w-full px-4 py-2 text-center text-xs sm:text-sm" style={{ background: "var(--ink)", color: "var(--bone)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: "var(--lime)" }}>Private beta</span>
        <span style={{ color: "rgba(247,245,240,0.85)" }}>Get invited when we open up. </span>
        <a href="/" className="font-semibold underline underline-offset-2" style={{ color: "var(--lime)" }}>Main site →</a>
      </div>

      <section className="relative overflow-hidden hero-mesh" style={{ color: "var(--bone)" }}>
        <div className="absolute inset-0 hero-grid" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <a href="/" className="font-mono text-[11px] uppercase tracking-wider underline" style={{ color: "rgba(247,245,240,0.5)" }}>← xaepay.com</a>
          <div className="rise mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "rgba(197,242,74,0.3)", background: "rgba(197,242,74,0.05)" }}>
            <div className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: "var(--lime)", boxShadow: "0 0 8px var(--lime)" }} />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--lime)" }}>{eyebrow}</span>
          </div>
          <h1 className="rise mt-6 font-display text-[44px] font-[450] leading-[1.05] tracking-tight sm:text-6xl">{title}</h1>
          <p className="rise mt-6 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: "rgba(247,245,240,0.65)" }}>{lede}</p>
          <div className="rise mt-10 flex flex-col gap-3 sm:flex-row">
            {primaryCta && (
              <a href={primaryCta.href} className="glow-lime inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition" style={{ background: "var(--lime)", color: "var(--ink)" }}>
                {primaryCta.label} <ArrowRight size={16} />
              </a>
            )}
            {secondaryCta && (
              <a href={secondaryCta.href} target={secondaryCta.external ? "_blank" : undefined} rel={secondaryCta.external ? "noreferrer" : undefined} className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--bone)" }}>
                {secondaryCta.icon === "wa" && <MessageCircle size={16} />}
                {secondaryCta.label}
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">{children}</div>

      <footer className="border-t" style={{ borderColor: "var(--line)", background: "var(--bone)" }}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          <div>© 2026 XaePay · Lagos · Los Angeles</div>
          <div className="flex gap-5">
            <a href="/?p=terms" style={{ color: "inherit" }} className="underline">Terms</a>
            <a href="/?p=privacy" style={{ color: "inherit" }} className="underline">Privacy</a>
            <a href="/?p=refunds" style={{ color: "inherit" }} className="underline">Refunds</a>
            <a href="/" style={{ color: "inherit" }} className="underline">Home</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ eyebrow, title, lede, children }) {
  return (
    <section className="mb-16">
      <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--emerald)" }}>{eyebrow}</div>
      <h2 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-4xl">{title}</h2>
      {lede && <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: "var(--muted)" }}>{lede}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Step({ n, title, body, footer }) {
  return (
    <div className="card-soft rounded-2xl bg-white p-6" style={{ border: "1px solid var(--line)" }}>
      <div className="font-mono text-[11px] font-medium" style={{ color: "var(--emerald)" }}>{n}</div>
      <h3 className="font-display mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
      {footer && <div className="mt-4 pt-3 font-mono text-[10px] uppercase tracking-wider" style={{ borderTop: "1px solid var(--line)", color: "var(--muted)" }}>{footer}</div>}
    </div>
  );
}

function Faq({ q, a }) {
  return (
    <details className="rounded-xl bg-white p-4" style={{ border: "1px solid var(--line)" }}>
      <summary className="cursor-pointer font-semibold text-sm">{q}</summary>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{a}</p>
    </details>
  );
}

// =============================================================================
// Operators
// =============================================================================

export function OperatorsPage() {
  return (
    <PageShell
      eyebrow="For agent operators"
      title={<>Earn on every cross-border<br/><span className="italic" style={{ color: "var(--lime)" }}>transaction you route.</span></>}
      lede="Bring your customer relationships and the compliance know-how of your wrapper. XaePay handles documentation, KYC orchestration, and provider routing. You set the rate, keep up to 70% of the markup."
      primaryCta={{ label: "Become an operator", href: "/" }}
      secondaryCta={{ label: "Talk on WhatsApp", href: WHATSAPP_URL, external: true, icon: "wa" }}
    >
      <Section eyebrow="What you get" title="The work XaePay takes off your desk">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: FileText, title: "Invoice + supporting-doc capture", body: "Customers upload their supplier invoice and trade docs in their portal. XaePay parses and pre-validates before you see the quote." },
            { icon: ShieldCheck, title: "KYC + compliance orchestration", body: "We assemble the document bundle each provider needs and push it through. You see the status without chasing it." },
            { icon: Layers, title: "Multi-provider routing", body: "Cedar is the default rail today. As more providers come online, XaePay picks the best-fit per transaction based on corridor + price." },
            { icon: Receipt, title: "Receipts + audit packs", body: "Customer receipts on payment; quarterly compliance packs assembled automatically per the tier you picked. No more scrambling at audit time." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl p-5" style={{ background: "white", border: "1px solid var(--line)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><f.icon size={18} /></div>
              <h3 className="font-display mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Tier economics" title="Pick your tier per transaction" lede="You set your customer-facing markup above the tier minimum. Your share of that markup depends on how much compliance work you want XaePay doing.">
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--line)" }}>
          <table className="w-full text-sm">
            <thead style={{ background: "var(--bone)" }}>
              <tr>
                {["Tier", "Min markup", "Your share", "XaePay does"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(TIERS).map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid var(--line)", background: "white" }}>
                  <td className="px-4 py-3 font-semibold">{t.name}</td>
                  <td className="px-4 py-3 font-mono">₦{t.minMarkup.toFixed(2)}/$</td>
                  <td className="px-4 py-3 font-mono">{(t.operatorShare * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{t.tagline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>Higher tiers shift compliance work to XaePay and the share with it. Same transaction, different tier — your judgment per deal.</p>
      </Section>

      <Section eyebrow="How it works" title="Onboard once, transact forever">
        <div className="grid gap-4 sm:grid-cols-3">
          <Step n="01" title="Apply" body="Five-step onboarding: license wrapper, business details, partner letter, risk disclosure. We verify and confirm within 1–3 business days." footer="One-time" />
          <Step n="02" title="Refer your first customer" body="Customer's KYC routes through XaePay to a licensed provider. Approval timelines: 5–15 business days." footer="Per customer · first-time" />
          <Step n="03" title="Quote, collect, settle" body="Customer messages you with a payment. You forward to XaePay, pick a tier, set your markup. They confirm, deposit NGN, provider settles." footer="Per transaction" />
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Common operator questions">
        <div className="space-y-3">
          <Faq q="Do I need to be a BDC?" a="No. Operators can be BDCs, IMTOs, MSBs, freight forwarders, customs agents, or independent agents operating under a licensed partner. The eligibility check during onboarding will surface the documentation needed for your specific setup." />
          <Faq q="Who holds the money?" a="XaePay never custodies funds. Customer NGN goes to a licensed provider's collection account; the provider executes the wire abroad. XaePay handles documentation, KYC orchestration, and routing — not custody." />
          <Faq q="How am I paid out?" a="Earnings accrue per transaction and are paid biweekly to the Nigerian bank account you provide during onboarding. Statements are downloadable from your operator dashboard." />
          <Faq q="What about CBN / SCUML / NFIU reporting?" a="Those obligations are yours. XaePay generates the documentation that supports your filings (audit packs, transaction logs, customer KYC trails) — you remain the regulated entity from your authorities' perspective." />
        </div>
      </Section>

      <div className="rounded-3xl p-8 text-center" style={{ background: "var(--ink)", color: "var(--bone)" }}>
        <h2 className="font-display text-3xl font-[450] tracking-tight">Ready to plug in?</h2>
        <p className="mt-3 text-sm" style={{ color: "rgba(247,245,240,0.7)" }}>Sign up in 4 minutes. Refer your first customer this week.</p>
        <a href="/" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition" style={{ background: "var(--lime)", color: "var(--ink)" }}>Become an operator <ArrowRight size={14} /></a>
      </div>
    </PageShell>
  );
}

// =============================================================================
// Customers
// =============================================================================

export function CustomersPage() {
  return (
    <PageShell
      eyebrow="For customers"
      title={<>Pay foreign suppliers,<br/><span className="italic" style={{ color: "var(--lime)" }}>cleanly and transparently.</span></>}
      lede="Send to your suppliers in China, US, UK, Europe, India, UAE, or anywhere your business takes you — through a vetted operator and a licensed payment provider. Locked rates, full documentation, receipt for every payment."
      primaryCta={{ label: "Send a payment", href: "/" }}
      secondaryCta={{ label: "Talk on WhatsApp", href: WHATSAPP_URL, external: true, icon: "wa" }}
    >
      <Section eyebrow="Why XaePay" title="What you actually get">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Wallet, title: "Locked-rate quotes", body: "Your operator sets a rate; you have 4 minutes to confirm at exactly that rate. No moving target, no surprise spread." },
            { icon: Shield, title: "Vetted operator + licensed provider", body: "Every Nigerian operator on the platform is verified. Every cross-border execution goes through a licensed payment provider, not an informal channel." },
            { icon: Receipt, title: "Receipts you can show", body: "Every paid invoice, every transaction, every confirmed payment generates a receipt PDF you can forward to your supplier, your bank, or your auditor." },
            { icon: FileText, title: "Compliance documentation handled", body: "Your supplier invoice, supporting trade docs, Form M references, and BOL — captured once, packaged correctly, kept on file." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl p-5" style={{ background: "white", border: "1px solid var(--line)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><f.icon size={18} /></div>
              <h3 className="font-display mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="How it works" title="Three steps">
        <div className="grid gap-4 sm:grid-cols-3">
          <Step n="01" title="Get matched with an operator" body="Tell us who you are and what you need to pay. We connect you with a vetted operator. Your operator handles KYC + onboarding with the payment provider." footer="One-time" />
          <Step n="02" title="Request a quote" body="In your portal, request a quote with the amount, recipient details, and (if you have one) the supplier's invoice. Your operator prices it and sends back a quote you have 4 minutes to approve." footer="Per transaction" />
          <Step n="03" title="Pay, receive proof" body="Deposit NGN to the funding instructions. The licensed provider executes the wire. You get a receipt + payment confirmation — forwardable to your supplier directly." footer="Same-day execution" />
        </div>
      </Section>

      <Section eyebrow="Local invoices" title="More than just cross-border" lede="Operators also use XaePay to bill you for local services and goods. Pay them via Zelle, ACH, wire, bank transfer, USSD, card link, or international wire — all from one invoice with a single 'I've paid' button.">
        <div className="rounded-2xl p-6" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: "Local payment methods", body: "Zelle, ACH, bank transfer, USSD, card link. Whichever your operator accepts." },
              { title: "Cross-border", body: "International wire via a licensed payment provider, with locked rates and trade documentation." },
              { title: "Proof of payment", body: "Upload your transfer receipt. Your operator confirms and you get a formal invoice receipt." },
            ].map((m) => (
              <div key={m.title}>
                <div className="font-display text-sm font-semibold">{m.title}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{m.body}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Common customer questions">
        <div className="space-y-3">
          <Faq q="Who actually moves my money?" a="A licensed payment provider executes the wire on your behalf. XaePay is the software layer that documents, validates, and routes. We never touch your funds." />
          <Faq q="How long does it take?" a="KYC onboarding is 5–15 business days for first-time customers (compliance review on the provider side). Once you're approved, transactions typically settle same-day after deposit." />
          <Faq q="What happens if the rate moves?" a="The rate your operator quotes is locked for 4 minutes once you approve. Confirm within the window or the quote expires and you get a fresh quote at the then-current rate." />
          <Faq q="Can I cancel a payment?" a="Before deposit, yes — just don't fund the quote. After deposit, your operator will work with the provider to attempt a recall, but it's not guaranteed once the wire is in flight." />
          <Faq q="Where can I read the legal terms?" a={<>The <a href="/?p=terms" className="underline" style={{ color: "var(--emerald)" }}>Terms of Service</a>, <a href="/?p=privacy" className="underline" style={{ color: "var(--emerald)" }}>Privacy Policy</a>, and <a href="/?p=refunds" className="underline" style={{ color: "var(--emerald)" }}>Refund Policy</a> are all linked in the footer.</>} />
        </div>
      </Section>

      <div className="rounded-3xl p-8 text-center" style={{ background: "var(--ink)", color: "var(--bone)" }}>
        <h2 className="font-display text-3xl font-[450] tracking-tight">Ready to send your first payment?</h2>
        <p className="mt-3 text-sm" style={{ color: "rgba(247,245,240,0.7)" }}>Join the waitlist — we'll match you with an operator when we open up.</p>
        <a href="/" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition" style={{ background: "var(--lime)", color: "var(--ink)" }}>Send a payment <ArrowRight size={14} /></a>
      </div>
    </PageShell>
  );
}

// =============================================================================
// Send USD to Nigeria — diaspora-focused entry point
// Distinct from /?p=customers (which covers the broader business case). This
// page is for individuals or businesses outside Nigeria holding USD who want
// to send NGN to a recipient back home.
// =============================================================================

export function SendUsdToNgnPage() {
  return (
    <PageShell
      eyebrow="USD → NGN corridor"
      title={<>Send USD to Nigeria,<br/><span className="italic" style={{ color: "var(--lime)" }}>landed in naira same day.</span></>}
      lede="If you're holding USD anywhere in the world and need to pay NGN to a recipient in Nigeria — family, supplier, contractor, school — XaePay routes you through a vetted operator and a licensed payment provider. Locked rate, transparent fees, full receipt."
      primaryCta={{ label: "Get started", href: "/?signup=diaspora" }}
      secondaryCta={{ label: "Talk on WhatsApp", href: WHATSAPP_URL, external: true, icon: "wa" }}
    >
      <Section eyebrow="Who this is for" title="The USD → NGN rail">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Diaspora individuals", body: "You're in the US, UK, Canada, or anywhere abroad, sending family support, school fees, or property payments to Nigeria." },
            { title: "US-based businesses", body: "You're paying Nigerian suppliers, contractors, or remote staff and need a clean cross-border channel with full documentation." },
            { title: "USD-holders in Nigeria", body: "You already hold USD (domiciliary account, contractor income) and need to move it to a NGN recipient locally." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl p-5" style={{ background: "white", border: "1px solid var(--line)" }}>
              <h3 className="font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="How it works" title="Four steps to NGN at the destination">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Step n="01" title="Sign up" body="Tell us who you are and who you're sending to. KYC takes 5–15 business days the first time; instant after that." footer="One-time per sender" />
          <Step n="02" title="Quote a payment" body="Pick the USD amount you're sending. Your operator quotes a locked NGN rate within minutes (typically ~₦20 less than the outbound rate)." footer="Per transaction" />
          <Step n="03" title="Send the USD" body="Wire / ACH / Zelle / card from your US (or other) account to the licensed payment provider's USD collection account. You don't send NGN — that's our problem." footer="Same-day clearing" />
          <Step n="04" title="Recipient receives NGN" body="Once your USD clears, the licensed provider executes the NGN payout to your recipient's Nigerian bank account. Receipt issued automatically." footer="Same-day landing" />
        </div>
      </Section>

      <Section eyebrow="Why XaePay" title="What you actually get">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Wallet, title: "Locked rate, no surprises", body: "The NGN your recipient gets is locked when you confirm. No spread games, no rate creep between submit and settlement." },
            { icon: Shield, title: "Licensed payment provider, not informal channels", body: "Every USD → NGN execution goes through a licensed provider regulated where they operate. Real wires, real receipts." },
            { icon: Receipt, title: "Receipt at both ends", body: "You get a sender confirmation PDF. Your recipient gets a payment confirmation. Both are downloadable from the portal." },
            { icon: FileText, title: "Documentation for both sides", body: "If you're paying a supplier and need an invoice trail, we capture and route the supplier invoice. If you're sending family support, the receipt is enough." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl p-5" style={{ background: "white", border: "1px solid var(--line)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><f.icon size={18} /></div>
              <h3 className="font-display mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Common questions from senders">
        <div className="space-y-3">
          <Faq q="What's the rate I'll get?" a={<>The inbound rate (USD → NGN) is typically ~₦20 less per dollar than the outbound rate (NGN → USD) — that gap is your operator's spread plus the provider's FX margin. It's locked when you confirm a quote, so you know exactly what your recipient gets before you send.</>} />
          <Faq q="How long does it take?" a="First-time onboarding: 5–15 business days for KYC with the licensed payment provider. Once you're approved, individual transactions typically settle the same business day after your USD clears." />
          <Faq q="How do I send the USD?" a="Wire, ACH, Zelle, or card to the provider's USD collection account. Funding instructions are delivered to you when you confirm the quote. The operator never holds your USD — funds go directly to the regulated provider." />
          <Faq q="Can I send to multiple recipients?" a="Yes. Each transaction is its own quote with its own recipient. You can also save recipients to skip re-entering details next time." />
          <Faq q="What's the operator's role?" a={<>Your operator is your XaePay-side relationship — they vet your recipients, set the rate, handle compliance documentation, and coordinate with the provider. You don't pay them directly; their margin is built into the quote rate. Read more on the <a href="/?p=operators" className="underline" style={{ color: "var(--emerald)" }}>operator page</a>.</>} />
          <Faq q="Where's the legal stuff?" a={<>The <a href="/?p=terms" className="underline" style={{ color: "var(--emerald)" }}>Terms</a>, <a href="/?p=privacy" className="underline" style={{ color: "var(--emerald)" }}>Privacy Policy</a>, and <a href="/?p=refunds" className="underline" style={{ color: "var(--emerald)" }}>Refund Policy</a> are all linked in the footer.</>} />
        </div>
      </Section>

      <div className="rounded-3xl p-8 text-center" style={{ background: "var(--ink)", color: "var(--bone)" }}>
        <h2 className="font-display text-3xl font-[450] tracking-tight">Send your first USD → NGN payment</h2>
        <p className="mt-3 text-sm" style={{ color: "rgba(247,245,240,0.7)" }}>Sign up directly — we'll match you with a vetted operator and you'll be able to request your first quote.</p>
        <a href="/?signup=diaspora" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition" style={{ background: "var(--lime)", color: "var(--ink)" }}>Get started <ArrowRight size={14} /></a>
      </div>
    </PageShell>
  );
}

// =============================================================================
// Providers
// =============================================================================

export function ProvidersPage() {
  return (
    <PageShell
      eyebrow="For licensed providers"
      title={<>Clean compliance packages<br/><span className="italic" style={{ color: "var(--lime)" }}>routed to your desk.</span></>}
      lede="Receive pre-screened KYC packages with the documents your regulators expect, the customer's stated purpose, and the operator's audit trail attached. Settle the leg; XaePay handles the orchestration and the audit pack."
      primaryCta={{ label: "Apply to onboard", href: "/?p=providers#apply" }}
      secondaryCta={{ label: "Read the MSA", href: "/?p=msa" }}
    >
      <Section eyebrow="What we deliver" title="Pre-screened, fully documented transactions">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: ShieldCheck, title: "Standardized KYC bundle", body: "Identity docs, business registration, supporting trade documents, sanctions pre-screen — formatted to the schema you specify during onboarding." },
            { icon: FileText, title: "Trade documentation captured upfront", body: "Customer's supplier invoice, BOL, customs declaration, and (where relevant) Form M reference, attached before the transaction reaches you." },
            { icon: Layers, title: "Choose your integration depth", body: "Full API integration with webhooks, or a manual portal flow for OTC providers — same package format, your call on the tech." },
            { icon: TrendingUp, title: "Volume + corridor controls", body: "Set your supported source and destination countries, supported currencies, daily caps. The routing engine respects all of them." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl p-5" style={{ background: "white", border: "1px solid var(--line)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><f.icon size={18} /></div>
              <h3 className="font-display mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Provider portal" title="The dashboard you'll work in">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl p-5" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
            <Sparkles size={16} style={{ color: "var(--emerald)" }} />
            <h3 className="font-display mt-2 text-base font-semibold">Dashboard</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Daily volume, pending KYC count, recent transactions feed. See what's flowing through you at a glance.</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
            <ShieldCheck size={16} style={{ color: "var(--emerald)" }} />
            <h3 className="font-display mt-2 text-base font-semibold">KYC queue</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Customers + recipients waiting for your review. Approve or reject with a reason; verdict is pushed back to the operator.</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
            <Wallet size={16} style={{ color: "var(--emerald)" }} />
            <h3 className="font-display mt-2 text-base font-semibold">Billing</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Monthly statements consolidating routed-volume fees. Payable by wire, ACH, or bank transfer. Full ledger transparency.</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
            <Briefcase size={16} style={{ color: "var(--emerald)" }} />
            <h3 className="font-display mt-2 text-base font-semibold">Team</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Invite your team by email with admin / member / viewer roles. They sign in once and they're in.</p>
          </div>
        </div>
      </Section>

      <Section eyebrow="How it works" title="Three steps to start receiving routed flow">
        <div className="grid gap-4 sm:grid-cols-3">
          <Step n="01" title="Onboarding diligence" body="Share your licenses, supported corridors, and integration profile. We confirm fit and reserve your slot in the routing pool." footer="One-time" />
          <Step n="02" title="Counterpart signed" body="Master Service Agreement, service levels, and pricing schedule signed by both parties. API keys / portal access provisioned." footer="One-time" />
          <Step n="03" title="Receive routed flow" body="Operators' transactions start arriving in your queue, fully documented. You review KYC, execute the leg, and statuses sync back to the operator." footer="Per transaction" />
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Common provider questions">
        <div className="space-y-3">
          <Faq q="Do I need an API?" a="No. Providers without API capability work entirely from the portal — same KYC bundle, same status workflow, no integration build. Most OTC providers operate this way." />
          <Faq q="How are fees calculated?" a="A small routing fee on the source amount of each settled transaction, snapshotted at settlement. The headline rate and billing mechanics are described in the Master Service Agreement template." />
          <Faq q="What corridors and currencies do you support?" a="Globally configurable. You set your own coverage map during onboarding (source countries, destination countries, currencies). The routing engine only sends you transactions that fit." />
          <Faq q="Where can I read the agreement?" a={<>The <a href="/?p=msa" className="underline" style={{ color: "var(--emerald)" }}>Master Service Agreement template</a> is posted publicly so you can review the terms before serious onboarding conversations.</>} />
        </div>
      </Section>

      <div id="apply">
        <Section eyebrow="Apply" title="Submit a provider application" lede="Tell us about your licenses and the corridors you cover. We review applications individually and respond within 3–5 business days.">
          <ProviderApplicationForm />
        </Section>
      </div>
    </PageShell>
  );
}

// Provider application form. Inserts into provider_applications + sends
// notification email to platform admin and confirmation email to applicant.
function ProviderApplicationForm() {
  const empty = {
    legal_entity_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    licenses_held: "",
    countries_covered: "",          // comma-separated ISO codes, parsed on submit
    currencies_supported: "",       // same
    integration_capability: "manual_portal",
    daily_volume_capacity: "",
    monthly_volume_capacity: "",
    how_did_you_hear: "",
    notes: "",
    nda_accepted: false,
  };
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const canSubmit = !!(form.legal_entity_name && form.contact_name && form.contact_email && form.licenses_held && form.nda_accepted && !submitting);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    setSubmitting(true); setError("");
    try {
      const parseList = (s) => (s || "").split(/[,\s]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);
      const payload = {
        legal_entity_name: form.legal_entity_name.trim(),
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim().toLowerCase(),
        contact_phone: form.contact_phone.trim() || null,
        licenses_held: form.licenses_held.trim(),
        countries_covered: parseList(form.countries_covered),
        currencies_supported: parseList(form.currencies_supported),
        integration_capability: form.integration_capability,
        daily_volume_capacity: form.daily_volume_capacity.trim() || null,
        monthly_volume_capacity: form.monthly_volume_capacity.trim() || null,
        how_did_you_hear: form.how_did_you_hear.trim() || null,
        notes: form.notes.trim() || null,
        nda_accepted: form.nda_accepted,
        nda_accepted_at: form.nda_accepted ? new Date().toISOString() : null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
      };
      const { error: insertErr } = await supabase.from("provider_applications").insert(payload);
      if (insertErr) throw insertErr;

      // Best-effort notification emails. Failures don't block submission.
      const summary = [
        `Legal entity: ${payload.legal_entity_name}`,
        `Contact: ${payload.contact_name} · ${payload.contact_email}${payload.contact_phone ? ` · ${payload.contact_phone}` : ""}`,
        `Licenses: ${payload.licenses_held}`,
        `Countries: ${payload.countries_covered.join(", ") || "—"}`,
        `Currencies: ${payload.currencies_supported.join(", ") || "—"}`,
        `Integration: ${payload.integration_capability}`,
        payload.daily_volume_capacity ? `Daily cap: ${payload.daily_volume_capacity}` : null,
        payload.monthly_volume_capacity ? `Monthly cap: ${payload.monthly_volume_capacity}` : null,
        payload.how_did_you_hear ? `Heard via: ${payload.how_did_you_hear}` : null,
        payload.notes ? `Notes: ${payload.notes}` : null,
      ].filter(Boolean).join("\n");
      const adminHtml = `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#fcfbf7;margin:0;padding:24px;"><div style="max-width:560px;margin:0 auto;background:white;border:1px solid #e5e7eb;border-radius:16px;padding:32px;"><h2 style="margin:0 0 8px;font-size:20px;color:#0a0b0d;">New provider application</h2><p style="color:#6b7280;font-size:13px;margin:0 0 16px;">${payload.legal_entity_name} just applied to be onboarded as a XaePay service provider.</p><pre style="background:#f5f4ee;padding:14px;border-radius:8px;font-size:12px;line-height:1.6;white-space:pre-wrap;font-family:ui-monospace,monospace;">${summary}</pre><p style="color:#6b7280;font-size:12px;margin:16px 0 0;">Review in Supabase: <code>select * from provider_applications order by created_at desc limit 5;</code></p></div></body></html>`;
      // Admin notification routes to legal@xaepay.com (a Google Workspace
      // alias that lands in Chukie's inbox).
      sendEmail({ to: "legal@xaepay.com", subject: `New provider application · ${payload.legal_entity_name}`, html: adminHtml, text: `New provider application from ${payload.legal_entity_name}.\n\n${summary}` }).catch(() => {});
      const applicantHtml = `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#fcfbf7;margin:0;padding:24px;"><div style="max-width:560px;margin:0 auto;background:white;border:1px solid #e5e7eb;border-radius:16px;padding:32px;"><h2 style="margin:0 0 8px;font-size:22px;color:#0a0b0d;">Application received</h2><p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Thanks ${payload.contact_name} — we've received the application from ${payload.legal_entity_name} and will respond within 3–5 business days.</p><p style="color:#374151;font-size:13px;">In the meantime you can review our <a href="https://xaepay.com/?p=msa" style="color:#0f5f3f;">Master Service Agreement template</a> and the <a href="https://xaepay.com/?p=providers" style="color:#0f5f3f;">provider portal overview</a>.</p><p style="color:#9ca3af;font-size:11px;margin:20px 0 0;">Questions? Reply to this email.</p></div></body></html>`;
      sendEmail({ to: payload.contact_email, subject: `Application received · XaePay`, html: applicantHtml, text: `Thanks ${payload.contact_name} — we've received your provider application from ${payload.legal_entity_name} and will respond within 3–5 business days.` }).catch(() => {});

      setSubmitted(true);
      setForm(empty);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Provider application failed:", err);
      setError(err?.message || "Couldn't submit. Try again or email legal@xaepay.com directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "var(--ink)", color: "var(--bone)" }}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}>
          <CheckCircle2 size={24} strokeWidth={2.5} style={{ color: "var(--ink)" }} />
        </div>
        <h3 className="font-display mt-4 text-2xl font-semibold">Application received</h3>
        <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: "rgba(247,245,240,0.7)" }}>
          We'll review and respond within 3–5 business days. Check the email you provided for a confirmation.
        </p>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm";
  const inputStyle = { background: "white", border: "1px solid var(--line)" };
  const labelCls = "block font-mono text-[10px] uppercase tracking-wider mb-1";
  const labelStyle = { color: "var(--muted)" };

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 space-y-5" style={{ background: "white", border: "1px solid var(--line)" }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls} style={labelStyle}>Legal entity name *</label>
          <input required className={inputCls} style={inputStyle} value={form.legal_entity_name} onChange={(e) => update("legal_entity_name", e.target.value)} placeholder="Cedar Money Inc." />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Contact name *</label>
          <input required className={inputCls} style={inputStyle} value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} placeholder="Jane Doe" />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Contact email *</label>
          <input required type="email" className={inputCls} style={inputStyle} value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} placeholder="bd@cedarmoney.com" />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Contact phone</label>
          <input className={inputCls} style={inputStyle} value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} placeholder="+1 415 ..." />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Integration capability</label>
          <select className={inputCls} style={inputStyle} value={form.integration_capability} onChange={(e) => update("integration_capability", e.target.value)}>
            <option value="full_api">Full API (REST + webhooks)</option>
            <option value="webhook_only">Webhook-only / partial API</option>
            <option value="manual_portal">Manual portal (OTC, no API)</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} style={labelStyle}>Licenses held *</label>
          <input required className={inputCls} style={inputStyle} value={form.licenses_held} onChange={(e) => update("licenses_held", e.target.value)} placeholder="e.g. US MSB #12345, UK FCA #67890, NG IMTO #..." />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Countries covered (ISO codes, comma-separated)</label>
          <input className={inputCls} style={inputStyle} value={form.countries_covered} onChange={(e) => update("countries_covered", e.target.value)} placeholder="US, GB, NG, CN" />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Currencies supported (3-letter, comma-separated)</label>
          <input className={inputCls} style={inputStyle} value={form.currencies_supported} onChange={(e) => update("currencies_supported", e.target.value)} placeholder="USD, GBP, NGN, EUR" />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Daily volume capacity</label>
          <input className={inputCls} style={inputStyle} value={form.daily_volume_capacity} onChange={(e) => update("daily_volume_capacity", e.target.value)} placeholder="$1M/day" />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Monthly volume capacity</label>
          <input className={inputCls} style={inputStyle} value={form.monthly_volume_capacity} onChange={(e) => update("monthly_volume_capacity", e.target.value)} placeholder="$20M/month" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} style={labelStyle}>How did you hear about XaePay?</label>
          <input className={inputCls} style={inputStyle} value={form.how_did_you_hear} onChange={(e) => update("how_did_you_hear", e.target.value)} placeholder="Conference, referral, search, etc." />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} style={labelStyle}>Anything else we should know?</label>
          <textarea rows={3} className={inputCls} style={inputStyle} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Specific corridors of interest, unique capabilities, timing constraints, etc." />
        </div>
      </div>
      <div className="rounded-xl p-3 flex items-start gap-3" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
        <input id="nda-checkbox" type="checkbox" checked={form.nda_accepted} onChange={(e) => update("nda_accepted", e.target.checked)} className="mt-1 flex-shrink-0" />
        <label htmlFor="nda-checkbox" className="text-xs cursor-pointer" style={{ color: "var(--ink)" }}>
          I have authority to enter into agreements on behalf of this entity, and we agree to keep confidential any non-public information XaePay shares with us during the application and onboarding process.
        </label>
      </div>
      {error && <div className="rounded-lg p-3 text-xs" style={{ background: "#fee2e2", color: "#991b1b" }}>{error}</div>}
      <div className="flex justify-end">
        <button type="submit" disabled={!canSubmit} className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition disabled:opacity-50" style={{ background: canSubmit ? "var(--ink)" : "var(--bone-2)", color: canSubmit ? "var(--lime)" : "var(--muted)" }}>
          {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <>Submit application <ArrowRight size={14} /></>}
        </button>
      </div>
    </form>
  );
}
