import React, { useState } from "react";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

// =============================================================================
// Public pricing page — /?p=pricing
// Hardcoded tiers for now (easy to edit; rarely changes). NGN/USD toggle
// switches the displayed prices using fixed rate references — anchor ₦1,500/$.
// =============================================================================

const PRICING_TIERS = [
  {
    id: "free",
    name: "Free",
    ngn: 0,
    usd: 0,
    tagline: "Get started, no card required",
    invoiceLimit: 3,
    features: [
      "3 invoices per calendar month",
      "Basic invoice PDF + email to your client",
      "Multi-payment-method picker (Zelle, ACH, bank transfer, etc.)",
      "Customer-side payment claim with proof upload",
      "Operator-confirms-payment flow",
    ],
    ctaLabel: "Start free",
    ctaHref: "/?signup=diaspora",
  },
  {
    id: "starter",
    name: "Starter",
    ngn: 3000,
    usd: 2,
    tagline: "For solo operators + small businesses",
    invoiceLimit: 25,
    features: [
      "25 invoices per month",
      "Everything in Free",
      "Brand template — your logo + accent color on every invoice",
      "Business contact block on PDF + email",
      "Email support",
    ],
    ctaLabel: "Subscribe",
    ctaHref: "/?signup=diaspora",
  },
  {
    id: "pro",
    name: "Pro",
    ngn: 9000,
    usd: 6,
    tagline: "For growing businesses",
    invoiceLimit: 100,
    featured: true,
    features: [
      "100 invoices per month",
      "Everything in Starter",
      "AI compliance review on each invoice (RFI prevention)",
      "Auto-issued receipt PDF on payment confirmation",
      "Quarterly compliance pack for audit",
      "Priority email support (24h response)",
    ],
    ctaLabel: "Go Pro",
    ctaHref: "/?signup=diaspora",
  },
  {
    id: "business",
    name: "Business",
    ngn: 25000,
    usd: 16,
    tagline: "For high-volume operators",
    invoiceLimit: null,
    features: [
      "Unlimited invoices",
      "Everything in Pro",
      "Recipient receipts auto-issued for cross-border payouts",
      "Multi-user team access (up to 5 seats)",
      "Dedicated WhatsApp support line",
      "Quarterly call with the XaePay team",
    ],
    ctaLabel: "Talk to us",
    ctaHref: "mailto:legal@xaepay.com?subject=Business%20plan%20inquiry",
  },
  {
    id: "agentic",
    name: "Agentic",
    ngn: 50000,
    usd: 33,
    tagline: "Operator runs on AI agents",
    invoiceLimit: null,
    features: [
      "Everything in Business",
      "AI Operator Agent — drafts quote responses for every customer request",
      "AI KYC Agent — drafts personalised reminders for missing/expiring docs",
      "AI Payment Match Agent — reads proof images, drafts confirms",
      "AI Report Agent — drafts regulatory filings + flags unusual patterns",
      "500 agent actions / month included (₦100 per action overage)",
      "Agent Cockpit · global mode switch · full audit trail",
      "Priority WhatsApp support + monthly success call",
    ],
    ctaLabel: "Try Agentic",
    ctaHref: "mailto:legal@xaepay.com?subject=Agentic%20plan%20inquiry",
  },
];

const WHATSAPP_URL = "https://wa.me/15717245894";

export function PricingPage() {
  const [currency, setCurrency] = useState("NGN");
  const formatPrice = (tier) => {
    if (currency === "NGN") {
      if (tier.ngn === 0) return { primary: "₦0", suffix: "free forever" };
      return { primary: `₦${tier.ngn.toLocaleString()}`, suffix: "per month" };
    }
    if (tier.usd === 0) return { primary: "$0", suffix: "free forever" };
    return { primary: `$${tier.usd}`, suffix: "per month" };
  };

  return (
    <div className="min-h-screen font-ui" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <div className="relative z-[60] w-full px-4 py-2 text-center text-xs sm:text-sm" style={{ background: "var(--ink)", color: "var(--bone)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: "var(--lime)" }}>Private beta</span>
        <span style={{ color: "rgba(247,245,240,0.85)" }}>All paid plans launch when XaePay opens publicly. </span>
        <a href="/" className="font-semibold underline underline-offset-2" style={{ color: "var(--lime)" }}>Main site →</a>
      </div>

      <section className="relative overflow-hidden hero-mesh" style={{ color: "var(--bone)" }}>
        <div className="absolute inset-0 hero-grid" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20 text-center">
          <a href="/" className="font-mono text-[11px] uppercase tracking-wider underline" style={{ color: "rgba(247,245,240,0.5)" }}>← xaepay.com</a>
          <div className="rise mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "rgba(197,242,74,0.3)", background: "rgba(197,242,74,0.05)" }}>
            <div className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: "var(--lime)", boxShadow: "0 0 8px var(--lime)" }} />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--lime)" }}>Pricing</span>
          </div>
          <h1 className="rise mt-6 font-display text-[40px] font-[450] leading-[1.05] tracking-tight sm:text-6xl">Simple pricing<br /><span className="italic" style={{ color: "var(--lime)" }}>for any business size.</span></h1>
          <p className="rise mt-6 mx-auto max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: "rgba(247,245,240,0.65)" }}>Start free. Upgrade only when you need it. Cross-border payment fees are separate — operators set their own markup; XaePay does not charge customers a transaction fee.</p>

          {/* Currency toggle */}
          <div className="rise mt-8 inline-flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => setCurrency("NGN")} className="rounded-lg px-4 py-1.5 text-xs font-mono font-semibold transition" style={currency === "NGN" ? { background: "var(--lime)", color: "var(--ink)" } : { color: "rgba(247,245,240,0.6)" }}>₦ Naira</button>
            <button onClick={() => setCurrency("USD")} className="rounded-lg px-4 py-1.5 text-xs font-mono font-semibold transition" style={currency === "USD" ? { background: "var(--lime)", color: "var(--ink)" } : { color: "rgba(247,245,240,0.6)" }}>$ US Dollar</button>
          </div>
          {currency === "USD" && (
            <p className="rise mt-3 font-mono text-[10px]" style={{ color: "rgba(247,245,240,0.45)" }}>USD prices anchored at ₦1,500/$ · billed in your local currency</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 -mt-8 sm:px-6 lg:px-8 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_TIERS.map((tier, i) => {
            const price = formatPrice(tier);
            const isFeatured = tier.featured;
            return (
              <div key={tier.id}
                className="card-soft card-lift relative overflow-hidden rounded-2xl p-6 flex flex-col"
                style={isFeatured ? { background: "var(--ink)", color: "var(--bone)", border: "2px solid var(--lime)" } : { background: "white", border: "1px solid var(--line)" }}>
                {isFeatured && <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-30 blur-2xl" style={{ background: "var(--lime)" }} />}
                {isFeatured && (
                  <div className="relative mb-3 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider" style={{ background: "var(--lime)", color: "var(--ink)" }}>
                    <Sparkles size={9} /> Most popular
                  </div>
                )}
                <div className="relative">
                  <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: isFeatured ? "rgba(247,245,240,0.6)" : "var(--muted)" }}>Tier {i + 1}</div>
                  <div className="font-display mt-1 text-2xl font-semibold">{tier.name}</div>
                  <div className="mt-1 text-xs" style={{ color: isFeatured ? "rgba(247,245,240,0.7)" : "var(--muted)" }}>{tier.tagline}</div>
                </div>
                <div className="relative mt-5 pt-4" style={{ borderTop: `1px solid ${isFeatured ? "rgba(255,255,255,0.08)" : "var(--line)"}` }}>
                  <div className="font-display text-3xl font-[500] tracking-tight" style={{ color: isFeatured ? "var(--lime)" : "var(--ink)" }}>
                    {price.primary}
                  </div>
                  <div className="font-mono text-[10px] mt-0.5" style={{ color: isFeatured ? "rgba(247,245,240,0.5)" : "var(--muted)" }}>{price.suffix}</div>
                </div>
                <ul className="relative mt-5 space-y-2 flex-1">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 size={11} className="mt-0.5 flex-shrink-0" style={{ color: isFeatured ? "var(--lime)" : "var(--emerald)" }} strokeWidth={2.25} />
                      <span style={{ color: isFeatured ? "rgba(247,245,240,0.85)" : "var(--ink)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href={tier.ctaHref} className="relative mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition"
                  style={isFeatured ? { background: "var(--lime)", color: "var(--ink)" } : { background: "var(--ink)", color: "var(--bone)" }}>
                  {tier.ctaLabel} <ArrowRight size={12} />
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl p-6 text-sm leading-relaxed" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
          <h3 className="font-display text-lg font-semibold mb-2">Cross-border payment fees</h3>
          <p style={{ color: "var(--muted)" }}>
            The plans above cover XaePay's <strong style={{ color: "var(--ink)" }}>invoicing software</strong> for billing your own clients (Zelle, ACH, bank transfer, etc.). Cross-border payment transactions (NGN → USD or USD → NGN through a licensed payment provider) work differently:
          </p>
          <ul className="mt-3 space-y-2" style={{ color: "var(--muted)" }}>
            <li>• Your operator sets the rate; the markup over wholesale is split between them and XaePay based on the operator's chosen tier (operator keeps 30–70%).</li>
            <li>• Customers pay nothing directly to XaePay on cross-border transactions. The markup is built into the locked rate they see.</li>
            <li>• Licensed payment providers pay XaePay a routing fee on settled volume. This is a B2B arrangement, invisible to customers and operators.</li>
          </ul>
          <p className="mt-3" style={{ color: "var(--muted)" }}>
            More detail on operator tier economics on the <a href="/?p=operators" className="underline" style={{ color: "var(--emerald)" }}>operators page</a>.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Free forever", body: "3 invoices/month, no card, no expiry. Use it as long as you want." },
            { title: "Naira-first pricing", body: "We're Nigeria-focused. Prices in NGN are not currency-converted markups — they're rounded for affordability." },
            { title: "Cancel anytime", body: "Monthly billing, cancel from your portal. No annual lock-in. Switch tiers up or down as your volume changes." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--line)" }}>
              <div className="font-display text-sm font-semibold">{f.title}</div>
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm" style={{ color: "var(--muted)" }}>Questions about pricing or need a custom plan for your business?</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold" style={{ background: "var(--ink)", color: "var(--bone)" }}>
            Talk on WhatsApp <ArrowRight size={12} />
          </a>
        </div>
      </div>

      <footer className="border-t" style={{ borderColor: "var(--line)", background: "var(--bone)" }}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
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
