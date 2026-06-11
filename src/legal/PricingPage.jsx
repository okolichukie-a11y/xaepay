import React, { useState } from "react";
import { CheckCircle2, ArrowRight, Sparkles, Cpu, FileText, Layers, User, Building2, Briefcase, ShieldCheck, Zap } from "lucide-react";

// =============================================================================
// Public pricing page — /?p=pricing
// Two product lines (Invoicing + Agentic) plus a Bundle, each priced across
// four operator tiers (Individual / Business / Licensed / Enterprise).
// Currency toggle NGN ↔ USD. Anchor: ₦1,500 / $1.
// =============================================================================

const PRODUCTS = [
  { id: "invoicing", label: "Invoicing", icon: FileText, tagline: "Bill your clients · collect payments · receipts both ways" },
  { id: "agentic", label: "Agentic", icon: Cpu, tagline: "AI agents that draft your work · 6 jobs, every action approved by you" },
  { id: "bundle", label: "Bundle", icon: Layers, tagline: "Both products · save up to 18% vs separate", badge: "Save" },
];

const TIERS = [
  { id: "individual", label: "Individual", icon: User,       who: "Solo / freelance / side-gig agent. Operating under someone's license wrapper.", who_short: "Solo / freelance" },
  { id: "business",   label: "Business",   icon: Building2,  who: "Registered business (LLC / Ltd). Doing some cross-border, billing clients, or both.", who_short: "Registered SMB" },
  { id: "licensed",   label: "Licensed",   icon: ShieldCheck,who: "CBN / SEC-licensed BDC, IMTO, MSB, or equivalent in your jurisdiction.", who_short: "BDC / IMTO / MSB" },
  { id: "enterprise", label: "Enterprise", icon: Briefcase,  who: "Multi-license aggregator, large corporate finance team, or white-label reseller.", who_short: "Multi-license / aggregator" },
];

// Matrix: [product][tier] → { ngn, usd, features[], cta }
// Pricing reflects value vs. operational/HR cost the customer avoids by using XaePay.
const MATRIX = {
  invoicing: {
    individual: { ngn: 0, usd: 0, badge: "Free forever", features: [
      "5 invoices per calendar month",
      "Basic PDF + email to your client",
      "Multi-payment-method picker (Zelle / ACH / bank / USSD)",
      "Customer payment claim with proof upload",
      "Auto-issued receipt PDF on payment confirmation",
      "1 user",
    ]},
    business: { ngn: 12000, usd: 8, features: [
      "50 invoices per month",
      "Brand templates — your logo + accent color on every invoice + email",
      "Business contact block on PDF",
      "Custom payment-method instructions",
      "Audit trail of every payment claim + confirmation",
      "2 users",
      "Email support (48h response)",
    ]},
    licensed: { ngn: 35000, usd: 25, featured: true, features: [
      "Unlimited invoices",
      "Everything in Business",
      "Compliance documentation (audit pack)",
      "Multi-currency invoicing (NGN / USD / GBP / EUR / CNY)",
      "Quarterly compliance pack — pre-prepared for CBN / SCUML / NFIU",
      "Monthly + quarterly regulatory reports auto-generated",
      "5 users (multi-team)",
      "Priority email + WhatsApp support (24h response)",
    ]},
    enterprise: { ngn: null, usd: null, talk: true, features: [
      "Everything in Licensed",
      "White-label option (your brand, your URL)",
      "Unlimited users + multi-team",
      "API access + custom integrations",
      "Dedicated success manager",
      "Custom SLA + monthly business review",
      "Multi-license routing (if you operate across jurisdictions)",
    ]},
  },
  agentic: {
    individual: { ngn: 25000, usd: 17, badge: "Floor pricing covers AI cost + margin", features: [
      "1 agent — Quote Review Drafting",
      "50 agent actions per month",
      "Agent Cockpit view in operator dashboard",
      "Full audit trail of every agent decision",
      "1 user",
      "Email support",
      "₦150 / $0.10 per action overage",
    ]},
    business: { ngn: 65000, usd: 45, features: [
      "3 agents — Quote Review + KYC Chase + Invoice Review",
      "200 agent actions per month",
      "Agent Cockpit + global mode switch",
      "Full audit trail",
      "2 users",
      "Priority email support",
      "₦120 / $0.08 per action overage",
    ]},
    licensed: { ngn: 150000, usd: 100, featured: true, features: [
      "All 6 agents — adds Payment Match + Report Draft + Recurring Confirm",
      "500 agent actions per month",
      "Multi-user agent assignment",
      "5 users",
      "Priority WhatsApp support (4h response)",
      "Monthly success call with compliance lead",
      "₦100 / $0.07 per action overage",
    ]},
    enterprise: { ngn: null, usd: null, talk: true, features: [
      "All agents + custom-trained agents on your specific workflow",
      "Unlimited agent actions",
      "Multi-license / multi-jurisdiction agent routing",
      "Dedicated success manager",
      "Custom SLA + monthly business review",
      "On-call agent training updates as your flow evolves",
      "Compliance-engine fine-tuning to your regulators",
    ]},
  },
  bundle: {
    individual: { ngn: 25000, usd: 17, badge: "Invoicing free + Agentic Individual", features: [
      "Everything in Invoicing — Individual (free)",
      "Everything in Agentic — Individual",
      "Single combined account",
    ]},
    business: { ngn: 70000, usd: 48, save: "~ ₦7K saved vs separate", features: [
      "Everything in Invoicing — Business",
      "Everything in Agentic — Business",
      "Combined billing, single subscription",
    ]},
    licensed: { ngn: 170000, usd: 115, featured: true, save: "~ ₦15K saved vs separate", features: [
      "Everything in Invoicing — Licensed",
      "Everything in Agentic — Licensed",
      "Combined billing, single subscription",
      "Priority across both products",
    ]},
    enterprise: { ngn: null, usd: null, talk: true, features: [
      "Everything in Invoicing — Enterprise",
      "Everything in Agentic — Enterprise",
      "Single contract + master SLA",
      "Negotiated combined pricing",
    ]},
  },
};

const WHATSAPP_URL = "https://wa.me/15717245894";

export function PricingPage() {
  const [currency, setCurrency] = useState("NGN");
  const [product, setProduct] = useState("invoicing");

  const formatPrice = (entry) => {
    if (!entry) return { primary: "—", suffix: "" };
    if (entry.talk) return { primary: "Talk to us", suffix: "custom contract" };
    if (currency === "NGN") {
      if (entry.ngn === 0) return { primary: "₦0", suffix: "free forever" };
      return { primary: `₦${entry.ngn.toLocaleString()}`, suffix: "per month" };
    }
    if (entry.usd === 0) return { primary: "$0", suffix: "free forever" };
    return { primary: `$${entry.usd}`, suffix: "per month" };
  };

  return (
    <div className="min-h-screen font-ui" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <div className="relative z-[60] w-full px-4 py-2 text-center text-xs sm:text-sm" style={{ background: "var(--ink)", color: "var(--bone)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: "var(--lime)" }}>Private beta</span>
        <span style={{ color: "rgba(247,245,240,0.85)" }}>All paid plans launch when XaePay opens publicly. </span>
        <a href="/" className="font-semibold underline underline-offset-2" style={{ color: "var(--lime)" }}>Main site →</a>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden hero-mesh" style={{ color: "var(--bone)" }}>
        <div className="absolute inset-0 hero-grid" />
        <div className="relative mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20 text-center">
          <a href="/" className="font-mono text-[11px] uppercase tracking-wider underline" style={{ color: "rgba(247,245,240,0.5)" }}>← xaepay.com</a>
          <div className="rise mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "rgba(197,242,74,0.3)", background: "rgba(197,242,74,0.05)" }}>
            <div className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: "var(--lime)", boxShadow: "0 0 8px var(--lime)" }} />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--lime)" }}>Pricing</span>
          </div>
          <h1 className="rise mt-6 font-display text-[40px] font-[450] leading-[1.05] tracking-tight sm:text-6xl">Two products. Four tiers. <br /><span className="italic" style={{ color: "var(--lime)" }}>One price per operator size.</span></h1>
          <p className="rise mt-6 mx-auto max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: "rgba(247,245,240,0.65)" }}>
            <strong style={{ color: "var(--bone)" }}>Invoicing</strong> — bill your clients, collect, receipt. <strong style={{ color: "var(--bone)" }}>Agentic</strong> — AI agents draft your routine work and you approve. Pick one or bundle. Pricing scales with operator size, not transaction count.
          </p>

          {/* Currency toggle */}
          <div className="rise mt-8 inline-flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => setCurrency("NGN")} className="rounded-lg px-4 py-1.5 text-xs font-mono font-semibold transition" style={currency === "NGN" ? { background: "var(--lime)", color: "var(--ink)" } : { color: "rgba(247,245,240,0.6)" }}>₦ Naira</button>
            <button onClick={() => setCurrency("USD")} className="rounded-lg px-4 py-1.5 text-xs font-mono font-semibold transition" style={currency === "USD" ? { background: "var(--lime)", color: "var(--ink)" } : { color: "rgba(247,245,240,0.6)" }}>$ US Dollar</button>
          </div>
          {currency === "USD" && (
            <p className="rise mt-3 font-mono text-[10px]" style={{ color: "rgba(247,245,240,0.45)" }}>USD pricing for diaspora operators · anchored at ₦1,500/$ · billed monthly</p>
          )}
        </div>
      </section>

      {/* Product selector */}
      <div className="mx-auto max-w-screen-xl px-4 -mt-10 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {PRODUCTS.map((p) => {
            const Icon = p.icon;
            const active = product === p.id;
            return (
              <button key={p.id} onClick={() => setProduct(p.id)}
                className="card-soft rounded-2xl p-4 text-left transition relative overflow-hidden"
                style={active
                  ? { background: "var(--ink)", color: "var(--bone)", border: "2px solid var(--lime)", boxShadow: "0 8px 30px rgba(15,18,20,0.18)" }
                  : { background: "white", color: "var(--ink)", border: "1px solid var(--line)" }}>
                {active && <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-30 blur-2xl" style={{ background: "var(--lime)" }} />}
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: active ? "rgba(197,242,74,0.15)" : "var(--bone-2)", color: active ? "var(--lime)" : "var(--emerald)" }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="font-display text-base font-semibold flex items-center gap-2">
                        {p.label}
                        {p.badge && <span className="rounded-full px-1.5 py-0.5 font-mono text-[9px]" style={{ background: active ? "var(--lime)" : "var(--emerald)", color: active ? "var(--ink)" : "var(--bone)" }}>{p.badge}</span>}
                      </div>
                      <div className="text-xs mt-1" style={{ color: active ? "rgba(247,245,240,0.6)" : "var(--muted)" }}>{p.tagline}</div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier matrix */}
      <div className="mx-auto max-w-screen-xl px-4 mt-10 sm:px-6 lg:px-8 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => {
            const entry = MATRIX[product][t.id];
            const price = formatPrice(entry);
            const isFeatured = entry?.featured;
            const Icon = t.icon;
            return (
              <div key={t.id}
                className="card-soft card-lift relative overflow-hidden rounded-2xl p-6 flex flex-col"
                style={isFeatured ? { background: "var(--ink)", color: "var(--bone)", border: "2px solid var(--lime)" } : { background: "white", border: "1px solid var(--line)" }}>
                {isFeatured && <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-30 blur-2xl" style={{ background: "var(--lime)" }} />}
                {isFeatured && (
                  <div className="relative mb-3 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider" style={{ background: "var(--lime)", color: "var(--ink)" }}>
                    <Sparkles size={9} /> Most popular
                  </div>
                )}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: isFeatured ? "rgba(197,242,74,0.15)" : "var(--bone-2)", color: isFeatured ? "var(--lime)" : "var(--emerald)" }}>
                      <Icon size={13} />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: isFeatured ? "rgba(247,245,240,0.6)" : "var(--muted)" }}>Tier</div>
                  </div>
                  <div className="font-display text-2xl font-semibold">{t.label}</div>
                  <div className="mt-1 text-xs" style={{ color: isFeatured ? "rgba(247,245,240,0.7)" : "var(--muted)" }}>{t.who_short}</div>
                </div>
                <div className="relative mt-5 pt-4" style={{ borderTop: `1px solid ${isFeatured ? "rgba(255,255,255,0.08)" : "var(--line)"}` }}>
                  <div className="font-display text-3xl font-[500] tracking-tight" style={{ color: isFeatured ? "var(--lime)" : "var(--ink)" }}>
                    {price.primary}
                  </div>
                  <div className="font-mono text-[10px] mt-0.5" style={{ color: isFeatured ? "rgba(247,245,240,0.5)" : "var(--muted)" }}>{price.suffix}</div>
                  {entry?.badge && <div className="font-mono text-[10px] mt-1.5 uppercase tracking-wider" style={{ color: isFeatured ? "var(--lime)" : "var(--emerald)" }}>{entry.badge}</div>}
                  {entry?.save && <div className="font-mono text-[10px] mt-1.5 uppercase tracking-wider" style={{ color: isFeatured ? "var(--lime)" : "var(--emerald)" }}>{entry.save}</div>}
                </div>
                <ul className="relative mt-5 space-y-2 flex-1">
                  {(entry?.features || []).map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 size={11} className="mt-0.5 flex-shrink-0" style={{ color: isFeatured ? "var(--lime)" : "var(--emerald)" }} strokeWidth={2.25} />
                      <span style={{ color: isFeatured ? "rgba(247,245,240,0.85)" : "var(--ink)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={entry?.talk ? `mailto:legal@xaepay.com?subject=Enterprise%20${product}%20inquiry` : "/?signup=diaspora"}
                  className="relative mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition"
                  style={isFeatured ? { background: "var(--lime)", color: "var(--ink)" } : { background: "var(--ink)", color: "var(--bone)" }}>
                  {entry?.talk ? "Talk to us" : entry?.ngn === 0 ? "Start free" : "Subscribe"} <ArrowRight size={12} />
                </a>
              </div>
            );
          })}
        </div>

        {/* Which tier am I? guide */}
        <div className="mt-10 rounded-2xl p-6" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
          <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><Zap size={16} style={{ color: "var(--emerald)" }} /> Which tier am I?</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.id} className="rounded-xl p-3" style={{ background: "white", border: "1px solid var(--line)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={13} style={{ color: "var(--emerald)" }} />
                    <span className="font-display text-sm font-semibold">{t.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{t.who}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Value framing */}
        <div className="mt-8 rounded-2xl p-6" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <div className="flex items-start gap-3 flex-wrap">
            <Sparkles size={16} style={{ color: "var(--lime)" }} />
            <div className="text-sm flex-1 min-w-[260px]">
              <span className="font-semibold">Why Agentic is worth it.</span> <span style={{ color: "rgba(247,245,240,0.7)" }}>For a Licensed BDC doing ~100 transactions/month, the agents replace roughly 30–50 hours of compliance + chase + drafting work each month. At Lagos junior compliance-officer rates that's ₦400K–₦900K of human time saved. The ₦150K/mo Licensed tier captures a fraction of that value.</span>
            </div>
          </div>
        </div>

        {/* Cross-border + PSP note */}
        <div className="mt-8 rounded-2xl p-6 text-sm leading-relaxed" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
          <h3 className="font-display text-lg font-semibold mb-2">Cross-border payment fees · separate from subscriptions</h3>
          <p style={{ color: "var(--muted)" }}>
            The plans above cover XaePay's <strong style={{ color: "var(--ink)" }}>software</strong>. Cross-border payment transactions (NGN ↔ USD / GBP / EUR / CNY through a licensed payment provider) are priced differently:
          </p>
          <ul className="mt-3 space-y-2" style={{ color: "var(--muted)" }}>
            <li>• <strong style={{ color: "var(--ink)" }}>Operators</strong> set the customer-facing rate. Markup above wholesale is split between operator and XaePay based on tier (operator keeps 30–70%).</li>
            <li>• <strong style={{ color: "var(--ink)" }}>Customers</strong> pay nothing directly to XaePay. The markup is built into the locked rate they confirm.</li>
            <li>• <strong style={{ color: "var(--ink)" }}>Payment service providers</strong> pay XaePay a routing fee on settled volume — 8–16 bps depending on volume tier. If the PSP extends XaePay to their own operator network + end customers (white-label), the model shifts to a low marginal bps + fixed monthly platform fee. Contact us for the PSP partnership sheet.</li>
          </ul>
          <p className="mt-3" style={{ color: "var(--muted)" }}>
            More detail on operator tier economics on the <a href="/?p=operators" className="underline" style={{ color: "var(--emerald)" }}>operators page</a> · PSP partnership at <a href="/?p=providers" className="underline" style={{ color: "var(--emerald)" }}>providers</a>.
          </p>
        </div>

        {/* Trust strip */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Free forever entry tier", body: "Individual on Invoicing is free indefinitely. No card. No expiry." },
            { title: "Naira-first pricing", body: "Built for Nigeria first. NGN amounts are not currency-converted markups — they're rounded for the local market. USD is shown for diaspora operators." },
            { title: "Cancel anytime", body: "Monthly billing, downgrade or cancel from your portal. No annual lock-in." },
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
        <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
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
