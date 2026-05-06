import React, { useState, useEffect, createContext, useContext } from "react";
import {
  MessageCircle, Shield, FileText, CheckCircle2, AlertTriangle, ArrowRight,
  ArrowUpRight, Upload, Search, Bell, ChevronRight, Menu, X, Package, Receipt,
  BarChart3, Zap, Eye, Download, Send, Filter, Plus, History, LogIn,
  ExternalLink, Sparkles, User, Building2, Briefcase, Coins, Lock, Unlock,
  ArrowLeft, ArrowLeftRight, Loader2, Layers, TrendingUp, Wallet, DollarSign, Mail,
} from "lucide-react";
import { supabase, sendWhatsAppText, fetchCedarRate, submitCustomerToCedar } from "./lib/supabase.js";
import { useAuth } from "./lib/auth.js";

// ─── Editable in one place ────────────────────────────────────────────────
// Swap these when you have real values. Search for "TODO:" to find them.
const WHATSAPP_NUMBER_NG = "2348149571908"; // Nigeria — primary brand number
const WHATSAPP_NUMBER_US = "12673618234"; // US — used in diaspora-specific surfaces
const WHATSAPP_NUMBER = WHATSAPP_NUMBER_NG;
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const WHATSAPP_URL_US = `https://wa.me/${WHATSAPP_NUMBER_US}`;

// Operator-facing display gates. When SHOW_TRIPLE_A is false the operator dashboard
// renders only the Cedar rail (named generically) and the funding-method selector is
// hidden. The Triple-A code paths still compute — flip this to true to bring it back.
const SHOW_TRIPLE_A = false;
const PARTNER_DISPLAY_NAME = "Licensed payment partner";

// Per-transaction service tiers. Each tier sets a minimum markup (₦/$) and a margin split
// between the operator and XaePay. The operator picks a tier on each quote — lower tiers
// leave more validation work to the operator (and pay them more), higher tiers shift work
// (and a larger margin share) to XaePay.
const TIERS = {
  basic:      { id: "basic",      name: "Basic",          minMarkup: 0.50, operatorShare: 0.75, xaepayShare: 0.25, tagline: "Light send · for small / price-competitive transactions",       monthlyFloor: 10000,  monthlyCeiling: 25000 },
  standard:   { id: "standard",   name: "Standard",       minMarkup: 1.50, operatorShare: 0.70, xaepayShare: 0.30, tagline: "You validate invoices · we execute",                          monthlyFloor: 25000,  monthlyCeiling: 50000 },
  verified:   { id: "verified",   name: "Verified",       minMarkup: 2.50, operatorShare: 0.65, xaepayShare: 0.35, tagline: "We check invoices · reject + reason for fixes",               monthlyFloor: 50000,  monthlyCeiling: 200000 },
  documented: { id: "documented", name: "Documented",     minMarkup: 3.50, operatorShare: 0.60, xaepayShare: 0.40, tagline: "Full validation + audit pack per transaction",                monthlyFloor: 200000, monthlyCeiling: 500000 },
  pro:        { id: "pro",        name: "Compliance Pro", minMarkup: 4.50, operatorShare: 0.55, xaepayShare: 0.45, tagline: "Deep validation + quarterly compliance pack",                  monthlyFloor: 500000, monthlyCeiling: null },
};

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

      :root {
        --ink: #0a0b0d; --ink-2: #18191c;
        --bone: #f7f5f0; --bone-2: #efeae0;
        --paper: #fcfbf7; --line: #e5e1d6;
        --emerald: #0f5f3f; --emerald-deep: #074030;
        --lime: #c5f24a; --amber: #d4a82c;
        --muted: #6b6a65;
      }

      html, body, #root { background: var(--paper); }
      .font-display { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01', 'ss02'; letter-spacing: -0.02em; }
      .font-ui { font-family: 'Inter Tight', -apple-system, sans-serif; letter-spacing: -0.01em; }
      .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

      @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      .rise { animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .fade-in { animation: fade-in 0.5s ease both; }
      .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
      .spin { animation: spin 1s linear infinite; }

      .hero-mesh { background: radial-gradient(ellipse 80% 60% at 20% 20%, rgba(197,242,74,0.10), transparent 60%), radial-gradient(ellipse 70% 50% at 80% 30%, rgba(15,95,63,0.35), transparent 60%), radial-gradient(ellipse 100% 80% at 50% 100%, rgba(212,168,44,0.08), transparent 70%), linear-gradient(180deg, #0a0b0d 0%, #131418 100%); }
      .hero-grid { background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 56px 56px; mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%); }
      .card-soft { box-shadow: 0 1px 1px rgba(10,11,13,0.02), 0 2px 4px rgba(10,11,13,0.03), 0 8px 24px rgba(10,11,13,0.04); }
      .card-lift { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease; }
      .card-lift:hover { transform: translateY(-2px); box-shadow: 0 2px 2px rgba(10,11,13,0.03), 0 6px 12px rgba(10,11,13,0.05), 0 16px 40px rgba(10,11,13,0.08); }
      .border-gradient-dark { background: linear-gradient(var(--ink), var(--ink)) padding-box, linear-gradient(135deg, rgba(197,242,74,0.6), rgba(15,95,63,0.2)) border-box; border: 1px solid transparent; }
      .glow-lime:hover { box-shadow: 0 0 0 1px rgba(197,242,74,0.5), 0 8px 24px rgba(197,242,74,0.15); }
      .noise::before { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); opacity: 0.4; pointer-events: none; mix-blend-mode: overlay; }
      input:focus, select:focus, textarea:focus { outline: none; }
      .focus-ring:focus-within { box-shadow: 0 0 0 3px rgba(15,95,63,0.12); border-color: var(--emerald); }
      html { scroll-behavior: smooth; }
      ::selection { background: rgba(197,242,74,0.35); color: var(--ink); }
      .scan-line { position: relative; overflow: hidden; }
      .scan-line::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(197,242,74,0.4), transparent); animation: scan 1.4s ease-in-out infinite; }
    `}</style>
  );
}

const ToastContext = createContext({ push: () => {} });
const useToast = () => useContext(ToastContext);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (message, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  };
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2 font-ui">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 shadow-2xl"
            style={{ animation: "rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
              background: t.tone === "success" ? "var(--ink)" : t.tone === "warn" ? "#fef3c7" : "var(--paper)",
              color: t.tone === "success" ? "var(--bone)" : "var(--ink)",
              borderColor: t.tone === "success" ? "var(--ink)" : t.tone === "warn" ? "#fcd34d" : "var(--line)",
            }}>
            {t.tone === "success" && <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={12} style={{ color: "var(--ink)" }} strokeWidth={2.5} /></div>}
            {t.tone === "info" && <Bell size={14} className="mt-0.5 flex-shrink-0" />}
            {t.tone === "warn" && <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />}
            <span className="text-sm leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const width = size === "lg" ? "max-w-3xl" : size === "sm" ? "max-w-md" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 font-ui fade-in">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: "rgba(10,11,13,0.45)" }} onClick={onClose} />
      <div className={`relative w-full ${width} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col`} style={{ animation: "rise 0.45s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
        <div className="flex items-start justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid var(--line)" }}>
          <h3 className="font-display text-xl font-semibold" style={{ color: "var(--ink)" }}>{title}</h3>
          <button onClick={onClose} className="text-stone-400 transition hover:text-stone-900"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Drawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex font-ui fade-in">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: "rgba(10,11,13,0.45)" }} onClick={onClose} />
      <div className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:w-[480px]" style={{ animation: "rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
        <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: "1px solid var(--line)" }}>
          <h3 className="font-display text-xl font-semibold" style={{ color: "var(--ink)" }}>{title}</h3>
          <button onClick={onClose} className="text-stone-400 transition hover:text-stone-900"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// Human-friendly relative timestamp for table rows ("12 min ago", "Today · 14:22").
function relativeTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// ─── Quote-link encoding ──────────────────────────────────────────────────
// Quote details ride in the URL so the customer-side approval page works without a backend.
// btoa/atob handle base64; we strip URL-unsafe chars and padding for clean URLs.
const encodeQuoteToken = (data) => {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch { return ""; }
};
const decodeQuoteToken = (token) => {
  try {
    const padded = token.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch { return null; }
};

export default function XaePay() {
  return (<><GlobalStyles /><ToastProvider><AppShell /></ToastProvider></>);
}

function AppShell() {
  // All hooks must be called unconditionally — declare them up top.
  const parseQuoteUrl = (raw) => {
    if (!raw) return null;
    // UUID v4-ish? → DB-backed quote, fetch via RPC
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
      return { dbToken: raw };
    }
    // Else try to decode as base64 (legacy path before Slice 4)
    const data = decodeQuoteToken(raw);
    return data ? { ...data, dbToken: null } : null;
  };
  const [quoteRoute, setQuoteRoute] = useState(() => {
    if (typeof window === "undefined") return null;
    return parseQuoteUrl(new URLSearchParams(window.location.search).get("quote"));
  });
  const [onboardRoute, setOnboardRoute] = useState(() => {
    if (typeof window === "undefined") return null;
    const t = new URLSearchParams(window.location.search).get("onboard");
    return t ? decodeQuoteToken(t) : null;
  });
  const [view, setView] = useState("landing");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false); // legacy multi-role picker (kept for direct callers)
  const [becomePartnerOpen, setBecomePartnerOpen] = useState(false); // MVP 4-step partner onboarding
  const [signInOpen, setSignInOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingType, setOnboardingType] = useState(null);
  const [session, setSession] = useState({ type: null, tier: 0, name: null, company: null });
  const auth = useAuth();
  // Reconcile real auth user → session: when a magic-link visitor lands signed-in,
  // hydrate the local session from their user_metadata so dashboards work without onboarding.
  // Simpler-MVP rule: every signed-in user is an operator. Route them straight to the
  // operator dashboard if they're still on the landing page when auth resolves.
  useEffect(() => {
    if (!auth.user) return;
    const meta = auth.user.user_metadata || {};
    setSession((prev) => prev.type ? prev : ({
      type: "bdc",
      tier: meta.tier ?? 1,
      name: meta.name || meta.company || auth.user.email,
      company: meta.company || null,
      email: auth.user.email,
      authUserId: auth.user.id,
    }));
    setView((prev) => (prev === "landing" ? "bdc" : prev));
  }, [auth.user]);
  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("quote");
      const o = params.get("onboard");
      setQuoteRoute(parseQuoteUrl(q));
      setOnboardRoute(o ? decodeQuoteToken(o) : null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // After all hooks: now we can branch.
  if (quoteRoute) return <QuoteApprovalPage quote={quoteRoute} />;
  if (onboardRoute) return <CustomerOnboardPage invite={onboardRoute} />;

  const startOnboarding = (type) => { setOnboardingType(type); setOnboardingOpen(true); setAccessOpen(false); };
  const completeOnboarding = (data) => {
    setSession(data); setOnboardingOpen(false);
    if (data.type === "business" || data.type === "individual") setView("customer");
    else if (data.type === "bdc" || data.type === "agent") setView("bdc");
    else if (data.type === "lp") setView("lp");
    else if (data.type === "diaspora") setView("diaspora");
  };

  return (
    <div className="min-h-screen font-ui" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <PreviewBanner onWaitlist={() => setWaitlistOpen(true)} />
      <TopBar view={view} setView={setView} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onSignIn={() => setSignInOpen(true)} onRequestAccess={() => setBecomePartnerOpen(true)} onWaitlist={() => setWaitlistOpen(true)} session={session} authUser={auth.user} onSignOut={async () => { await auth.signOut(); setSession({ type: null, tier: 0, name: null, company: null }); setView("landing"); }} />
      {view === "landing" && <Landing setView={setView} onRequestAccess={() => setBecomePartnerOpen(true)} onWaitlist={() => setWaitlistOpen(true)} />}
      {view === "customer" && <CustomerApp session={session} />}
      {view === "bdc" && <BDCDashboard session={session} />}
      {view === "lp" && <LPDashboard session={session} />}
      {view === "diaspora" && <DiasporaApp session={session} />}
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      <BecomePartnerModal open={becomePartnerOpen} onClose={() => setBecomePartnerOpen(false)} onComplete={(data) => { setBecomePartnerOpen(false); completeOnboarding(data); }} />
      <RequestAccessModal open={accessOpen} onClose={() => setAccessOpen(false)} onChoose={startOnboarding} onWaitlist={() => { setAccessOpen(false); setWaitlistOpen(true); }} />
      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
      {onboardingOpen && <OnboardingFlow type={onboardingType} onClose={() => setOnboardingOpen(false)} onComplete={completeOnboarding} onSwitchType={(t) => setOnboardingType(t)} />}
    </div>
  );
}

function QuoteApprovalPage({ quote: initialQuote }) {
  const { push } = useToast();
  // dbToken means the quote lives in Supabase; legacy quotes are inline-decoded payloads.
  const isDbBacked = !!initialQuote?.dbToken;
  const [quote, setQuote] = useState(initialQuote);
  const [loading, setLoading] = useState(isDbBacked);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState(() => new URLSearchParams(window.location.search).get("approved") === "1" ? "approved" : null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Fetch DB-backed quote on mount; for legacy in-URL quotes we already have the data.
  useEffect(() => {
    if (!isDbBacked) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_quote", { p_token: initialQuote.dbToken });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        // eslint-disable-next-line no-console
        console.error("get_quote failed:", error);
        setQuote(null);
      } else {
        const row = data[0];
        setQuote({
          dbToken: initialQuote.dbToken,
          id: `QU-${row.id.slice(0, 4).toUpperCase()}`,
          customer: row.customer_name,
          amount: parseFloat(row.amount),
          currency: row.currency,
          rate: parseFloat(row.rate),
          ngnTotal: row.ngn_total,
          rail: row.rail,
          settlement: row.settlement_text,
          beneficiary: row.beneficiary,
          bdcName: row.bdc_name,
          expiresAt: row.expires_at,
          status: row.status,
        });
        if (row.status === "customer_approved") setDecision("approved");
        else if (row.status === "customer_declined") setDecision("declined");
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isDbBacked, initialQuote?.dbToken]);

  // Countdown
  useEffect(() => {
    if (!quote?.expiresAt) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((new Date(quote.expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    if (decision) return;
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [quote?.expiresAt, decision]);

  const expired = secondsLeft <= 0 && decision !== "approved" && !loading;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const approve = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (isDbBacked) {
      const { error } = await supabase.rpc("approve_quote", { p_token: initialQuote.dbToken });
      setSubmitting(false);
      if (error) {
        push(error.message || "Couldn't approve — try again.", "warn");
        return;
      }
    } else {
      setSubmitting(false);
    }
    setDecision("approved");
    const url = new URL(window.location.href);
    url.searchParams.set("approved", "1");
    window.history.replaceState({}, "", url);
    push("Quote approved.", "success");
  };
  const decline = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (isDbBacked) {
      const { error } = await supabase.rpc("decline_quote", { p_token: initialQuote.dbToken });
      setSubmitting(false);
      if (error) {
        push(error.message || "Couldn't decline — try again.", "warn");
        return;
      }
    } else {
      setSubmitting(false);
    }
    setDecision("declined");
    push("Quote declined.", "info");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-ui" style={{ background: "var(--paper)", color: "var(--muted)" }}>
        <div className="flex items-center gap-2"><Loader2 size={16} className="spin" /> Loading quote…</div>
      </div>
    );
  }
  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center font-ui px-6 text-center" style={{ background: "var(--paper)", color: "var(--ink)" }}>
        <div>
          <h1 className="font-display text-2xl font-semibold">Quote not found</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>This link may have expired or been mistyped. Message your operator on WhatsApp for a fresh quote.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ background: "var(--ink)", color: "var(--bone)" }}><MessageCircle size={14} /> WhatsApp</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-ui flex flex-col" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      {/* Compact branded header (no full nav — this is a customer surface) */}
      <header className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, var(--emerald), var(--emerald-deep))" }}>
            <span className="font-display text-lg font-semibold" style={{ color: "var(--lime)" }}>X</span>
          </div>
          <span className="font-display text-[20px] font-semibold tracking-tight">XaePay</span>
        </div>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><MessageCircle size={13} /> Help</a>
      </header>

      <main className="mx-auto w-full max-w-xl px-5 py-10 sm:py-14 flex-1">
        <SectionEyebrow>Trade payment quote</SectionEyebrow>
        <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-4xl">
          {decision === "approved" ? "You approved this quote." : decision === "declined" ? "Quote declined." : expired ? "This quote has expired." : `Hello ${quote.customer || "there"},`}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          {decision === "approved" ? `${quote.bdcName || "Your operator"} will execute and notify you on WhatsApp once the wire is on its way.`
            : decision === "declined" ? "We've recorded your decline. Your operator will reach out if you want to renegotiate."
            : expired ? "Rates move every few seconds. Reply to your operator on WhatsApp for a fresh quote."
            : `${quote.bdcName || "Your operator"} has prepared this trade payment for your approval. Review the details below — once you approve, the wire executes.`}
        </p>

        {!decision && !expired && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wider" style={{ background: secondsLeft < 60 ? "#fef3c7" : "var(--bone)", color: secondsLeft < 60 ? "#92400e" : "var(--muted)", border: `1px solid ${secondsLeft < 60 ? "#fcd34d" : "var(--line)"}` }}>
            <div className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: secondsLeft < 60 ? "#92400e" : "var(--emerald)" }} />
            Quote valid for {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        )}

        <div className="card-soft mt-7 rounded-2xl p-6 relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: "var(--lime)" }} />
          <div className="relative">
            <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.55)" }}>You will pay</div>
            <div className="font-display mt-1 text-5xl font-[500] tracking-tight" style={{ color: "var(--lime)" }}>₦{Math.round(quote.ngnTotal || (quote.rate * quote.amount)).toLocaleString()}</div>
            <div className="mt-1 font-mono text-xs" style={{ color: "rgba(247,245,240,0.65)" }}>For ${parseFloat(quote.amount).toLocaleString()} {quote.currency || "USD"} delivered to {quote.beneficiary || "your beneficiary"}</div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-xs pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div><div className="font-mono uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.5)" }}>Rate</div><div className="font-mono mt-0.5 font-semibold">₦{parseFloat(quote.rate).toFixed(2)} / $</div></div>
              <div><div className="font-mono uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.5)" }}>Settlement</div><div className="font-mono mt-0.5 font-semibold">{quote.settlement || "T+0"}</div></div>
              <div><div className="font-mono uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.5)" }}>Routing rail</div><div className="font-mono mt-0.5 font-semibold">{quote.rail || "Auto"}</div></div>
              <div><div className="font-mono uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.5)" }}>Quote ref</div><div className="font-mono mt-0.5 font-semibold">{quote.id || "—"}</div></div>
            </div>
          </div>
        </div>

        {!decision && !expired && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <button onClick={approve} disabled={submitting} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition glow-lime disabled:opacity-50" style={{ background: "var(--lime)", color: "var(--ink)" }}>
              {submitting ? <><Loader2 size={16} className="spin" /> Approving…</> : <><CheckCircle2 size={16} strokeWidth={2.5} /> Approve & execute</>}
            </button>
            <button onClick={decline} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition disabled:opacity-50" style={{ background: "white", border: "1px solid var(--line)", color: "var(--ink)" }}>
              Decline
            </button>
          </div>
        )}

        {decision === "approved" && (
          <>
            <div className="mt-6 rounded-2xl p-5" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "var(--emerald)", color: "var(--lime)" }}><CheckCircle2 size={18} strokeWidth={2.5} /></div>
                <div className="text-sm">
                  <div className="font-semibold" style={{ color: "var(--ink)" }}>Approved · ref {quote.id}</div>
                  <p className="mt-1" style={{ color: "var(--muted)" }}>Reply <span className="font-mono font-semibold">YES {quote.id}</span> on WhatsApp to your operator so they can submit the order to the rail.</p>
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition" style={{ background: "var(--ink)", color: "var(--bone)" }}><MessageCircle size={14} /> Reply on WhatsApp</a>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>What happens next</div>
              <ol className="space-y-2.5">
                {[
                  { n: 1, title: "Your operator submits to the rail", body: `${quote.bdcName || "Your operator"} sends the order to ${quote.rail || "the chosen rail"}. Typically within minutes of your YES.` },
                  { n: 2, title: "Funds move on the rail", body: `The wire executes. Settlement window for this quote is ${quote.settlement || "T+0"}.` },
                  { n: 3, title: "You get a confirmation receipt", body: "Your operator sends you the MT103 / settlement reference on WhatsApp once funds clear at the beneficiary." },
                ].map((s) => (
                  <li key={s.n} className="flex items-start gap-3 rounded-xl p-4" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ background: "var(--ink)", color: "var(--lime)" }}>{s.n}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{s.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{s.body}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}

        {(expired || decision === "declined") && (
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition w-full" style={{ background: "var(--ink)", color: "var(--bone)" }}>
            <MessageCircle size={14} /> Message your operator on WhatsApp
          </a>
        )}

        <div className="mt-10 rounded-xl p-4 text-xs" style={{ background: "var(--bone)", border: "1px solid var(--line)", color: "var(--muted)" }}>
          <div className="flex items-start gap-2">
            <Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
            <p>XaePay is a software and compliance layer. The actual payment is executed by {quote.bdcName || "your licensed operator"} via our licensed payment partner. XaePay does not custody your funds.</p>
          </div>
        </div>
      </main>

      <footer className="px-5 py-6 text-center font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)", borderTop: "1px solid var(--line)" }}>© XaePay · xaepay.com</footer>
    </div>
  );
}

function CustomerOnboardPage({ invite }) {
  const { push } = useToast();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    fullName: invite?.customer || "",
    bvn: "",
    bvnVerified: false,
    idType: "NIN",
    idNumber: "",
    idUploaded: false,
    address: "",
    addressUploaded: false,
  });
  const [verifying, setVerifying] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const verifyBVN = () => {
    if (!data.bvn || data.bvn.length < 5) return;
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setData((d) => ({ ...d, bvnVerified: true, fullName: d.fullName || "Adeyemi Okafor" })); push("BVN verified · NIBSS returned identity match", "success"); }, 1500);
  };

  const submit = () => {
    setSubmitted(true);
    push("Onboarding submitted to your operator", "success");
  };

  return (
    <div className="min-h-screen font-ui flex flex-col" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <header className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, var(--emerald), var(--emerald-deep))" }}>
            <span className="font-display text-lg font-semibold" style={{ color: "var(--lime)" }}>X</span>
          </div>
          <span className="font-display text-[20px] font-semibold tracking-tight">XaePay</span>
        </div>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><MessageCircle size={13} /> Help</a>
      </header>

      <main className="mx-auto w-full max-w-xl px-5 py-10 sm:py-14 flex-1">
        <SectionEyebrow>Customer onboarding</SectionEyebrow>
        <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-4xl">
          {submitted ? "We're reviewing your details." : `Hello ${invite?.customer || "there"},`}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          {submitted
            ? `${invite?.bdcName || "Your operator"} will be in touch on WhatsApp once your KYC is approved (usually within a few hours during business hours).`
            : `${invite?.bdcName || "Your operator"} invited you to onboard. Three quick steps — about 4 minutes. Your information is encrypted and goes only to your operator.`}
        </p>

        {!submitted && (
          <>
            <div className="mt-7"><OnboardingStepper step={step} steps={["Identity", "ID document", "Confirm"]} /></div>

            <div className="mt-6">
              {step === 1 && (
                <Card>
                  <h2 className="font-display text-xl font-semibold">Verify your identity</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>BVN lookup is instant — no documents needed at this step.</p>
                  <div className="mt-6 space-y-4">
                    <Field label="Full name (as on your bank account)"><Input value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} placeholder="Your full legal name" /></Field>
                    <div>
                      <Label>BVN (Bank Verification Number)</Label>
                      <div className="flex gap-2">
                        <Input value={data.bvn} onChange={(e) => setData({ ...data, bvn: e.target.value, bvnVerified: false })} placeholder="22XXXXXXXXX" />
                        <button onClick={verifyBVN} disabled={verifying || !data.bvn} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50" style={{ background: "var(--ink)", color: "var(--bone)" }}>{verifying ? <><Loader2 size={14} className="spin" /> Verifying</> : "Verify"}</button>
                      </div>
                      {data.bvnVerified && (
                        <div className="mt-3 rise rounded-xl p-3" style={{ background: "var(--ink)", color: "var(--bone)" }}>
                          <div className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--lime)" }} strokeWidth={2.5} /><span className="text-sm">Identity confirmed: <span className="font-semibold">{data.fullName}</span></span></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end"><PrimaryBtn onClick={() => setStep(2)} disabled={!data.bvnVerified}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
                </Card>
              )}
              {step === 2 && (
                <Card>
                  <h2 className="font-display text-xl font-semibold">Photo ID</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Snap or upload your government-issued ID. The number must match what we just verified.</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field label="ID type"><Select value={data.idType} onChange={(e) => setData({ ...data, idType: e.target.value })}><option>NIN</option><option>Passport</option><option>Driver's License</option><option>Voter's Card</option></Select></Field>
                    <Field label="ID number"><Input value={data.idNumber} onChange={(e) => setData({ ...data, idNumber: e.target.value })} placeholder="Number on the card / passport" /></Field>
                  </div>
                  <div className="mt-4">
                    <UploadRow label="Photo of your ID + selfie" sublabel="Phone-camera quality is fine — or send via WhatsApp to your operator" done={data.idUploaded} onClick={() => { setData({ ...data, idUploaded: true }); push("Photo received", "success"); }} />
                  </div>
                  <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(1)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(3)} disabled={!data.idNumber || !data.idUploaded}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
                </Card>
              )}
              {step === 3 && (
                <Card>
                  <h2 className="font-display text-xl font-semibold">Confirm and submit</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Quick check — does this look right?</p>
                  <dl className="mt-5 overflow-hidden rounded-xl" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
                    <Row label="Full name" value={data.fullName} />
                    <Row label="BVN" value={`••••${data.bvn.slice(-4)}`} mono sub="Verified" />
                    <Row label="ID" value={`${data.idType} · ${data.idNumber}`} mono sub="Photo received" />
                    <Row label="Onboarding via" value={invite?.bdcName || "Your operator"} sub={invite?.tier || "—"} />
                  </dl>
                  <div className="mt-5 rounded-xl p-4 text-xs" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
                    <div className="flex items-start gap-2">
                      <Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
                      <p style={{ color: "var(--ink)" }}>By submitting you agree your data is shared with {invite?.bdcName || "your operator"} for KYC under CBN rules. XaePay processes the submission as a software vendor — we never custody funds and you remain a customer of the licensed operator.</p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(2)}>Back</SecondaryBtn><PrimaryBtn onClick={submit}>Submit onboarding <Sparkles size={14} /></PrimaryBtn></div>
                </Card>
              )}
            </div>
          </>
        )}

        {submitted && (
          <div className="mt-7 rounded-2xl p-7 relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--bone)" }}>
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: "var(--lime)" }} />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={24} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
              <h2 className="font-display mt-5 text-[24px] font-[450] tracking-tight">Submitted to {invite?.bdcName || "your operator"}.</h2>
              <p className="mt-2 text-sm" style={{ color: "rgba(247,245,240,0.7)" }}>You'll get a WhatsApp notification once your KYC is approved. After that you can request trade payment quotes anytime.</p>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition glow-lime" style={{ background: "var(--lime)", color: "var(--ink)" }}><MessageCircle size={14} /> Message your operator</a>
            </div>
          </div>
        )}
      </main>

      <footer className="px-5 py-6 text-center font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)", borderTop: "1px solid var(--line)" }}>© XaePay · xaepay.com</footer>
    </div>
  );
}

function PreviewBanner({ onWaitlist }) {
  return (
    <div className="relative z-[60] w-full px-4 py-2 text-center text-xs sm:text-sm" style={{ background: "var(--ink)", color: "var(--bone)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: "var(--lime)" }}>Preview</span>
      <span style={{ color: "rgba(247,245,240,0.85)" }}>This is a live preview — please do not enter real BVN, NIN, or banking details. </span>
      <button onClick={onWaitlist} className="font-semibold underline underline-offset-2" style={{ color: "var(--lime)" }}>Join the waitlist →</button>
    </div>
  );
}

function WaitlistModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("business");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { push } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const { error: insertError } = await supabase
        .from("xaepay_waitlist")
        .insert({
          name,
          email,
          role,
          source: "xaepay.com-waitlist",
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
        });
      if (insertError) throw insertError;
      setSubmitted(true);
      push("You're on the waitlist.", "success");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Waitlist insert failed:", err);
      setError("Couldn't submit — please try again or message us on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setEmail(""); setName(""); setRole("business"); setSubmitted(false); setError(""); };
  const closeAndReset = () => { reset(); onClose(); };

  if (submitted) {
    return (
      <Modal open={open} onClose={closeAndReset} title="You're on the list" size="sm">
        <div className="text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}>
            <CheckCircle2 size={24} strokeWidth={2.5} style={{ color: "var(--ink)" }} />
          </div>
          <h3 className="font-display mt-4 text-xl font-semibold" style={{ color: "var(--ink)" }}>Thanks, {name || "friend"}.</h3>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>We'll reach out at <span className="font-mono">{email}</span> when XaePay opens to your tier. Want to talk now?</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition" style={{ background: "var(--ink)", color: "var(--bone)" }}>
            <MessageCircle size={14} /> Chat on WhatsApp
          </a>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={closeAndReset} title="Join the XaePay waitlist" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm" style={{ color: "var(--muted)" }}>We'll let you know the moment your tier opens. No spam — just one email when it's live.</p>
        <div><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
        <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div>
          <Label>I am a…</Label>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="business">Business paying foreign suppliers</option>
            <option value="diaspora">Diaspora sender</option>
            <option value="individual">Individual making trade payments</option>
            <option value="bdc">CBN-licensed BDC</option>
            <option value="agent">Payment Agent (IMTO/SCUML)</option>
            <option value="lp">USDT Liquidity Provider</option>
            <option value="other">Other / just curious</option>
          </Select>
        </div>
        {error && <div className="rounded-lg p-3 text-xs" style={{ background: "#fee2e2", color: "#991b1b" }}>{error}</div>}
        <PrimaryBtn type="submit" full disabled={submitting}>
          {submitting ? <><Loader2 size={14} className="spin" /> Submitting…</> : <><Mail size={14} /> Join waitlist</>}
        </PrimaryBtn>
        <p className="text-center text-[11px]" style={{ color: "var(--muted)" }}>Or message us directly: <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="font-semibold underline" style={{ color: "var(--emerald)" }}>WhatsApp</a></p>
      </form>
    </Modal>
  );
}

function TopBar({ view, setView, mobileOpen, setMobileOpen, onSignIn, onRequestAccess, onWaitlist, session, authUser, onSignOut }) {
  const onLanding = view === "landing";
  return (
    <div className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: onLanding ? "rgba(10,11,13,0.72)" : "rgba(252,251,247,0.85)", borderBottom: `1px solid ${onLanding ? "rgba(255,255,255,0.06)" : "var(--line)"}`, color: onLanding ? "var(--bone)" : "var(--ink)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button onClick={() => setView(authUser ? "bdc" : "landing")} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, var(--emerald), var(--emerald-deep))" }}>
              <span className="font-display text-lg font-semibold" style={{ color: "var(--lime)" }}>X</span>
            </div>
            <span className="font-display text-[22px] font-semibold tracking-tight">XaePay</span>
          </button>
          <div className="hidden items-center gap-2 md:flex">
            {authUser ? (
              <>
                {onLanding && <button onClick={() => setView("bdc")} className="rounded-lg px-3 py-1.5 text-sm font-medium transition" style={{ color: "var(--bone)" }}>Dashboard</button>}
                <span className="hidden lg:inline font-mono text-[10px] uppercase tracking-wider truncate max-w-[200px]" style={{ color: onLanding ? "rgba(247,245,240,0.6)" : "var(--muted)" }} title={authUser.email}>{authUser.email}</span>
                <button onClick={onSignOut} className="rounded-lg px-3 py-1.5 text-sm font-medium transition" style={{ color: onLanding ? "var(--bone)" : "var(--ink)" }}>Sign out</button>
              </>
            ) : (
              <>
                <button onClick={onSignIn} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${onLanding ? "text-stone-300 hover:text-white" : "text-stone-600 hover:text-stone-900"}`}>Sign in</button>
                <button onClick={onRequestAccess} className="rounded-lg px-4 py-1.5 text-sm font-medium transition" style={onLanding ? { background: "var(--lime)", color: "var(--ink)" } : { background: "var(--ink)", color: "var(--bone)" }}>Become an operator</button>
              </>
            )}
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {mobileOpen && (
          <div className="py-4 md:hidden" style={{ borderTop: `1px solid ${onLanding ? "rgba(255,255,255,0.06)" : "var(--line)"}` }}>
            {authUser ? (
              <div className="flex flex-col gap-2">
                {onLanding && <button onClick={() => { setView("bdc"); setMobileOpen(false); }} className="w-full rounded-lg px-4 py-2.5 text-sm font-medium" style={{ background: "var(--lime)", color: "var(--ink)" }}>Open dashboard</button>}
                <button onClick={() => { onSignOut(); setMobileOpen(false); }} className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium" style={{ color: onLanding ? "var(--bone)" : "var(--ink)" }}>Sign out · {authUser.email}</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button onClick={() => { onSignIn(); setMobileOpen(false); }} className="w-full rounded-lg px-4 py-2.5 text-sm font-medium" style={{ border: `1px solid ${onLanding ? "rgba(255,255,255,0.1)" : "var(--line)"}`, color: onLanding ? "var(--bone)" : "var(--ink)" }}>Sign in</button>
                <button onClick={() => { onRequestAccess(); setMobileOpen(false); }} className="w-full rounded-lg px-4 py-2.5 text-sm font-medium" style={onLanding ? { background: "var(--lime)", color: "var(--ink)" } : { background: "var(--ink)", color: "var(--bone)" }}>Become an operator</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NavBtn({ active, onLanding, onClick, children }) {
  return <button onClick={onClick} className="rounded-lg px-3 py-1.5 text-sm font-medium transition flex items-center gap-1" style={active ? onLanding ? { background: "rgba(255,255,255,0.08)", color: "var(--bone)" } : { background: "var(--ink)", color: "var(--bone)" } : onLanding ? { color: "rgba(247,245,240,0.7)" } : { color: "var(--muted)" }}>{children}</button>;
}
function MobileNavBtn({ onLanding, onClick, children }) {
  return <button onClick={onClick} className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium transition" style={{ color: onLanding ? "var(--bone)" : "var(--ink)" }}>{children}</button>;
}
function Phase2Pill({ onLanding }) {
  return <span className="rounded-full px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider" style={{ background: onLanding ? "rgba(197,242,74,0.15)" : "var(--bone-2)", color: onLanding ? "var(--lime)" : "var(--emerald)" }}>P2</span>;
}
function TierBadge({ tier, small, dark }) {
  const labels = ["Tier 0", "Tier 1", "Tier 2", "Tier 3"];
  const limits = ["No limit set", "$0 – $5K", "$5K – $50K", "$50K+ unlocked"];
  if (small) return <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold" style={{ color: dark ? "var(--lime)" : "var(--emerald)" }}>{tier === 3 ? <Unlock size={9} /> : <Lock size={9} />}{labels[tier]}</span>;
  return <div className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: "var(--emerald)", color: "var(--lime)" }}>{tier === 3 ? <Unlock size={12} /> : <Lock size={12} />}<span className="font-mono text-[10px] font-semibold uppercase tracking-wider">{labels[tier]} · {limits[tier]}</span></div>;
}

function SignInModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { push } = useToast();
  const auth = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const { error: err } = await auth.signInWithEmail(email);
      if (err) throw err;
      setSent(true);
      push("Magic link sent — check your inbox.", "success");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("signInWithEmail failed:", err);
      setError(err.message || "Couldn't send the link. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeAndReset = () => { setEmail(""); setSent(false); setError(""); onClose(); };

  if (sent) {
    return (
      <Modal open={open} onClose={closeAndReset} title="Check your inbox" size="sm">
        <div className="text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}>
            <Mail size={24} strokeWidth={2.5} style={{ color: "var(--ink)" }} />
          </div>
          <h3 className="font-display mt-4 text-xl font-semibold" style={{ color: "var(--ink)" }}>Magic link on its way.</h3>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>We sent a sign-in link to <span className="font-mono">{email}</span>. Tap it on this device to finish signing in. The link expires in 1 hour.</p>
          <p className="mt-4 text-[11px]" style={{ color: "var(--muted)" }}>Don't see it? Check spam, or <button onClick={() => setSent(false)} className="underline font-semibold" style={{ color: "var(--emerald)" }}>try a different email</button>.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={closeAndReset} title="Sign in" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm" style={{ color: "var(--muted)" }}>Enter your email and we'll send you a one-tap sign-in link. No password to remember.</p>
        <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
        {error && <div className="rounded-lg p-3 text-xs" style={{ background: "#fee2e2", color: "#991b1b" }}>{error}</div>}
        <PrimaryBtn type="submit" full disabled={submitting}>{submitting ? <><Loader2 size={14} className="spin" /> Sending…</> : <><LogIn size={14} /> Send magic link</>}</PrimaryBtn>
        <p className="text-center text-[11px]" style={{ color: "var(--muted)" }}>By signing in you agree to our terms. We don't share your email.</p>
      </form>
    </Modal>
  );
}

// MVP 4-step "Become an operator" modal. Replaces the legacy RequestAccessModal +
// per-role onboarding routes. Single agent-operator role; on completion we set
// session.type=bdc and route into the operator dashboard.
function BecomePartnerModal({ open, onClose, onComplete }) {
  const empty = { company: "", contactName: "", phone: "", email: "", license: "", licenseNumber: "" };
  const [step, setStep] = useState(1);
  const [data, setData] = useState(empty);
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => { setStep(1); setData(empty); }, 250);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));
  const wrapperDef = [...OPERATOR_WRAPPERS_NG, ...OPERATOR_WRAPPERS_FOREIGN].find((w) => w.id === data.license);
  const wrapperRequiresLicense = wrapperDef?.requiresLicense;
  const canAdvanceStep2 = !!data.license && (!wrapperRequiresLicense || !!data.licenseNumber.trim());
  const finish = () => {
    onComplete({
      type: "bdc",
      tier: 1,
      name: data.contactName || data.company || "Operator",
      company: data.company || data.contactName || "Operator",
      wrapper: data.license,
    });
  };
  return (
    <Modal open={open} onClose={onClose} title={`Become an operator · Step ${step} of 4`} size="lg">
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold mb-2">Tell us about your business</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Agent operators of every kind welcome — BDCs, IMTOs, freight forwarders, customs agents, trade facilitators, and consolidation aggregators.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" full><Input value={data.company} onChange={(e) => setData({ ...data, company: e.target.value })} placeholder="Corporate Exchange BDC" /></Field>
            <Field label="Your name"><Input value={data.contactName} onChange={(e) => setData({ ...data, contactName: e.target.value })} placeholder="Olusegun Adeyemi" /></Field>
            <Field label="Phone (WhatsApp)"><Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="+234 803 123 4567" /></Field>
            <Field label="Email" full><Input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="you@operator.com" /></Field>
          </div>
          <div className="flex justify-end pt-2"><PrimaryBtn onClick={next} disabled={!data.company || !data.contactName || !data.email}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold mb-2">Regulatory wrapper</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>You're not selling FX. Your customers send payment requests, you forward them to XaePay, our licensed payment partner executes the wire. We just need to know how you're set up.</p>
          </div>
          <div className="space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Nigerian wrappers</div>
            {OPERATOR_WRAPPERS_NG.map((opt) => (
              <button key={opt.id} type="button" onClick={() => setData({ ...data, license: opt.id })} className="w-full rounded-xl p-4 text-left transition" style={data.license === opt.id ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{opt.label}</span>
                  {data.license === opt.id && <CheckCircle2 size={16} style={{ color: "var(--lime)" }} />}
                </div>
              </button>
            ))}
            <div className="font-mono text-[10px] uppercase tracking-wider mb-1 mt-4" style={{ color: "var(--muted)" }}>Foreign wrappers</div>
            {OPERATOR_WRAPPERS_FOREIGN.map((opt) => (
              <button key={opt.id} type="button" onClick={() => setData({ ...data, license: opt.id })} className="w-full rounded-xl p-4 text-left transition" style={data.license === opt.id ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{opt.label}</span>
                  {data.license === opt.id && <CheckCircle2 size={16} style={{ color: "var(--lime)" }} />}
                </div>
              </button>
            ))}
          </div>
          {wrapperRequiresLicense && (
            <Field label="Registration / license number" full><Input value={data.licenseNumber} onChange={(e) => setData({ ...data, licenseNumber: e.target.value })} placeholder="e.g. BDC/2024/T2/045" /></Field>
          )}
          <div className="flex justify-between pt-2">
            <SecondaryBtn onClick={back}>Back</SecondaryBtn>
            <PrimaryBtn onClick={next} disabled={!canAdvanceStep2}>Continue <ArrowRight size={14} /></PrimaryBtn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold mb-2">How the partnership works</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Read this carefully — it's the whole agreement in plain language.</p>
          </div>
          <div className="space-y-3">
            <PartnerTerm icon={DollarSign} title="You set your customer's rate">You quote your customer whatever rate you want. We give you our wholesale rate plus a small XaePay infrastructure fee. You add your markup on top.</PartnerTerm>
            <PartnerTerm icon={TrendingUp} title="You earn 55–75% of every transaction's margin">Every dollar of markup you charge above our minimum is split between you and XaePay based on the tier you pick per transaction. Recurring on every transaction, forever.</PartnerTerm>
            <PartnerTerm icon={Layers} title="Five service tiers, you pick per transaction">Basic (₦0.50/$ minimum), Standard (₦1.50/$), Verified (₦2.50/$), Documented (₦3.50/$), Compliance Pro (₦4.50/$). Each unlocks more validation work XaePay does for that transaction.</PartnerTerm>
            <PartnerTerm icon={MessageCircle} title="Everything happens on WhatsApp">Your customer messages you. You forward to XaePay. We handle quotes, KYC, compliance, execution, documents. Your customer never has to download anything.</PartnerTerm>
            <PartnerTerm icon={Shield} title="No license risk, no fund handling">You don't sell FX, hold money, or quote rates. You introduce customers; XaePay onboards them with our licensed payment partner; the partner executes the regulated payment.</PartnerTerm>
          </div>
          <div className="flex justify-between pt-2">
            <SecondaryBtn onClick={back}>Back</SecondaryBtn>
            <PrimaryBtn onClick={next}>I understand <ArrowRight size={14} /></PrimaryBtn>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-5" style={{ background: "var(--lime)" }}>
            <CheckCircle2 size={28} strokeWidth={2.5} style={{ color: "var(--ink)" }} />
          </div>
          <h3 className="font-display text-2xl font-semibold mb-3">You're in.</h3>
          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "var(--muted)" }}>We'll send your operator agreement to <span className="font-semibold" style={{ color: "var(--ink)" }}>{data.email || "your email"}</span> and connect your WhatsApp number to ours within 24 hours.</p>
          <div className="rounded-xl p-4 max-w-md mx-auto mb-6" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
            <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Next step</div>
            <p className="text-sm">Refer your first customer. We'll handle their KYC with our compliance partner and have them transacting in 5–10 business days.</p>
          </div>
          <PrimaryBtn onClick={finish}>Open dashboard <ArrowRight size={14} /></PrimaryBtn>
        </div>
      )}
    </Modal>
  );
}

function PartnerTerm({ icon: Icon, title, children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "white", color: "var(--emerald)" }}><Icon size={16} /></div>
      <div className="flex-1">
        <div className="text-sm font-semibold mb-0.5">{title}</div>
        <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{children}</div>
      </div>
    </div>
  );
}

function RequestAccessModal({ open, onClose, onChoose, onWaitlist }) {
  return (
    <Modal open={open} onClose={onClose} title="Preview the experience" size="lg">
      <div className="mb-5 rounded-xl p-4" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.3)" }}>
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--amber)" }} />
          <div className="text-xs flex-1" style={{ color: "var(--ink)" }}>
            <span className="font-semibold">This is a simulated preview.</span> Pick a role below to see how the product feels — every check, ID lookup, and payment is faked. Don't enter real BVN/NIN/banking details.
            <button onClick={onWaitlist} className="ml-2 underline font-semibold" style={{ color: "var(--emerald)" }}>Join waitlist for the real launch →</button>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <RoleCard icon={Building2} title="I run a business" subtitle="CAC-registered company" description="Pay foreign suppliers, manage trade payments, generate compliance docs." time="~4 min" available onClick={() => onChoose("business")} />
        <RoleCard icon={Send} title="I operate from overseas" subtitle="Individual or business · US / UK / EU / CA" description="Send foreign currency from abroad to settle as NGN locally — vendors, payroll, family, school, property." time="~5 min" available onClick={() => onChoose("diaspora")} />
        <RoleCard icon={User} title="I'm an individual" subtitle="Personal trade payments" description="Pay foreign suppliers via BDC payment-agent service." time="~3 min" phase2 onClick={() => onChoose("individual")} />
        <RoleCard icon={Briefcase} title="I operate a BDC" subtitle="CBN-licensed BDC" description="Process trade payments, access global rails, generate evidence packs." time="~10 min" available onClick={() => onChoose("bdc")} />
        <RoleCard icon={Layers} title="I'm a Payment Agent" subtitle="IMTO / SCUML / CAC + BDC partner" description="Licensed Nigerian operators serving trade and remittance flows. Same dashboard as BDCs, different regulatory wrapper." time="~8 min" available onClick={() => onChoose("agent")} />
        <RoleCard icon={Coins} title="I provide USDT liquidity" subtitle="Diaspora USD holders, exporters" description="Sell USDT to BDCs needing inventory. Receive naira at favorable rates." time="~7 min" phase2 onClick={() => onChoose("lp")} />
      </div>
    </Modal>
  );
}

function RoleCard({ icon: Icon, title, subtitle, description, time, available, phase2, onClick }) {
  return (
    <button onClick={onClick} className="card-lift rounded-xl p-5 text-left transition" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><Icon size={18} strokeWidth={1.75} /></div>
        {phase2 && <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}>Phase 2</span>}
        {available && <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--emerald)", color: "var(--lime)" }}>Onboarding partners</span>}
      </div>
      <h3 className="font-display mt-4 text-lg font-semibold" style={{ color: "var(--ink)" }}>{title}</h3>
      <p className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--muted)" }}>{subtitle}</p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{description}</p>
      <div className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--emerald)" }}>
        <span>Continue</span><ArrowRight size={11} /> <span className="ml-auto" style={{ color: "var(--muted)" }}>{time}</span>
      </div>
    </button>
  );
}

function OnboardingFlow({ type, onClose, onComplete }) {
  return (
    <div className="fixed inset-0 z-[95] font-ui fade-in overflow-y-auto" style={{ background: "var(--paper)" }}>
      <div className="sticky top-0 z-10 backdrop-blur-xl" style={{ background: "rgba(252,251,247,0.85)", borderBottom: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, var(--emerald), var(--emerald-deep))" }}>
                <span className="font-display text-lg font-semibold" style={{ color: "var(--lime)" }}>X</span>
              </div>
              <span className="font-display text-[20px] font-semibold tracking-tight">Onboarding</span>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"><X size={18} /></button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {type === "business" && <BusinessOnboarding onComplete={onComplete} />}
        {type === "diaspora" && <DiasporaOnboarding onComplete={onComplete} />}
        {type === "individual" && <IndividualOnboarding onComplete={onComplete} />}
        {type === "bdc" && <BDCOnboarding onComplete={onComplete} />}
        {type === "agent" && <PaymentAgentOnboarding onComplete={onComplete} />}
        {type === "lp" && <LPOnboarding onComplete={onComplete} />}
      </div>
    </div>
  );
}

function OnboardingStepper({ step, steps, tiers }) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((label, i) => {
        const active = i + 1 === step;
        const done = i + 1 < step;
        return (
          <React.Fragment key={label}>
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition" style={done ? { background: "var(--emerald)", color: "var(--lime)" } : active ? { background: "var(--ink)", color: "var(--lime)" } : { background: "var(--bone-2)", color: "var(--muted)" }}>{done ? <CheckCircle2 size={14} strokeWidth={2.5} /> : i + 1}</div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium" style={{ color: active ? "var(--ink)" : "var(--muted)" }}>{label}</div>
                {tiers && <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: active ? "var(--emerald)" : "var(--muted)" }}>{tiers[i]}</div>}
              </div>
            </div>
            {i < steps.length - 1 && <div className="h-px flex-1" style={{ background: done ? "var(--emerald)" : "var(--line)" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TierUnlockNote({ tier, description }) {
  return (
    <div className="mt-5 rounded-xl p-4" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
      <div className="flex items-start gap-2">
        <Unlock size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
        <div className="text-xs"><span className="font-semibold" style={{ color: "var(--emerald)" }}>Tier {tier} unlocks</span><span style={{ color: "var(--muted)" }}> · {description}</span></div>
      </div>
    </div>
  );
}

function UploadRow({ label, sublabel, done, onClick }) {
  return (
    <button onClick={onClick} disabled={done} className="w-full flex items-start justify-between gap-3 rounded-xl p-4 text-left transition" style={{ background: done ? "var(--bone)" : "white", border: `1px solid ${done ? "var(--emerald)" : "var(--line)"}` }}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={done ? { background: "var(--emerald)", color: "var(--lime)" } : { background: "var(--bone-2)", color: "var(--muted)" }}>{done ? <CheckCircle2 size={12} strokeWidth={2.5} /> : <Upload size={12} />}</div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{sublabel}</div>
        </div>
      </div>
      {!done && <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--emerald)" }}>Upload →</span>}
    </button>
  );
}

function BusinessOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", email: "", phone: "", role: "Founder", cacNumber: "", company: "", directors: [], regDate: "", bdcSponsor: null, directorVerified: false });
  return (
    <div className="rise">
      <SectionEyebrow>Business onboarding</SectionEyebrow>
      <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-4xl">Let's set up your business.</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Four short steps. Tier unlocks as you progress — you can transact at Tier 1.</p>
      <div className="mt-8"><OnboardingStepper step={step} steps={["Identity", "Business", "Director", "EDD"]} tiers={["T0", "T1", "T2", "T3"]} /></div>
      <div className="mt-6">
        {step === 1 && <BizStep1 data={data} setData={setData} onNext={() => setStep(2)} />}
        {step === 2 && <BizStep2 data={data} setData={setData} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <BizStep3 data={data} setData={setData} onNext={() => setStep(4)} onBack={() => setStep(2)} onComplete={() => onComplete({ type: "business", tier: 2, name: data.name, company: data.company })} />}
        {step === 4 && <BizStep4 onBack={() => setStep(3)} onComplete={() => onComplete({ type: "business", tier: 3, name: data.name, company: data.company })} />}
      </div>
    </div>
  );
}

function BizStep1({ data, setData, onNext }) {
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">Tell us about you</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>This is for your account. We verify the business in the next step.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full name" full><Input required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Adeyemi Okafor" /></Field>
        <Field label="Work email"><Input type="email" required value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="you@company.com" /></Field>
        <Field label="Phone (WhatsApp)"><Input required value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="+234 803 123 4567" /></Field>
        <Field label="Your role" full>
          <Select value={data.role} onChange={(e) => setData({ ...data, role: e.target.value })}>
            <option>Founder</option><option>CEO / MD</option><option>CFO / Finance Lead</option><option>Operations</option><option>Other</option>
          </Select>
        </Field>
      </div>
      <TierUnlockNote tier={1} description="account created, verifies your identity" />
      <div className="mt-6 flex justify-end"><PrimaryBtn onClick={onNext}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
    </Card>
  );
}

function BizStep2({ data, setData, onNext, onBack }) {
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);
  const { push } = useToast();
  const [bdcChoice, setBdcChoice] = useState("none");

  const lookupCAC = () => {
    if (!data.cacNumber) return;
    setSearching(true); setFound(false);
    setTimeout(() => {
      setSearching(false); setFound(true);
      setData({ ...data, company: "Novus Trading Ltd", regDate: "March 14, 2019", directors: ["Adeyemi Okafor", "Funmi Adeleke"] });
      push("CAC verified · company details auto-populated", "success");
    }, 1400);
  };

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">Verify your business</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Enter your CAC number — we auto-fetch from the public registry. No upload needed.</p>
      <div className="mt-6">
        <Label>CAC registration number</Label>
        <div className="flex gap-2">
          <div className="flex-1 focus-ring flex items-center rounded-xl transition" style={{ background: "white", border: "1px solid var(--line)" }}>
            <span className="pl-3.5 font-mono text-sm" style={{ color: "var(--muted)" }}>RC</span>
            <input value={data.cacNumber} onChange={(e) => { setData({ ...data, cacNumber: e.target.value }); setFound(false); }} placeholder="1247389" className="w-full bg-transparent px-2 py-3 text-sm outline-none font-mono" />
          </div>
          <button onClick={lookupCAC} disabled={searching || !data.cacNumber} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50" style={{ background: "var(--ink)", color: "var(--bone)" }}>
            {searching ? <><Loader2 size={14} className="spin" /> Verifying</> : <><Search size={14} /> Lookup</>}
          </button>
        </div>
      </div>
      {searching && (<div className="scan-line mt-4 rounded-xl p-4" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}><div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>Searching CAC public registry…</div></div>)}
      {found && (
        <div className="mt-4 rise rounded-xl p-5" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={14} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
            <div className="flex-1">
              <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.6)" }}>Verified company</div>
              <div className="font-display mt-1 text-xl font-semibold">{data.company}</div>
              <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                <div><span style={{ color: "rgba(247,245,240,0.5)" }}>Registered:</span> <span>{data.regDate}</span></div>
                <div><span style={{ color: "rgba(247,245,240,0.5)" }}>Directors:</span> <span>{data.directors.join(", ")}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mt-6">
        <Label>Are you coming through a BDC?</Label>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>If a CBN-licensed BDC has already verified you as a customer, they can vouch to skip director KYC.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <RoleBtn active={bdcChoice === "none"} onClick={() => { setBdcChoice("none"); setData({ ...data, bdcSponsor: null }); }}>No, coming directly</RoleBtn>
          <RoleBtn active={bdcChoice === "bdc"} onClick={() => { setBdcChoice("bdc"); setData({ ...data, bdcSponsor: "Corporate Exchange BDC" }); }}>Yes, via my BDC</RoleBtn>
        </div>
        {bdcChoice === "bdc" && (
          <div className="mt-3 rise">
            <Select value={data.bdcSponsor || ""} onChange={(e) => setData({ ...data, bdcSponsor: e.target.value })}>
              <option>Corporate Exchange BDC</option><option>Dula Global BDC (Tier 1)</option><option>Trurate Global BDC (Tier 1)</option><option>Sevenlocks BDC</option><option>Bergpoint BDC</option><option>Brownstone BDC</option>
            </Select>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--emerald)" }}>✓ Your BDC will receive a one-click attestation request. You skip director KYC.</p>
          </div>
        )}
      </div>
      <TierUnlockNote tier={1} description="business identity verified, you can transact up to $5,000" />
      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row">
        <SecondaryBtn onClick={onBack}>Back</SecondaryBtn>
        <PrimaryBtn onClick={onNext}>Continue to {bdcChoice === "bdc" ? "BDC attestation" : "director KYC"} <ArrowRight size={14} /></PrimaryBtn>
      </div>
    </Card>
  );
}

function BizStep3({ data, setData, onNext, onBack, onComplete }) {
  const { push } = useToast();
  const isBDC = !!data.bdcSponsor;
  const [verified, setVerified] = useState(false);
  const sendToWhatsApp = () => {
    push("WhatsApp link sent · check your phone", "info");
    setTimeout(() => { setVerified(true); push("Director ID verified via WhatsApp", "success"); setData({ ...data, directorVerified: true }); }, 2200);
  };

  if (isBDC) {
    return (
      <Card>
        <h2 className="font-display text-xl font-semibold">BDC attestation</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{data.bdcSponsor} has been notified. Once they click-attest, you're at Tier 2.</p>
        <div className="mt-6 rounded-xl p-5" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "rgba(197,242,74,0.1)" }}><Briefcase size={16} style={{ color: "var(--lime)" }} /></div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{data.bdcSponsor}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(247,245,240,0.6)" }}>Attestation pending</div>
              <p className="mt-3 text-xs leading-relaxed" style={{ color: "rgba(247,245,240,0.7)" }}>One-click attestation: (a) identity, (b) relationship history, (c) AML clearance.</p>
            </div>
          </div>
        </div>
        <TierUnlockNote tier={2} description="BDC attestation grants Tier 2. $5K – $50K corridor unlocked." />
        <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row">
          <SecondaryBtn onClick={onBack}>Back</SecondaryBtn>
          <div className="flex gap-2">
            <SecondaryBtn onClick={onComplete}>Finish at Tier 2</SecondaryBtn>
            <PrimaryBtn onClick={onNext}>Unlock Tier 3 <ArrowRight size={14} /></PrimaryBtn>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">Director identity</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>One director on the CAC certificate verifies identity. Photo ID + selfie.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={sendToWhatsApp} disabled={verified} className="card-lift rounded-xl p-5 text-left transition disabled:opacity-50" style={{ background: verified ? "var(--ink)" : "var(--bone)", color: verified ? "var(--bone)" : "var(--ink)", border: `1px solid ${verified ? "var(--ink)" : "var(--line)"}` }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: verified ? "rgba(197,242,74,0.1)" : "white", color: verified ? "var(--lime)" : "var(--emerald)" }}>{verified ? <CheckCircle2 size={16} /> : <MessageCircle size={16} />}</div>
            <div className="flex-1">
              <div className="font-display text-base font-semibold">{verified ? "Verified via WhatsApp" : "Continue on WhatsApp"}</div>
              <p className="mt-1 text-xs leading-relaxed" style={verified ? { color: "rgba(247,245,240,0.7)" } : { color: "var(--muted)" }}>{verified ? "ID + selfie received." : "Easier from your phone — we guide you in chat."}</p>
              {!verified && <div className="mt-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--emerald)" }}>Recommended</div>}
            </div>
          </div>
        </button>
        <div className="card-lift rounded-xl p-5" style={{ background: "white", border: "1px solid var(--line)" }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><Upload size={16} /></div>
            <div className="flex-1">
              <div className="font-display text-base font-semibold">Upload here</div>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>Photo of NIN / passport + selfie from laptop.</p>
              <button className="mt-3 text-xs font-semibold underline" style={{ color: "var(--emerald)" }}>Upload files →</button>
            </div>
          </div>
        </div>
      </div>
      <TierUnlockNote tier={2} description="director identity confirmed. $5K – $50K corridor unlocked." />
      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row">
        <SecondaryBtn onClick={onBack}>Back</SecondaryBtn>
        <div className="flex gap-2">
          <SecondaryBtn onClick={onComplete} disabled={!verified}>Finish at Tier 2</SecondaryBtn>
          <PrimaryBtn onClick={onNext} disabled={!verified}>Unlock Tier 3 <ArrowRight size={14} /></PrimaryBtn>
        </div>
      </div>
    </Card>
  );
}

function BizStep4({ onBack, onComplete }) {
  const { push } = useToast();
  const [docs, setDocs] = useState({ bankStatement: false, sof: false, bo: false });
  const allDone = docs.bankStatement && docs.sof && docs.bo;
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">Enhanced due diligence</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Required for transactions above $50K.</p>
      <div className="mt-6 space-y-2">
        <UploadRow label="Bank statements (last 3 months)" sublabel="PDF or image · WhatsApp upload available" done={docs.bankStatement} onClick={() => { setDocs({ ...docs, bankStatement: true }); push("Bank statements received", "success"); }} />
        <UploadRow label="Source of funds attestation" sublabel="One-page declaration we generate for signing" done={docs.sof} onClick={() => { setDocs({ ...docs, sof: true }); push("Source of funds signed", "success"); }} />
        <UploadRow label="Beneficial ownership disclosure" sublabel="Anyone owning more than 25%" done={docs.bo} onClick={() => { setDocs({ ...docs, bo: true }); push("Beneficial ownership complete", "success"); }} />
      </div>
      <TierUnlockNote tier={3} description="full corporate tier · all rails, no transaction limits, dedicated compliance support." />
      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row">
        <SecondaryBtn onClick={onBack}>Back</SecondaryBtn>
        <PrimaryBtn onClick={onComplete} disabled={!allDone}>Finish onboarding <Sparkles size={14} /></PrimaryBtn>
      </div>
    </Card>
  );
}

function IndividualOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", phone: "", email: "", bvn: "", bvnVerified: false, bdc: null, sofSigned: false, authSigned: false });
  const { push } = useToast();
  const [verifying, setVerifying] = useState(false);
  const verifyBVN = () => {
    if (!data.bvn || data.bvn.length < 5) return;
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setData({ ...data, bvnVerified: true, name: "Funmi Adeleke" }); push("BVN verified · NIBSS returned identity match", "success"); }, 1500);
  };
  return (
    <div className="rise">
      <div className="flex items-center gap-2 mb-2">
        <SectionEyebrow>Individual onboarding</SectionEyebrow>
        <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}>Phase 2</span>
      </div>
      <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-4xl">Trade payments via BDC payment-agent.</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Your BDC pays the supplier in their name on your behalf — fully disclosed, fully documented. Per-transaction $2K, monthly $10K limits per CBN rules.</p>
      <div className="mt-6 rounded-xl p-4" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.3)" }}>
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--amber)" }} />
          <div className="text-xs" style={{ color: "var(--ink)" }}>
            <span className="font-semibold">Doing more than $5K/month repeatedly?</span> Forming a registered business unlocks higher limits. <button className="underline font-semibold" style={{ color: "var(--emerald)" }}>Form your business in 7 days →</button>
          </div>
        </div>
      </div>
      <div className="mt-8"><OnboardingStepper step={step} steps={["Identity", "BDC", "Authorize", "Done"]} /></div>
      <div className="mt-6">
        {step === 1 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Verify your identity</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>BVN lookup is instant — no documents needed.</p>
            <div className="mt-6 space-y-4">
              <Field label="Phone (WhatsApp)"><Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="+234 803 123 4567" /></Field>
              <Field label="Email"><Input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="you@example.com" /></Field>
              <div>
                <Label>BVN (Bank Verification Number)</Label>
                <div className="flex gap-2">
                  <Input value={data.bvn} onChange={(e) => setData({ ...data, bvn: e.target.value, bvnVerified: false })} placeholder="22XXXXXXXXX" />
                  <button onClick={verifyBVN} disabled={verifying || !data.bvn} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50" style={{ background: "var(--ink)", color: "var(--bone)" }}>{verifying ? <><Loader2 size={14} className="spin" /> Verifying</> : "Verify"}</button>
                </div>
                {data.bvnVerified && (
                  <div className="mt-3 rise rounded-xl p-3" style={{ background: "var(--ink)", color: "var(--bone)" }}>
                    <div className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--lime)" }} strokeWidth={2.5} /><span className="text-sm">Identity confirmed: <span className="font-semibold">{data.name}</span></span></div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end"><PrimaryBtn onClick={() => setStep(2)} disabled={!data.bvnVerified}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 2 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Pick your BDC payment agent</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>The BDC pays in their name on your behalf with full disclosure.</p>
            <div className="mt-6 space-y-2">
              {["Corporate Exchange BDC · Lagos · ₦/$ 1,395", "Sevenlocks BDC · Lagos · ₦/$ 1,397", "Bergpoint BDC · Lagos · ₦/$ 1,396"].map((b) => (
                <button key={b} onClick={() => setData({ ...data, bdc: b })} className="w-full rounded-xl p-4 text-left transition" style={data.bdc === b ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
                  <div className="flex items-center justify-between"><div className="text-sm font-medium">{b.split("·")[0]}</div><div className="font-mono text-xs">{b.split("·").slice(1).join(" ·").trim()}</div></div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(1)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(3)} disabled={!data.bdc}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Sign the authorization</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Authorizes your BDC to make payments on your behalf with full disclosure.</p>
            <div className="mt-6 space-y-2">
              <UploadRow label="Source of funds attestation" sublabel="Where the naira comes from · CBN requirement" done={data.sofSigned} onClick={() => { setData({ ...data, sofSigned: true }); push("Source of funds signed", "success"); }} />
              <UploadRow label="Third-party payment authorization" sublabel="Authorizes BDC as disclosed agent" done={data.authSigned} onClick={() => { setData({ ...data, authSigned: true }); push("Authorization signed", "success"); }} />
            </div>
            <div className="mt-5 rounded-xl p-4 text-xs" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
              <div className="flex items-start gap-2"><Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} /><p style={{ color: "var(--ink)" }}>Per transaction we generate: updated invoice with your name, third-party authorization letter, disclosed payment letter to receiving bank, MT103 reference. Full audit trail kept.</p></div>
            </div>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(2)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(4)} disabled={!data.sofSigned || !data.authSigned}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 4 && (
          <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--bone)" }}>
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--lime), transparent)" }} />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={24} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
              <h2 className="font-display mt-5 text-[28px] font-[450] tracking-tight">You're set up.</h2>
              <p className="mt-2 text-sm" style={{ color: "rgba(247,245,240,0.7)" }}>Pay foreign suppliers via {data.bdc?.split("·")[0]}. Per-transaction limit: $2,000. Monthly: $10,000.</p>
              <button onClick={() => onComplete({ type: "individual", tier: 1, name: data.name, company: null })} className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition glow-lime" style={{ background: "var(--lime)", color: "var(--ink)" }}>Make a payment <ArrowRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CBN_BDC_LIST = {
  "BDC/2024/T1/001": { name: "Dula Global BDC Ltd", tier: "Tier 1", location: "Lagos", licenseDate: "Nov 27, 2025" },
  "BDC/2024/T1/002": { name: "Trurate Global BDC Ltd", tier: "Tier 1", location: "Lagos", licenseDate: "Nov 27, 2025" },
  "BDC/2024/T2/045": { name: "Corporate Exchange BDC", tier: "Tier 2", location: "Lagos", licenseDate: "Nov 27, 2025" },
  "BDC/2024/T2/067": { name: "Sevenlocks BDC", tier: "Tier 2", location: "Lagos", licenseDate: "Nov 27, 2025" },
  "BDC/2024/T2/072": { name: "Bergpoint BDC", tier: "Tier 2", location: "Lagos", licenseDate: "Nov 27, 2025" },
  "BDC/2024/T2/088": { name: "Brownstone BDC", tier: "Tier 2", location: "Abuja", licenseDate: "Nov 27, 2025" },
};

function PaymentAgentOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    wrapper: "", licenseNumber: "", verified: null, partnerName: "", partnerLetter: false,
    operatorName: "", operatorEmail: "", complianceOfficer: "", complianceEmail: "",
    bankName: "", accountNumber: "",
  });
  const { push } = useToast();
  const [verifying, setVerifying] = useState(false);

  const verifyLicense = () => {
    if (!data.wrapper) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      const wrapperLabels = {
        imto: { name: "IMTO License Verified", body: "Flutterwave Payment Services Ltd", detail: "CBN IMTO/2024/018 · Active · Lagos" },
        scuml: { name: "SCUML Registration Verified", body: "Sendbox Logistics & Payments Ltd", detail: "SCUML/NG/2023/4421 · DNFBP · Active" },
        cac: { name: "CAC + Partner Letter Verified", body: "Trinity Trade Facilitation Ltd", detail: "RC 2147289 · Partner: Corporate Exchange BDC (Tier 2)" },
      };
      setData({ ...data, verified: wrapperLabels[data.wrapper] });
      push(`${wrapperLabels[data.wrapper].name}`, "success");
    }, 1500);
  };

  return (
    <div className="rise">
      <SectionEyebrow>Payment Agent onboarding</SectionEyebrow>
      <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-4xl">Set up your Payment Agent account.</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Same platform as BDCs. Different regulatory wrapper. Nigerian operators launching in Phase 1b — international (US MSB, UK MSB, UAE) available later.</p>
      <div className="mt-6 rounded-xl p-4" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.3)" }}>
        <div className="flex items-start gap-2">
          <Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--amber)" }} />
          <p className="text-xs" style={{ color: "var(--ink)" }}>
            <span className="font-semibold">Admission criteria strictly enforced.</span> We verify against CBN's published IMTO list, SCUML's register, or require a countersigned partnership letter from a licensed BDC or bank. No exceptions.
          </p>
        </div>
      </div>
      <div className="mt-8"><OnboardingStepper step={step} steps={["Wrapper", "Verify", "Operator", "Banking", "Done"]} /></div>
      <div className="mt-6">
        {step === 1 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Which regulatory wrapper?</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Pick the license or registration under which your agency operates.</p>
            <div className="mt-6 space-y-3">
              {[
                { id: "imto", name: "IMTO-licensed", sub: "CBN International Money Transfer Operator" },
                { id: "scuml", name: "SCUML-registered DNFBP", sub: "Designated non-financial business under EFCC SCUML" },
                { id: "cac", name: "CAC-registered + BDC/bank partnership", sub: "Trade facilitation firm with named licensed partner executing payments" },
              ].map((w) => (
                <button key={w.id} onClick={() => setData({ ...data, wrapper: w.id })} className="w-full rounded-xl p-5 text-left transition" style={data.wrapper === w.id ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-base font-semibold">{w.name}</div>
                      <div className="mt-0.5 text-xs" style={data.wrapper === w.id ? { color: "rgba(247,245,240,0.7)" } : { color: "var(--muted)" }}>{w.sub}</div>
                    </div>
                    {data.wrapper === w.id && <CheckCircle2 size={16} style={{ color: "var(--lime)" }} />}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end"><PrimaryBtn onClick={() => setStep(2)} disabled={!data.wrapper}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 2 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Verify registration</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {data.wrapper === "imto" && "We cross-check against the CBN IMTO register."}
              {data.wrapper === "scuml" && "We cross-check against SCUML's published DNFBP register."}
              {data.wrapper === "cac" && "Upload CAC certificate and partnership letter from your named licensed BDC or bank."}
            </p>
            <div className="mt-6">
              <Label>
                {data.wrapper === "imto" && "IMTO license number"}
                {data.wrapper === "scuml" && "SCUML registration number"}
                {data.wrapper === "cac" && "CAC (RC) number"}
              </Label>
              <div className="flex gap-2">
                <Input value={data.licenseNumber} onChange={(e) => setData({ ...data, licenseNumber: e.target.value, verified: null })} placeholder={data.wrapper === "imto" ? "IMTO/2024/018" : data.wrapper === "scuml" ? "SCUML/NG/2023/4421" : "RC 2147289"} />
                <button onClick={verifyLicense} disabled={verifying || !data.licenseNumber} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50" style={{ background: "var(--ink)", color: "var(--bone)" }}>
                  {verifying ? <><Loader2 size={14} className="spin" /> Verifying</> : "Verify"}
                </button>
              </div>
            </div>
            {data.wrapper === "cac" && (
              <div className="mt-5">
                <Field label="Named BDC or bank partner"><Input value={data.partnerName} onChange={(e) => setData({ ...data, partnerName: e.target.value })} placeholder="Corporate Exchange BDC" /></Field>
                <div className="mt-3">
                  <UploadRow label="Partnership letter (countersigned by partner)" sublabel="PDF · must name XaePay as compliance-infrastructure vendor" done={data.partnerLetter} onClick={() => { setData({ ...data, partnerLetter: true }); push("Partnership letter received", "success"); }} />
                </div>
              </div>
            )}
            {data.verified && (
              <div className="mt-5 rise rounded-xl p-5" style={{ background: "var(--ink)", color: "var(--bone)" }}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={14} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
                  <div className="flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.6)" }}>{data.verified.name}</div>
                    <div className="font-display mt-1 text-xl font-semibold">{data.verified.body}</div>
                    <div className="mt-2 font-mono text-xs" style={{ color: "rgba(247,245,240,0.7)" }}>{data.verified.detail}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-between">
              <SecondaryBtn onClick={() => setStep(1)}>Back</SecondaryBtn>
              <PrimaryBtn onClick={() => setStep(3)} disabled={!data.verified || (data.wrapper === "cac" && !data.partnerLetter)}>Continue <ArrowRight size={14} /></PrimaryBtn>
            </div>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Operator details</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Principal operator and compliance officer.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Principal operator name"><Input value={data.operatorName} onChange={(e) => setData({ ...data, operatorName: e.target.value })} placeholder="Olusegun Adeyemi" /></Field>
              <Field label="Operator email"><Input type="email" value={data.operatorEmail} onChange={(e) => setData({ ...data, operatorEmail: e.target.value })} placeholder="olusegun@agent.ng" /></Field>
              <Field label="Compliance officer"><Input value={data.complianceOfficer} onChange={(e) => setData({ ...data, complianceOfficer: e.target.value })} placeholder="Folake Bamidele" /></Field>
              <Field label="Compliance email"><Input type="email" value={data.complianceEmail} onChange={(e) => setData({ ...data, complianceEmail: e.target.value })} placeholder="compliance@agent.ng" /></Field>
            </div>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(2)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(4)}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 4 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Banking instructions</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Where your rev-share lands monthly.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Bank name"><Select value={data.bankName} onChange={(e) => setData({ ...data, bankName: e.target.value })}>
                <option value="">Select bank</option><option>Access Bank</option><option>GTBank</option><option>Zenith Bank</option><option>UBA</option><option>First Bank</option>
              </Select></Field>
              <Field label="Account number"><Input value={data.accountNumber} onChange={(e) => setData({ ...data, accountNumber: e.target.value })} /></Field>
            </div>
            <div className="mt-6 rounded-xl p-4" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
              <div className="flex items-start gap-2">
                <DollarSign size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
                <div className="text-xs" style={{ color: "var(--ink)" }}>
                  <span className="font-semibold">Your pricing:</span> $750 / $2,500 / $6,000 per month (uniform Payment Agent tiers). Rev-share: 25% of end-user fees routed through your agency. Volume-positive breakeven at ~240 transactions/month.
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(3)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(5)}>Finish onboarding <Sparkles size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 5 && (
          <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--bone)" }}>
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--lime), transparent)" }} />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={24} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
              <h2 className="font-display mt-5 text-[28px] font-[450] tracking-tight">You're set up.</h2>
              <p className="mt-2 text-sm" style={{ color: "rgba(247,245,240,0.7)" }}>{data.verified?.body} verified as Payment Agent. Opening your operator dashboard.</p>
              <button onClick={() => onComplete({ type: "agent", tier: null, name: data.verified?.body, company: data.verified?.body })} className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition glow-lime" style={{ background: "var(--lime)", color: "var(--ink)" }}>Open dashboard <ArrowRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Operator wrapper types — Nigerian + foreign — used in agent-operator onboarding step 1.
// Wrappers without a `requiresLicense: true` field don't require a registration number to proceed.
const OPERATOR_WRAPPERS_NG = [
  { id: "bdc", label: "CBN-licensed BDC", sub: "Validated against CBN published list", requiresLicense: true, validatesAgainstCbnList: true },
  { id: "imto", label: "IMTO-licensed operator", sub: "International Money Transfer Operator", requiresLicense: true },
  { id: "scuml", label: "SCUML-registered DNFBP", sub: "Special Control Unit on AML", requiresLicense: true },
  { id: "cac-partner", label: "CAC-registered with bank/BDC partnership", sub: "Operating under a licensed partner", requiresLicense: true },
  { id: "agent-ng", label: "Trade agent / freight forwarder / customs broker (Nigeria)", sub: "We'll review your setup" },
];
const OPERATOR_WRAPPERS_FOREIGN = [
  { id: "us-msb", label: "US MSB (FinCEN-registered)", sub: "Money Services Business · FinCEN", requiresLicense: true },
  { id: "uk-msb", label: "UK MSB (HMRC-registered)", sub: "Money Service Business · HMRC", requiresLicense: true },
  { id: "uae-exchange", label: "UAE exchange house (Central Bank licensed)", sub: "CBUAE-regulated exchange", requiresLicense: true },
  { id: "eu-msb", label: "EU MSB / payment institution", sub: "MSB or PSD2 payment institution", requiresLicense: true },
  { id: "agent-foreign", label: "Other foreign trade agent / facilitator", sub: "We'll review your setup" },
  { id: "other", label: "Other (we'll review)", sub: "Tell us about your setup" },
];

function BDCOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ wrapper: "", licenseNumber: "", verified: null, principalName: "", principalEmail: "", complianceOfficer: "", complianceEmail: "", bankName: "", accountNumber: "", servesIndividuals: false, partnerQ: { tripleA: false, cedar: false } });
  const { push } = useToast();
  const [verifying, setVerifying] = useState(false);
  const wrapperDef = [...OPERATOR_WRAPPERS_NG, ...OPERATOR_WRAPPERS_FOREIGN].find((w) => w.id === data.wrapper);
  const wrapperRequiresLicense = wrapperDef?.requiresLicense;
  const wrapperValidatesAgainstCbn = wrapperDef?.validatesAgainstCbnList;
  const verifyLicense = () => {
    if (!data.licenseNumber) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      const match = CBN_BDC_LIST[data.licenseNumber] || CBN_BDC_LIST["BDC/2024/T2/045"];
      setData({ ...data, verified: match });
      push(`License verified · ${match.tier} · ${match.location}`, "success");
    }, 1600);
  };
  // Step 1 advance condition: wrapper picked, and (no license needed OR CBN-validated OR generic license entered)
  const canAdvanceStep1 = !!data.wrapper && (
    !wrapperRequiresLicense ||
    (wrapperValidatesAgainstCbn ? !!data.verified : !!data.licenseNumber.trim())
  );
  return (
    <div className="rise">
      <SectionEyebrow>Agent operator onboarding</SectionEyebrow>
      <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-4xl">Set up your agent operator account.</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Five steps. Includes licensed payment partner intake at the end.</p>
      <div className="mt-8"><OnboardingStepper step={step} steps={["Wrapper", "Principal", "Compliance", "Banking", "Partners"]} /></div>
      <div className="mt-6">
        {step === 1 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Regulatory wrapper</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>You're not selling FX. You're an introducing operator. Pick what you're set up as — Nigerian or foreign.</p>

            <div className="mt-6 space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Nigerian wrappers</div>
              {OPERATOR_WRAPPERS_NG.map((opt) => (
                <button key={opt.id} type="button" onClick={() => setData({ ...data, wrapper: opt.id, licenseNumber: "", verified: null })} className="w-full rounded-xl p-4 text-left transition" style={data.wrapper === opt.id ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={data.wrapper === opt.id ? { color: "rgba(247,245,240,0.6)" } : { color: "var(--muted)" }}>{opt.sub}</div>
                    </div>
                    {data.wrapper === opt.id && <CheckCircle2 size={16} style={{ color: "var(--lime)" }} />}
                  </div>
                </button>
              ))}

              <div className="font-mono text-[10px] uppercase tracking-wider mb-1 mt-4" style={{ color: "var(--muted)" }}>Foreign wrappers</div>
              {OPERATOR_WRAPPERS_FOREIGN.map((opt) => (
                <button key={opt.id} type="button" onClick={() => setData({ ...data, wrapper: opt.id, licenseNumber: "", verified: null })} className="w-full rounded-xl p-4 text-left transition" style={data.wrapper === opt.id ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={data.wrapper === opt.id ? { color: "rgba(247,245,240,0.6)" } : { color: "var(--muted)" }}>{opt.sub}</div>
                    </div>
                    {data.wrapper === opt.id && <CheckCircle2 size={16} style={{ color: "var(--lime)" }} />}
                  </div>
                </button>
              ))}
            </div>

            {/* CBN-BDC license validation flow (existing behavior) */}
            {wrapperValidatesAgainstCbn && (
              <div className="mt-6">
                <Label>CBN BDC license number</Label>
                <p className="mt-1 mb-2 text-xs" style={{ color: "var(--muted)" }}>Auto-validated against the CBN published BDC list (82 licensed as of Nov 2025).</p>
                <div className="flex gap-2">
                  <Input value={data.licenseNumber} onChange={(e) => setData({ ...data, licenseNumber: e.target.value, verified: null })} placeholder="BDC/2024/T2/045" />
                  <button onClick={verifyLicense} disabled={verifying || !data.licenseNumber} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50" style={{ background: "var(--ink)", color: "var(--bone)" }}>{verifying ? <><Loader2 size={14} className="spin" /> Verifying</> : "Verify"}</button>
                </div>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>Try BDC/2024/T2/045 (Corporate Exchange) for demo</p>
                {data.verified && (
                  <div className="mt-5 rise rounded-xl p-5" style={{ background: "var(--ink)", color: "var(--bone)" }}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={14} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
                      <div className="flex-1">
                        <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.6)" }}>Verified BDC</div>
                        <div className="font-display mt-1 text-xl font-semibold">{data.verified.name}</div>
                        <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                          <div><span style={{ color: "rgba(247,245,240,0.5)" }}>Tier:</span> {data.verified.tier}</div>
                          <div><span style={{ color: "rgba(247,245,240,0.5)" }}>Location:</span> {data.verified.location}</div>
                          <div><span style={{ color: "rgba(247,245,240,0.5)" }}>Licensed:</span> {data.verified.licenseDate}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generic license/registration input for non-CBN wrappers that still need a number */}
            {wrapperRequiresLicense && !wrapperValidatesAgainstCbn && (
              <div className="mt-6">
                <Label>Registration / license number</Label>
                <p className="mt-1 mb-2 text-xs" style={{ color: "var(--muted)" }}>We'll review the number on file but can't auto-validate it. Tell us your regulator and ID — e.g., FinCEN MSB-31000123456789, HMRC 123456, CBUAE EX/2023/0042.</p>
                <Input value={data.licenseNumber} onChange={(e) => setData({ ...data, licenseNumber: e.target.value })} placeholder="e.g. BDC/2024/T2/045" />
              </div>
            )}

            <div className="mt-6 flex justify-end"><PrimaryBtn onClick={() => setStep(2)} disabled={!canAdvanceStep1}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 2 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Principal</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>The named person responsible for your operator license.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {!wrapperValidatesAgainstCbn && <Field label="Business name" full><Input value={data.businessName || ""} onChange={(e) => setData({ ...data, businessName: e.target.value })} placeholder="Your registered business name" /></Field>}
              <Field label="Full name"><Input value={data.principalName} onChange={(e) => setData({ ...data, principalName: e.target.value })} placeholder="Olusegun Adeyemi" /></Field>
              <Field label="Email"><Input type="email" value={data.principalEmail} onChange={(e) => setData({ ...data, principalEmail: e.target.value })} placeholder="you@operator.com" /></Field>
              <Field label={data.wrapper === "bdc" ? "NIN" : "Government ID number"} full><Input placeholder="1234567890" /></Field>
            </div>
            <UploadRow label="Principal ID + selfie" sublabel="WhatsApp upload available · or browse files" done={false} onClick={() => push("Send to +234 700 XAE PAY", "info")} />
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(1)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(3)}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Compliance officer</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Receives sanctions alerts, partner reviews, regulatory reporting prompts.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Compliance officer name"><Input value={data.complianceOfficer} onChange={(e) => setData({ ...data, complianceOfficer: e.target.value })} placeholder="Folake Bamidele" /></Field>
              <Field label="Compliance email"><Input type="email" value={data.complianceEmail} onChange={(e) => setData({ ...data, complianceEmail: e.target.value })} placeholder="compliance@youroperator.com" /></Field>
            </div>
            <div className="mt-6 rounded-xl p-5" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
              <Label>Will you serve as payment agent for individual customers via XaePay?</Label>
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Allows individuals to send trade payments through you under disclosed payment-agent structure. You charge service fees, XaePay generates all disclosure docs.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <RoleBtn active={!data.servesIndividuals} onClick={() => setData({ ...data, servesIndividuals: false })}>Business customers only</RoleBtn>
                <RoleBtn active={data.servesIndividuals} onClick={() => setData({ ...data, servesIndividuals: true })}>Yes, serve individuals too</RoleBtn>
              </div>
            </div>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(2)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(4)}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 4 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Banking instructions</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Where your XaePay rev-share lands monthly.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Bank name"><Select value={data.bankName} onChange={(e) => setData({ ...data, bankName: e.target.value })}>
                <option value="">Select bank</option><option>Access Bank</option><option>GTBank</option><option>Zenith Bank</option><option>UBA</option><option>First Bank</option>
              </Select></Field>
              <Field label="Account number"><Input value={data.accountNumber} onChange={(e) => setData({ ...data, accountNumber: e.target.value })} placeholder="0123456789" /></Field>
            </div>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(3)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(5)}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 5 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Payment partner intake</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Quick partnership questionnaire so our licensed payment partner can onboard your operation.</p>
            <button onClick={() => { setData({ ...data, partnerQ: { ...data.partnerQ, cedar: !data.partnerQ.cedar } }); push(data.partnerQ.cedar ? "Partner intake skipped" : "Partner intake complete", "success"); }} className="mt-6 w-full rounded-xl p-5 text-left transition" style={data.partnerQ.cedar ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-base font-semibold">Licensed payment partner</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={data.partnerQ.cedar ? { color: "rgba(247,245,240,0.6)" } : { color: "var(--muted)" }}>Regulated cross-border payment infrastructure</div>
                </div>
                {data.partnerQ.cedar && <CheckCircle2 size={16} style={{ color: "var(--lime)" }} />}
              </div>
              <p className="mt-3 text-xs" style={data.partnerQ.cedar ? { color: "rgba(247,245,240,0.7)" } : { color: "var(--muted)" }}>End-to-end execution across major corridors. Same-day settlement standard. We handle the partner-side intake on your behalf.</p>
            </button>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(4)}>Back</SecondaryBtn><PrimaryBtn onClick={() => {
              const businessName = data.verified?.name || data.businessName || data.principalName || "Operator";
              onComplete({ type: "bdc", tier: null, name: businessName, company: businessName, wrapper: data.wrapper });
            }}>Finish onboarding <Sparkles size={14} /></PrimaryBtn></div>
          </Card>
        )}
      </div>
    </div>
  );
}

function LPOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", country: "USA", walletAddress: "", chains: [], bankName: "", accountNumber: "", riskAck: false });
  const { push } = useToast();
  const toggleChain = (c) => setData({ ...data, chains: data.chains.includes(c) ? data.chains.filter((x) => x !== c) : [...data.chains, c] });
  return (
    <div className="rise">
      <div className="flex items-center gap-2 mb-2">
        <SectionEyebrow>USDT Liquidity Provider</SectionEyebrow>
        <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}>Phase 2</span>
      </div>
      <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-4xl">Provide USDT to Nigerian BDCs.</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Sell USDT to BDCs needing inventory. They send naira to your bank. XaePay matches and audits — never custodies.</p>
      <div className="mt-6 rounded-xl p-4" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.3)" }}>
        <div className="flex items-start gap-2"><Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--amber)" }} /><p className="text-xs" style={{ color: "var(--ink)" }}><span className="font-semibold">XaePay is not a counterparty.</span> Transactions happen directly between your wallet and the BDC's wallet.</p></div>
      </div>
      <div className="mt-8"><OnboardingStepper step={step} steps={["Identity", "Wallet", "Banking", "Risk", "Done"]} /></div>
      <div className="mt-6">
        {step === 1 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Your identity</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" full><Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Kwame Asante" /></Field>
              <Field label="Country of residence"><Select value={data.country} onChange={(e) => setData({ ...data, country: e.target.value })}>
                <option>USA</option><option>UK</option><option>UAE</option><option>Canada</option><option>Nigeria</option><option>Other</option>
              </Select></Field>
              <Field label="Email"><Input type="email" placeholder="you@example.com" /></Field>
            </div>
            <UploadRow label="Passport / international ID" sublabel="Required for KYC" done={false} onClick={() => push("Upload simulated", "success")} />
            <div className="mt-6 flex justify-end"><PrimaryBtn onClick={() => setStep(2)}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 2 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Wallet verification</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>We sign-message verify ownership. Your private key never leaves your wallet.</p>
            <div className="mt-6 space-y-4">
              <Field label="USDT wallet address"><Input value={data.walletAddress} onChange={(e) => setData({ ...data, walletAddress: e.target.value })} placeholder="0x..." /></Field>
              <div>
                <Label>Supported chains</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["TRC-20", "ERC-20", "BEP-20"].map((c) => (<RoleBtn key={c} active={data.chains.includes(c)} onClick={() => toggleChain(c)}>{c}</RoleBtn>))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(1)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(3)} disabled={!data.walletAddress || data.chains.length === 0}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Banking instructions</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Where naira lands when BDCs buy USDT from you.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Bank name"><Select value={data.bankName} onChange={(e) => setData({ ...data, bankName: e.target.value })}>
                <option value="">Select</option><option>Access Bank</option><option>GTBank</option><option>Zenith Bank</option><option>UBA</option><option>First Bank</option>
              </Select></Field>
              <Field label="Account number"><Input value={data.accountNumber} onChange={(e) => setData({ ...data, accountNumber: e.target.value })} /></Field>
            </div>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(2)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(4)}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 4 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Risk acknowledgment</h2>
            <div className="mt-6 rounded-xl p-5 text-sm leading-relaxed" style={{ background: "var(--bone)", border: "1px solid var(--line)", color: "var(--ink)" }}>
              <p>I acknowledge that:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li>I provide USDT liquidity directly to BDC counterparties, not to XaePay.</li>
                <li>XaePay does not custody, quote, or guarantee any transaction.</li>
                <li>I assume counterparty risk with the BDC. XaePay screens but does not insure.</li>
                <li>I am responsible for tax and reporting in my jurisdiction.</li>
              </ul>
              <button onClick={() => setData({ ...data, riskAck: !data.riskAck })} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: data.riskAck ? "var(--emerald)" : "var(--ink)" }}>
                <div className="flex h-4 w-4 items-center justify-center rounded" style={{ background: data.riskAck ? "var(--emerald)" : "white", border: `1px solid ${data.riskAck ? "var(--emerald)" : "var(--line)"}` }}>{data.riskAck && <CheckCircle2 size={10} style={{ color: "var(--lime)" }} strokeWidth={2.5} />}</div>
                I acknowledge and accept these terms
              </button>
            </div>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(3)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(5)} disabled={!data.riskAck}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 5 && (
          <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--bone)" }}>
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--lime), transparent)" }} />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={24} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
              <h2 className="font-display mt-5 text-[28px] font-[450] tracking-tight">You're listed.</h2>
              <p className="mt-2 text-sm" style={{ color: "rgba(247,245,240,0.7)" }}>BDCs needing USDT will see your bid/offer. You'll be notified on every match.</p>
              <button onClick={() => onComplete({ type: "lp", tier: null, name: data.name, company: null })} className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition glow-lime" style={{ background: "var(--lime)", color: "var(--ink)" }}>Open dashboard <ArrowRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Landing({ setView, onRequestAccess, onWaitlist }) {
  return (
    <div>
      <Hero onGetStarted={onRequestAccess} />
      <HowItWorks />
      <FourTiers onGetStarted={onRequestAccess} />
      <PartnerEconomics onGetStarted={onRequestAccess} />
      <CTA onGetStarted={onRequestAccess} />
      <Footer onWaitlist={onWaitlist} />
    </div>
  );
}

function StructureSection() {
  const points = [
    { n: "01", title: "We never custody funds", body: "Customer money goes directly to your licensed agent operator's account. Foreign-currency wires are executed by our licensed payment partners, regulated where they operate. XaePay never touches funds, never pools client money, never holds digital assets." },
    { n: "02", title: "We never act as counterparty", body: "Every transaction is between named parties — customer, agent operator, payment partner, beneficiary — disclosed at every step. XaePay is the software layer, not a party to the trade." },
    { n: "03", title: "We never quote FX", body: "Our payment partner provides the wholesale rate. The agent operator sets the customer rate. XaePay surfaces the math and disclosures — but the spread belongs to the licensed operator." },
  ];
  return (
    <section className="border-b" style={{ borderColor: "var(--line)", background: "var(--bone)" }}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionEyebrow>§04  How we're structured</SectionEyebrow>
            <h2 className="font-display mt-4 text-4xl font-[450] leading-[1.05] tracking-tight sm:text-5xl">A software<br />layer, not a<br /><span className="italic" style={{ color: "var(--emerald)" }}>fintech</span>.</h2>
            <p className="mt-6 max-w-md text-base leading-relaxed" style={{ color: "var(--muted)" }}>This isn't legal hedging — it's the design. The defensible position in Nigerian cross-border payments is to own the workflow and the documentation, not the custody.</p>
            <p className="mt-4 max-w-md text-sm" style={{ color: "var(--muted)" }}>Money is moved by parties already licensed to move it. We give them better tools.</p>
          </div>
          <div className="lg:col-span-7">
            <div className="space-y-3">
              {points.map((p) => (
                <div key={p.n} className="card-soft rounded-2xl bg-white p-6" style={{ border: "1px solid var(--line)" }}>
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-[11px] font-medium pt-1" style={{ color: "var(--emerald)" }}>{p.n}</span>
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-semibold" style={{ color: "var(--ink)" }}>{p.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{p.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Hero({ onGetStarted }) {
  return (
    <section className="relative overflow-hidden hero-mesh" style={{ color: "var(--bone)" }}>
      <div className="absolute inset-0 hero-grid" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="rise inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-6" style={{ borderColor: "rgba(197,242,74,0.3)", background: "rgba(197,242,74,0.05)" }}>
              <div className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: "var(--lime)", boxShadow: "0 0 8px var(--lime)" }} />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--lime)" }}>For Nigerian Agent Operators</span>
            </div>
            <h1 className="rise font-display text-[44px] font-[450] leading-[1.02] tracking-tight sm:text-6xl lg:text-[72px]">Cross-border FX<br /><span className="italic" style={{ color: "var(--lime)" }}>businesses run on.</span></h1>
            <p className="rise mt-8 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "rgba(247,245,240,0.65)", animationDelay: "0.16s" }}>24hr settlement. Locked rates. Complete trade documentation. The infrastructure operators leverage to move business funds — <span className="font-semibold" style={{ color: "var(--bone)" }}>to and from Nigeria</span> — without the friction that comes with it.</p>
            <div className="rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.24s" }}>
              <button onClick={onGetStarted} className="glow-lime inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition" style={{ background: "var(--lime)", color: "var(--ink)" }}>Become an operator <ArrowRight size={16} /></button>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--bone)" }}><MessageCircle size={16} /> Talk on WhatsApp</a>
            </div>
            <div className="rise mt-12 flex flex-wrap gap-x-8 gap-y-3" style={{ animationDelay: "0.32s" }}>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.45)" }}>Your share</div>
                <div className="font-display text-lg font-semibold mt-0.5">55–75% of margin</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.45)" }}>Direction</div>
                <div className="font-display text-lg font-semibold mt-0.5 flex items-center gap-2">
                  <span>NGN</span>
                  <ArrowLeftRight size={16} style={{ color: "var(--lime)" }} strokeWidth={2} />
                  <span>World</span>
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.45)" }}>Powered by</div>
                <div className="font-display text-lg font-semibold mt-0.5">Licensed partners</div>
              </div>
            </div>
          </div>
          <div className="rise lg:col-span-5" style={{ animationDelay: "0.3s" }}><HeroChat /></div>
        </div>
      </div>
    </section>
  );
}

function HeroChat() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setStep((s) => Math.min(s + 1, 5)), 1800);
    return () => clearInterval(i);
  }, []);
  const messages = [
    { from: "customer", text: "I need to pay $25K to my Shenzhen supplier" },
    { from: "operator", text: "Sure. Send the invoice. I'll get you a quote in 2 minutes." },
    { from: "operator", text: "[forwards to XaePay]" },
    { from: "xae", text: "Wholesale rate: ₦1,395/$ — Documented tier (Form M + audit pack) minimum: ₦1,398.50/$ — earnings at minimum markup: $26.83 — set your own markup higher to earn more" },
    { from: "operator", text: "₦1,400/$. ₦35,000,000 total. Form M + audit pack included.\n\nLocked 4 minutes. Reply CONFIRM to proceed." },
    { from: "customer", text: "CONFIRM" },
  ];

  return (
    <div className="card-soft rounded-2xl p-5 sm:p-6" style={{ background: "white", border: "1px solid var(--line)" }}>
      <div className="mb-4 flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><MessageCircle size={14} /></div>
          <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>WhatsApp</span>
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--emerald)" }}>● live demo</span>
      </div>
      <div className="space-y-2">
        {messages.slice(0, step + 1).map((m, i) => (
          <div key={i} className={`flex ${m.from === "customer" ? "justify-end" : "justify-start"} fade-in`}>
            <div className="max-w-[85%]">
              <div className="font-mono text-[9px] mb-1 uppercase tracking-wider" style={{ color: m.from === "customer" ? "var(--muted)" : m.from === "operator" ? "var(--emerald)" : "var(--ink)", textAlign: m.from === "customer" ? "right" : "left" }}>
                {m.from === "customer" ? "Customer" : m.from === "operator" ? "You · the operator" : "XaePay · internal"}
              </div>
              <div className="rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line" style={
                m.from === "customer" ? { background: "rgba(15,95,63,0.08)", color: "var(--ink)" } :
                m.from === "operator" ? { background: "var(--bone)", color: "var(--ink)", border: "1px solid var(--line)" } :
                { background: "var(--ink)", color: "var(--bone)", fontFamily: "ui-monospace, monospace", fontSize: "11px" }
              }>
                {m.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mb-14 max-w-2xl">
        <SectionEyebrow>How it works</SectionEyebrow>
        <h2 className="font-display mt-4 text-4xl font-[450] leading-[1.05] tracking-tight sm:text-5xl">Three stages. <span className="italic" style={{ color: "var(--emerald)" }}>One platform.</span></h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: "var(--muted)" }}>Everything starts with onboarding your customer through our compliance partner's KYC. Once approved (5–15 days), they can transact through you indefinitely.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          { n: "01", title: "Customer KYC onboarding", body: "You forward your customer's details to XaePay. We submit to our licensed payment partner's compliance team. They review and approve (5–15 business days). Customer becomes 'Approved' status. Only approved customers can transact.", footer: "First-time only · per customer" },
          { n: "02", title: "Per-transaction quote", body: "Customer messages you with payment details. You forward to XaePay. We quote five tiers, you pick one and set your markup. Customer confirms, gets funding instructions, deposits NGN. Our licensed partner executes the wire same day.", footer: "Every transaction" },
          { n: "03", title: "Documentation + earnings", body: "XaePay handles invoice validation, BOL collection, audit pack assembly per the tier you selected. Earnings calculated on each transaction. Bi-weekly payouts to your Nigerian bank account.", footer: "Automatic · ongoing" },
        ].map((s) => (
          <div key={s.n} className="card-soft rounded-2xl bg-white p-6" style={{ border: "1px solid var(--line)" }}>
            <div className="font-mono text-[11px] font-medium" style={{ color: "var(--emerald)" }}>{s.n}</div>
            <h3 className="font-display mt-4 text-lg font-semibold" style={{ color: "var(--ink)" }}>{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{s.body}</p>
            <div className="mt-4 pt-3 font-mono text-[10px] uppercase tracking-wider" style={{ borderTop: "1px solid var(--line)", color: "var(--muted)" }}>{s.footer}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl p-5" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
        <div className="flex items-start gap-3">
          <Shield size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
          <div className="text-sm" style={{ color: "var(--ink)" }}>
            <span className="font-semibold">Why customer KYC is the gating step.</span> Our licensed payment partner is the regulated entity executing every wire. Their AML obligations require KYC approval before any customer can transact, regardless of how the customer was introduced. XaePay handles the submission and chases approval, but the timeline (5–15 days) sits with the partner's compliance team. Plan for it as the first conversation with any new customer — not a barrier you discover after they're ready to send.
          </div>
        </div>
      </div>
    </section>
  );
}

function FourTiers({ onGetStarted }) {
  return (
    <section className="border-y" style={{ borderColor: "var(--line)", background: "var(--bone)" }}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mb-14 max-w-2xl">
          <SectionEyebrow>Service tiers</SectionEyebrow>
          <h2 className="font-display mt-4 text-4xl font-[450] leading-[1.05] tracking-tight sm:text-5xl">Five tiers. <span className="italic" style={{ color: "var(--emerald)" }}>You pick</span> per transaction.</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: "var(--muted)" }}>Each tier has a minimum markup that reflects how much validation work XaePay does. Above the minimum, you set whatever rate your customer can bear. Pick based on whether you're handling invoice review yourself or paying us to do it.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Object.values(TIERS).map((t, i) => {
            const isPro = t.id === "pro";
            const features = TIER_FEATURES[t.id] || [];
            return (
              <div key={t.id} className="card-soft card-lift relative overflow-hidden rounded-2xl p-6" style={isPro ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
                {isPro && <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-2xl" style={{ background: "var(--lime)" }} />}
                <div className="relative">
                  <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: isPro ? "rgba(247,245,240,0.5)" : "var(--muted)" }}>Tier {i + 1}</div>
                  <div className="font-display mt-1 text-xl font-semibold">{t.name}</div>
                  <div className="mt-1 text-xs" style={{ color: isPro ? "rgba(247,245,240,0.7)" : "var(--muted)" }}>{t.tagline}</div>
                </div>
                <div className="relative mt-5 pt-4" style={{ borderTop: `1px solid ${isPro ? "rgba(255,255,255,0.08)" : "var(--line)"}` }}>
                  <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: isPro ? "rgba(247,245,240,0.5)" : "var(--muted)" }}>Minimum markup</div>
                  <div className="font-display text-2xl font-[500] tracking-tight" style={{ color: isPro ? "var(--lime)" : "var(--ink)" }}>₦{t.minMarkup.toFixed(2)} <span className="text-sm" style={{ color: isPro ? "rgba(247,245,240,0.6)" : "var(--muted)" }}>/ $</span></div>
                </div>
                <ul className="relative mt-5 space-y-2">
                  {features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 size={11} className="mt-0.5 flex-shrink-0" style={{ color: isPro ? "var(--lime)" : "var(--emerald)" }} strokeWidth={2.25} />
                      <span style={{ color: isPro ? "rgba(247,245,240,0.85)" : "var(--ink)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-8 rounded-2xl p-5" style={{ background: "white", border: "1px solid var(--line)" }}>
          <div className="flex items-start gap-3">
            <Sparkles size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
            <div className="text-sm" style={{ color: "var(--ink)" }}>
              <span className="font-semibold">How tier selection actually works.</span> Basic is for small price-competitive transactions ($10K–$25K). Use Standard if you already vet your customers' invoices carefully and want max margin. Verified hands invoice review to XaePay so you don't have to bounce issues yourself. Documented adds a defensible audit pack per transaction. Compliance Pro is for high-stakes flows or aggregator workflows where you want zero compliance work. Same operator, different tiers per transaction — your judgment.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Per-tier feature copy used in the FourTiers landing section. Keeps TIERS itself
// focused on numeric pricing fields; copy lives here so it's easy to edit.
const TIER_FEATURES = {
  basic: [
    "Same-day wire execution via licensed partner",
    "Light invoice + sanctions check",
    "Best for small ($10K–$25K) or price-competitive transactions",
    "Operator handles customer comms",
    "Transaction receipt + MT103 reference",
    "75% to you · 25% to XaePay",
  ],
  standard: [
    "Same-day wire execution via licensed partner",
    "Agent self-validates customer invoices",
    "Sanctions screening (OFAC, UN, EU)",
    "Supplier KYB pre-screen",
    "Transaction receipt + MT103 reference",
    "70% to you · 30% to XaePay",
  ],
  verified: [
    "Everything in Standard",
    "OCR invoice extraction + match check",
    "Reject + reason sent back if invoice fails",
    "Customer fixes and resubmits via you",
    "Saves you from invoice review work",
    "65% to you · 35% to XaePay",
  ],
  documented: [
    "Everything in Verified",
    "Full Invoice Validation Report",
    "Form M reference + format check",
    "BOL + customs + delivery follow-up agent",
    "Per-transaction audit pack",
    "Document archive (multi-year)",
    "60% to you · 40% to XaePay",
  ],
  pro: [
    "Everything in Documented",
    "Deep invoice validation + supplier authentication",
    "Historical pattern checking",
    "Quarterly compliance pack (auto-prepared)",
    "Regulatory inquiry response service",
    "Priority compliance review",
    "Dedicated documentation officer",
    "55% to you · 45% to XaePay",
  ],
};

function PartnerEconomics({ onGetStarted }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionEyebrow>Your economics</SectionEyebrow>
          <h2 className="font-display mt-4 text-4xl font-[450] leading-[1.05] tracking-tight sm:text-5xl">You keep <span className="italic" style={{ color: "var(--emerald)" }}>55–75%</span><br />based on tier.</h2>
          <p className="mt-6 text-base leading-relaxed" style={{ color: "var(--muted)" }}>Your share of the markup depends on which tier you pick for each transaction. Lower tiers leave more work to you and your share is higher. Higher tiers have us doing more work, so our share grows. Both sides win at every tier.</p>
          <button onClick={onGetStarted} className="mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition" style={{ background: "var(--ink)", color: "var(--bone)" }}>Become an operator <ArrowRight size={14} /></button>
        </div>
        <div className="lg:col-span-7 space-y-3">
          {Object.values(TIERS).map((t) => {
            const exampleAmount = 25000;
            const exampleMarkup = t.minMarkup + 1.5;
            const margin = (exampleAmount * exampleMarkup) / (1395 + exampleMarkup);
            const opEarn = margin * t.operatorShare;
            return (
              <div key={t.id} className="card-soft rounded-2xl bg-white p-5" style={{ border: "1px solid var(--line)" }}>
                <div className="flex items-baseline justify-between mb-1">
                  <div>
                    <div className="font-display text-base font-semibold" style={{ color: "var(--ink)" }}>{t.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>min ₦{t.minMarkup.toFixed(2)}/$ · markup at ₦{exampleMarkup.toFixed(2)} on $25K</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-semibold" style={{ color: "var(--emerald)" }}>${opEarn.toFixed(2)}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>your share ({(t.operatorShare * 100).toFixed(0)}%)</div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="card-soft rounded-2xl bg-white p-5" style={{ border: "1px solid var(--line)" }}>
            <div className="flex items-start gap-2">
              <Sparkles size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
              <div className="text-xs" style={{ color: "var(--ink)" }}>
                <span className="font-semibold">A partner doing 30 transactions/month at $40K average</span> across mixed tiers earns roughly <span className="font-semibold" style={{ color: "var(--emerald)" }}>$2,400–$3,800/month</span> depending on tier mix and markup levels. Recurring as long as customers keep transacting.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA({ onGetStarted }) {
  return (
    <section className="border-t" style={{ borderColor: "var(--line)", background: "var(--bone)" }}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl font-[450] leading-[1.05] tracking-tight sm:text-5xl">Ready to plug in?</h2>
          <p className="mt-5 text-base leading-relaxed" style={{ color: "var(--muted)" }}>Sign up in 4 minutes. Refer your first customer this week. Get them transacting in 5–10 business days. Earnings start with their first payment.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={onGetStarted} className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition" style={{ background: "var(--ink)", color: "var(--bone)" }}>Become an operator <ArrowRight size={16} /></button>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition hover:bg-white" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><MessageCircle size={16} /> Ask questions</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroWidget() {
  const [step, setStep] = useState(0);
  useEffect(() => { const i = setInterval(() => setStep((s) => (s + 1) % 5), 2200); return () => clearInterval(i); }, []);
  const steps = [
    { label: "Invoice received", status: "Parsing metadata…", icon: FileText },
    { label: "Payer-name validated", status: "Match confirmed", icon: CheckCircle2 },
    { label: "Sanctions screening", status: "Clear — 0 hits", icon: Shield },
    { label: "Rate locked · routing", status: "Optimal route · ₦18 cheaper", icon: Zap },
    { label: "Payment executed", status: "MT103 delivered", icon: Send },
  ];
  return (
    <div className="border-gradient-dark relative overflow-hidden rounded-2xl p-5" style={{ background: "var(--ink-2)" }}>
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, rgba(197,242,74,0.25), transparent)" }} />
      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(197,242,74,0.1)" }}><MessageCircle size={14} style={{ color: "var(--lime)" }} /></div><span className="font-mono text-xs uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.9)" }}>Live · xae.agent</span></div>
        <span className="font-mono text-[10px]" style={{ color: "rgba(247,245,240,0.4)" }}>01:24 utc+1</span>
      </div>
      <div className="relative space-y-2">
        {steps.map((s, i) => {
          const Icon = s.icon; const active = i <= step; const current = i === step;
          return (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500" style={{ background: current ? "rgba(197,242,74,0.08)" : active ? "rgba(255,255,255,0.03)" : "transparent", opacity: active ? 1 : 0.3 }}>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition" style={{ background: current ? "var(--lime)" : active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)", color: current ? "var(--ink)" : "var(--bone)" }}><Icon size={14} /></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-medium" style={{ color: "var(--bone)" }}>{s.label}</div><div className="font-mono text-[10px]" style={{ color: "rgba(247,245,240,0.5)" }}>{s.status}</div></div>
              {current && <div className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: "var(--lime)", boxShadow: "0 0 6px var(--lime)" }} />}
            </div>
          );
        })}
      </div>
      <div className="relative mt-4 flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.5)" }}>Compliance score</span>
        <span className="font-mono text-sm font-semibold" style={{ color: "var(--lime)" }}>98.4 / 100</span>
      </div>
    </div>
  );
}

function Ticker() {
  const data = [
    { label: "USD / NGN", value: "1,395.00", delta: "Operator quote" },
    { label: "GBP / NGN", value: "1,852.00", delta: "Operator quote" },
    { label: "EUR / NGN", value: "1,602.00", delta: "Operator quote" },
    { label: "USDT / NGN", value: "1,388.40", delta: "LP match" },
    { label: "Corridors", value: "NGN ↔ USD, GBP, EUR, CNY, AED + diaspora inbound", delta: "" },
    { label: "Rails", value: "Licensed payment partner network", delta: "" },
    { label: "Rejection rate", value: "0.3%", delta: "vs 7% industry" },
  ];
  return (
    <section className="overflow-hidden" style={{ background: "var(--ink)", color: "var(--bone)", borderBottom: "1px solid var(--line)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8 overflow-x-auto py-4 sm:gap-12">
          {data.map((d, i) => (
            <div key={i} className="flex flex-shrink-0 items-baseline gap-2 whitespace-nowrap">
              <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.45)" }}>{d.label}</span>
              <span className="font-mono text-sm font-semibold">{d.value}</span>
              {d.delta && <span className="font-mono text-[10px]" style={{ color: "var(--lime)" }}>{d.delta}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    { icon: FileText, title: "Stale invoices", body: "90-day-old invoices that receiving banks reject on review." },
    { icon: AlertTriangle, title: "Payer-name mismatch", body: "CBN rules require the payer on invoice to match sending account." },
    { icon: Receipt, title: "Amount reconciliation", body: "Partial payments without documentation get flagged and held." },
    { icon: Shield, title: "Quarterly partner reviews", body: "Audit evidence packs prepared and delivered to our licensed payment partner each quarter. Missing docs risks rail access." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionEyebrow>§01  The problem</SectionEyebrow>
          <h2 className="font-display mt-4 text-4xl font-[450] leading-[1.05] tracking-tight sm:text-5xl">Cross-border<br />payments fail <span className="italic" style={{ color: "var(--emerald)" }}>where</span><br />the paperwork fails.</h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed" style={{ color: "var(--muted)" }}>The rails work. The FX works. What breaks a trade wire is the documentation that travels with it — and that's what XaePay owns.</p>
        </div>
        <div className="lg:col-span-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {problems.map((p, i) => (
              <div key={i} className="card-soft card-lift rounded-2xl bg-white p-6" style={{ border: "1px solid var(--line)" }}>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><p.icon size={18} strokeWidth={1.75} /></div>
                <h3 className="font-display text-lg font-semibold" style={{ color: "var(--ink)" }}>{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RailsSection() {
  const guarantees = [
    { title: "Same-day execution", desc: "Standard wires settle T+0 to most corridors; T+1 in tighter windows. Live status surfaced to your agent operator and customer." },
    { title: "Multiple settlement corridors", desc: "USD, GBP, EUR, CNY, AED outbound. NGN inbound. Best-route logic picks the corridor with the lowest all-in cost for each transaction." },
    { title: "Disclosed at every hop", desc: "Customer, agent operator, payment partner, beneficiary — every party is named on the audit trail. No silent intermediaries." },
    { title: "Compliance-ready by default", desc: "Sanctions screening, payer-name match, Form M / Form A pre-flight. Documentation generated and archived per transaction." },
  ];
  return (
    <section className="border-y" style={{ borderColor: "var(--line)", background: "var(--bone)" }}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionEyebrow>§02  Payment infrastructure</SectionEyebrow>
            <h2 className="font-display mt-4 text-4xl font-[450] leading-[1.05] tracking-tight sm:text-5xl">Backed by <span className="italic" style={{ color: "var(--emerald)" }}>licensed</span> payment partners.</h2>
            <p className="mt-6 max-w-md text-base leading-relaxed" style={{ color: "var(--muted)" }}>XaePay routes every transaction through regulated payment infrastructure. Your agent operator handles the customer; our partners handle the wire. You get the workflow, the docs, and the audit trail.</p>
          </div>
          <div className="lg:col-span-7">
            <div className="space-y-3">
              {guarantees.map((g, i) => (
                <div key={i} className="card-soft rounded-2xl bg-white p-5 flex items-start gap-4" style={{ border: "1px solid var(--line)" }}>
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><Shield size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-semibold">{g.title}</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentsSection() {
  const agents = [
    { n: "01", title: "Invoice Integrity", body: "Validates freshness, amounts, metadata. Auto-requests revisions from suppliers." },
    { n: "02", title: "Payer-Name Match", body: "Cross-checks invoice payer against sending account. Catches CBN-rejection triggers." },
    { n: "03", title: "Supplier KYB", body: "Screens suppliers against OFAC, UN, EU, Nigerian watchlists." },
    { n: "04", title: "Documentation", body: "Generates Form M, MT103 references, third-party authorizations." },
    { n: "05", title: "Evidence Pack", body: "Collects bills of lading, customs releases, delivery confirmations." },
    { n: "06", title: "Dispute Resolution", body: "Rejected wires open resolution workflows with full audit trail." },
  ];
  return (
    <section className="border-b" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mb-14 max-w-2xl">
          <SectionEyebrow>§03  The agents</SectionEyebrow>
          <h2 className="font-display mt-4 text-4xl font-[450] leading-[1.05] tracking-tight sm:text-5xl">Six AI agents.<br />One <span className="italic" style={{ color: "var(--emerald)" }}>defensible</span> transaction.</h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--line)" }}>
            {agents.map((a, i) => (
              <div key={i} className="group relative overflow-hidden bg-white p-7 transition hover:bg-[color:var(--bone)]">
                <div className="flex items-start justify-between"><span className="font-mono text-[11px] font-medium" style={{ color: "var(--emerald)" }}>{a.n}</span><Sparkles size={14} className="opacity-0 transition group-hover:opacity-100" style={{ color: "var(--emerald)" }} /></div>
                <h3 className="font-display mt-8 text-xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SidesSection({ setView }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mb-14 max-w-2xl">
        <SectionEyebrow>§05  Who it serves</SectionEyebrow>
        <h2 className="font-display mt-4 text-4xl font-[450] leading-[1.05] tracking-tight sm:text-5xl">Six sides. One<br /><span className="italic" style={{ color: "var(--emerald)" }}>infrastructure</span>.</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SideMiniCard icon={Building2} label="Businesses" desc="Pay foreign suppliers. Direct rail access." onClick={() => setView("customer")} live />
        <SideMiniCard icon={Send} label="Overseas Operators" desc="Individuals or businesses abroad sending foreign currency to settle as NGN locally in Nigeria." onClick={() => setView("diaspora")} live />
        <SideMiniCard icon={User} label="Individuals" desc="Trade payments via BDC payment-agent." onClick={() => setView("customer")} phase2 />
        <SideMiniCard icon={Briefcase} label="Exchange Operators" desc="CBN-licensed BDCs and equivalent foreign wrappers. Operate platform, source liquidity." onClick={() => setView("bdc")} live />
        <SideMiniCard icon={Layers} label="Payment Agents" desc="IMTO / SCUML / CAC+BDC-partner. Same platform, different wrapper." onClick={() => setView("bdc")} live />
        <SideMiniCard icon={Coins} label="Liquidity Providers" desc="Sell USDT to BDCs. Receive naira." onClick={() => setView("lp")} phase2 />
      </div>
    </section>
  );
}

function SideMiniCard({ icon: Icon, label, desc, onClick, live, phase2 }) {
  return (
    <button onClick={onClick} className="card-soft card-lift rounded-2xl bg-white p-6 text-left" style={{ border: "1px solid var(--line)" }}>
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><Icon size={18} strokeWidth={1.75} /></div>
        {live && <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--emerald)", color: "var(--lime)" }}>Onboarding partners</span>}
        {phase2 && <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}>Phase 2</span>}
      </div>
      <h3 className="font-display mt-5 text-lg font-semibold">{label}</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{desc}</p>
    </button>
  );
}

function PricingSection({ onRequestAccess, onWaitlist }) {
  // Pricing CTAs route to waitlist (real signups), not the simulated onboarding.
  // eslint-disable-next-line no-param-reassign
  const cta = onWaitlist || onRequestAccess;
  const [audience, setAudience] = useState("business");
  return (
    <section className="border-y" style={{ borderColor: "var(--line)", background: "var(--bone)" }}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mb-10 max-w-2xl">
          <SectionEyebrow>§06  Pricing</SectionEyebrow>
          <h2 className="font-display mt-4 text-4xl font-[450] leading-[1.05] tracking-tight sm:text-5xl">You pay for the <span className="italic" style={{ color: "var(--emerald)" }}>work</span>.<br />Not for the wire.</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: "var(--muted)" }}>Flat transaction fees, transparent subscriptions. No percentage of your payment. No hidden FX markup. What you see is what you pay.</p>
        </div>
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl p-1" style={{ background: "white", border: "1px solid var(--line)", width: "fit-content" }}>
          {[
            { id: "business", label: "Businesses" },
            { id: "diaspora", label: "Overseas Operators" },
            { id: "bdc", label: "Exchange Operators" },
          ].map((t) => (
            <button key={t.id} onClick={() => setAudience(t.id)} className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition" style={audience === t.id ? { background: "var(--ink)", color: "var(--bone)" } : { color: "var(--muted)" }}>{t.label}</button>
          ))}
        </div>
        {audience === "business" && <BusinessPricing onRequestAccess={cta} />}
        {audience === "diaspora" && <DiasporaPricing onRequestAccess={cta} />}
        {audience === "bdc" && <BDCPricing onRequestAccess={cta} />}
        <div className="mt-6 rounded-xl p-4 text-xs" style={{ background: "white", border: "1px solid var(--line)" }}>
          <div className="flex items-start gap-2">
            <Layers size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--muted)" }} />
            <p style={{ color: "var(--muted)" }}><span className="font-semibold" style={{ color: "var(--ink)" }}>Payment Agents (IMTO / SCUML / CAC + bank-partner)</span> and <span className="font-semibold" style={{ color: "var(--ink)" }}>USDT Liquidity Providers</span> have separate pricing — published when those tiers open. <button onClick={cta} className="underline font-semibold" style={{ color: "var(--emerald)" }}>Talk to us →</button></p>
          </div>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid var(--line)" }}>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)" }}><Shield size={14} style={{ color: "var(--emerald)" }} /></div>
              <div className="text-sm">
                <div className="font-semibold" style={{ color: "var(--ink)" }}>Rejection Protection · 0.15% add-on</div>
                <div className="mt-1" style={{ color: "var(--muted)" }}>Available on every tier. If a wire XaePay cleared gets rejected, we eat the re-issuance and BDC penalty.</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid var(--line)" }}>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)" }}><Sparkles size={14} style={{ color: "var(--emerald)" }} /></div>
              <div className="text-sm">
                <div className="font-semibold" style={{ color: "var(--ink)" }}>No FX markup</div>
                <div className="mt-1" style={{ color: "var(--muted)" }}>BDC spread is disclosed and paid to the BDC. XaePay doesn't touch FX margin.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessPricing({ onRequestAccess }) {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-3">
        <PriceCard tier="Core" subtitle="Most businesses" price="$19" priceSuffix="/ transaction" subscription="$99 /month"
          features={["WhatsApp conversational agent", "Invoice Integrity + Payer-Name Match", "Supplier KYB screening", "Rail access via your BDC", "Transaction ledger & reports"]}
          min="Billed monthly · cancel anytime" onSelect={onRequestAccess} />
        <PriceCard tier="Compliance Plus" subtitle="Regular trade flows" price="$39" priceSuffix="/ transaction" subscription="$299 /month"
          features={["Everything in Core", "Supplier communication automation", "Payment-to-invoice reconciliation", "Advanced sanctions screening", "Full document archive", "Priority WhatsApp support"]}
          min="Billed monthly · cancel anytime" highlighted onSelect={onRequestAccess} />
        <PriceCard tier="Compliance Pro" subtitle="High-volume corporate" price="$79" priceSuffix="/ transaction" subscription="$599 /month"
          features={["Everything in Plus", "Quarterly Evidence Packs", "Dispute & rejection resolution", "Periodic supplier KYB refresh", "Dedicated compliance officer", "SLA-backed response times"]}
          min="Annual billing available" onSelect={onRequestAccess} />
      </div>
      <div className="mt-5 rounded-xl p-4 text-xs" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
        <div className="flex items-start gap-2">
          <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} strokeWidth={2.25} />
          <p style={{ color: "var(--ink)" }}><span className="font-semibold">Why flat fees:</span> The compliance work is the same whether you send $5,000 or $500,000. We charge for the work, not the wire. A $100K payment costs $39 on Plus — not $500.</p>
        </div>
      </div>
    </div>
  );
}

function DiasporaPricing({ onRequestAccess }) {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-3">
        <PriceCard tier="Small sends" subtitle="Under $1,000" price="$3.99" priceSuffix="flat"
          features={["Any African account", "5-minute typical delivery", "Full WhatsApp workflow", "FX rate locked 4 min", "Rates shown before you send"]}
          min="No subscription · pay per send" onSelect={onRequestAccess} />
        <PriceCard tier="Regular sends" subtitle="$1,000 – $5,000" price="$9.99" priceSuffix="flat"
          features={["Everything in Small sends", "Purpose-specific docs (vendor, school, property)", "Multi-currency: USD / GBP / EUR / CAD", "Priority routing on Cedar rail", "Receipt + recipient confirmation"]}
          min="No subscription · pay per send" highlighted onSelect={onRequestAccess} />
        <PriceCard tier="Large sends" subtitle="Above $5,000" price="0.40%" priceSuffix="capped at $49"
          features={["Everything in Regular sends", "Enhanced vendor documentation", "Premium routing for $25K+", "Dedicated compliance support", "Volume bonuses above $50K/month"]}
          min="Tier 2 or 3 account required" onSelect={onRequestAccess} />
      </div>
      <div className="mt-5 rounded-xl p-4 text-xs" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
        <div className="flex items-start gap-2">
          <TrendingUp size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
          <p style={{ color: "var(--ink)" }}><span className="font-semibold">Compare:</span> Sending $10,000 home? XaePay charges $40. Wise charges $67. WorldRemit charges $92. And our FX rate is tighter.</p>
        </div>
      </div>
    </div>
  );
}

function BDCPricing({ onRequestAccess }) {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-3">
        <PriceCard tier="Operator" subtitle="Under $2M/mo volume" price="$500" priceSuffix="/ month"
          features={["Full compliance dashboard", "Agent-powered transaction processing", "CBN reporting automation", "Customer KYB management", "Licensed payment partner access", "25% rev-share on end-user fees"]}
          min="3-month minimum commitment" onSelect={onRequestAccess} />
        <PriceCard tier="Scale" subtitle="$2M – $10M/mo volume" price="$2,000" priceSuffix="/ month"
          features={["Everything in Operator", "USDT Liquidity Marketplace access", "Payment Agent tooling for individuals", "Quarterly partner evidence packs", "Priority compliance support", "25% rev-share on end-user fees"]}
          min="3-month minimum commitment" highlighted onSelect={onRequestAccess} />
        <PriceCard tier="Enterprise" subtitle="Over $10M/mo volume" price="$5,000" priceSuffix="/ month"
          features={["Everything in Scale", "White-label customer portal", "Dedicated compliance engineer", "Custom rail integrations", "Expanded evidence automation", "25% rev-share + volume bonuses"]}
          min="Annual contracts · custom SLAs" onSelect={onRequestAccess} />
      </div>
      <div className="mt-5 rounded-xl p-4 text-xs" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
        <div className="flex items-start gap-2">
          <Briefcase size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
          <p style={{ color: "var(--ink)" }}><span className="font-semibold">How rev-share works:</span> When a customer pays XaePay's transaction fee, 25% flows back to you monthly. A BDC routing 200 Plus-tier transactions sees ~$1,950/month in rev-share — more than covering the Operator subscription.</p>
        </div>
      </div>
    </div>
  );
}

function PaymentAgentPricing({ onRequestAccess }) {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-3">
        <PriceCard tier="Operator" subtitle="Under $5M/mo volume" price="$750" priceSuffix="/ month"
          features={["Full compliance dashboard", "Agent-powered transaction processing", "Regulatory reporting (CBN, SCUML, HMRC, FinCEN as applicable)", "Customer KYB management", "Licensed payment partner access", "25% rev-share on end-user fees"]}
          min="3-month minimum commitment" onSelect={onRequestAccess} />
        <PriceCard tier="Scale" subtitle="$5M – $25M/mo volume" price="$2,500" priceSuffix="/ month"
          features={["Everything in Operator", "USDT Liquidity Marketplace access", "Multi-wrapper reporting automation", "Quarterly partner evidence packs", "Priority compliance support", "25% rev-share on end-user fees"]}
          min="3-month minimum commitment" highlighted onSelect={onRequestAccess} />
        <PriceCard tier="Enterprise" subtitle="Over $25M/mo volume" price="$6,000" priceSuffix="/ month"
          features={["Everything in Scale", "White-label customer portal", "Dedicated compliance engineer", "Custom rail integrations", "Cross-jurisdiction reporting bundle", "25% rev-share + volume bonuses"]}
          min="Annual contracts · custom SLAs" onSelect={onRequestAccess} />
      </div>
      <div className="mt-5 rounded-xl p-4 text-xs" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
        <div className="flex items-start gap-2">
          <Layers size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
          <p style={{ color: "var(--ink)" }}><span className="font-semibold">Volume bands calibrated to Payment Agent economics.</span> Tiers stretch higher than BDC tiers because Payment Agents typically run multi-corridor books at larger monthly volumes. 25% rev-share unchanged — it's the number that makes the unit economics work for both sides.</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl p-4 text-xs" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
        <div className="flex items-start gap-2">
          <Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--muted)" }} />
          <p style={{ color: "var(--muted)" }}><span className="font-semibold" style={{ color: "var(--ink)" }}>Admission criteria (Nigerian Phase 1b):</span> IMTO-licensed, SCUML-registered, or CAC-registered with named BDC/bank partner countersigning partnership letter. Verified against CBN and SCUML public registers. International wrappers (US MSB / UK MSB / UAE exchange house) open in next phase.</p>
        </div>
      </div>
    </div>
  );
}

function LPPricing({ onRequestAccess }) {
  return (
    <div>
      <div className="max-w-2xl">
        <div className="card-soft card-lift relative overflow-hidden rounded-2xl p-8" style={{ background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" }}>
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-2xl" style={{ background: "var(--lime)" }} />
          <div className="absolute right-5 top-5 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}>Phase 2</div>
          <div className="relative">
            <div className="font-display text-xl font-semibold tracking-tight">Liquidity Provider</div>
            <div className="mt-0.5 text-sm" style={{ color: "rgba(247,245,240,0.6)" }}>Sell USDT to Nigerian BDCs directly</div>
            <div className="mt-6 flex items-baseline gap-3">
              <div>
                <div className="font-display text-5xl font-[500] tracking-tight">Free</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.5)" }}>to list</div>
              </div>
              <span className="text-2xl" style={{ color: "rgba(247,245,240,0.3)" }}>·</span>
              <div>
                <div className="font-display text-5xl font-[500] tracking-tight" style={{ color: "var(--lime)" }}>0.10%</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.5)" }}>on matched volume</div>
              </div>
            </div>
            <ul className="mt-7 space-y-2.5 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                "No listing fee, no monthly subscription",
                "10 bps on matched USDT volume, deducted at settlement",
                "Multi-chain support: TRC-20, ERC-20, BEP-20",
                "Direct wallet-to-wallet settlement — XaePay never custodies",
                "Nigerian bank credit for naira side",
                "Ratings and match history visible to BDCs",
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--lime)" }} strokeWidth={2.25} />
                  <span style={{ color: "rgba(247,245,240,0.85)" }}>{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={onRequestAccess} className="mt-7 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition" style={{ background: "var(--lime)", color: "var(--ink)" }}>List your USDT</button>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-xl p-4 text-xs" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.3)" }}>
        <div className="flex items-start gap-2">
          <Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--amber)" }} />
          <p style={{ color: "var(--ink)" }}><span className="font-semibold">XaePay is not your counterparty.</span> Matches settle directly between your wallet and the BDC's. The 10 bps fee covers directory, matching, audit trail, and dispute tooling.</p>
        </div>
      </div>
    </div>
  );
}

function PriceCard({ tier, subtitle, price, priceSuffix, subscription, unit, features, min, highlighted, onSelect }) {
  return (
    <div className="card-soft card-lift relative overflow-hidden rounded-2xl p-7" style={highlighted ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
      {highlighted && (<><div className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-2xl" style={{ background: "var(--lime)" }} /><div className="absolute right-5 top-5 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--lime)", color: "var(--ink)" }}>Recommended</div></>)}
      <div className="relative mb-5"><div className="font-display text-xl font-semibold tracking-tight">{tier}</div><div className="mt-0.5 text-sm" style={{ color: highlighted ? "rgba(247,245,240,0.6)" : "var(--muted)" }}>{subtitle}</div></div>
      <div className="relative">
        <div className="flex items-baseline gap-2">
          <div className="font-display text-5xl font-[500] tracking-tight">{price}</div>
          {priceSuffix && <div className="font-mono text-[11px] uppercase tracking-wider" style={{ color: highlighted ? "rgba(247,245,240,0.6)" : "var(--muted)" }}>{priceSuffix}</div>}
        </div>
        {subscription && <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold" style={highlighted ? { background: "rgba(197,242,74,0.12)", color: "var(--lime)" } : { background: "var(--bone-2)", color: "var(--emerald)" }}>+ {subscription}</div>}
        {unit && !priceSuffix && <div className="mt-1 font-mono text-[11px] uppercase tracking-wider" style={{ color: highlighted ? "rgba(247,245,240,0.5)" : "var(--muted)" }}>{unit}</div>}
      </div>
      <ul className="relative mt-6 space-y-2.5 pt-6" style={{ borderTop: `1px solid ${highlighted ? "rgba(255,255,255,0.08)" : "var(--line)"}` }}>
        {features.map((f, i) => (<li key={i} className="flex items-start gap-2.5 text-sm"><CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: highlighted ? "var(--lime)" : "var(--emerald)" }} strokeWidth={2.25} /><span style={{ color: highlighted ? "rgba(247,245,240,0.85)" : "var(--ink)" }}>{f}</span></li>))}
      </ul>
      {min && <div className="relative mt-6 pt-5 font-mono text-[10px] uppercase tracking-wider" style={{ borderTop: `1px solid ${highlighted ? "rgba(255,255,255,0.08)" : "var(--line)"}`, color: highlighted ? "rgba(247,245,240,0.5)" : "var(--muted)" }}>{min}</div>}
      <button onClick={onSelect} className="relative mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition" style={highlighted ? { background: "var(--lime)", color: "var(--ink)" } : { background: "var(--ink)", color: "var(--bone)" }}>Get {tier}</button>
    </div>
  );
}

function Footer({ onWaitlist }) {
  return (
    <footer className="relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--bone)" }}>
      <div className="absolute inset-0 hero-grid opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, var(--emerald), var(--emerald-deep))" }}>
                <span className="font-display text-xl font-semibold" style={{ color: "var(--lime)" }}>X</span>
              </div>
              <span className="font-display text-2xl font-semibold tracking-tight">XaePay</span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed" style={{ color: "rgba(247,245,240,0.6)" }}>The cross-border payment infrastructure for Nigerian agent operators. Powered by licensed payment partners.</p>
            {onWaitlist && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={onWaitlist} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition" style={{ background: "var(--lime)", color: "var(--ink)" }}><Mail size={14} /> Join waitlist</button>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--bone)" }}><MessageCircle size={14} /> WhatsApp</a>
              </div>
            )}
          </div>
          <div className="md:col-span-6">
            <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.4)" }}>Compliance posture</div>
            <p className="mt-3 max-w-md text-xs leading-relaxed" style={{ color: "rgba(247,245,240,0.55)" }}>XaePay is a software and compliance documentation layer. Payment execution is performed by our licensed financial services partners under their respective regulatory authorizations. XaePay does not hold funds, quote FX on its own book, or transmit money. Specific licensed partner details are disclosed in the customer Terms of Service.</p>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 pt-8 sm:flex-row sm:items-center" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.4)" }}>© 2026 XaePay · Lagos · Los Angeles</div>
          <div className="flex gap-5 font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.4)" }}>
            <a href="/privacy.html" className="hover:text-white transition" style={{ color: "inherit" }}>Privacy</a>
            <a href="/data-deletion.html" className="hover:text-white transition" style={{ color: "inherit" }}>Data deletion</a>
            <span>Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function CustomerApp({ session }) {
  const [step, setStep] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: "47500", supplier: "Shenzhen Electronics Co., Ltd", country: "China", bdc: "Corporate Exchange BDC", invoiceUploaded: false, rail: "auto" });
  const userTier = session.tier ?? 0;
  const isIndividual = session.type === "individual";
  return (
    <>
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="rise">
          <SectionEyebrow>{isIndividual ? "Individual portal · via BDC payment agent" : "Business portal"}</SectionEyebrow>
          <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-[40px]">{isIndividual ? "New trade payment" : "New supplier payment"}</h1>
          <div className="mt-3"><TierBadge tier={userTier} /></div>
        </div>
        <button onClick={() => setHistoryOpen(true)} className="rise inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-[color:var(--bone-2)]" style={{ background: "white", border: "1px solid var(--line)", animationDelay: "0.05s" }}><History size={14} /> History</button>
      </div>
      {isIndividual && (
        <div className="mb-6 rise rounded-2xl p-5" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.3)" }}>
          <div className="flex items-start gap-3"><Sparkles size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--amber)" }} />
            <div className="text-sm" style={{ color: "var(--ink)" }}><div className="font-semibold">Phase 2 · Individual flow via BDC payment agent</div><p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>Per-transaction limit: $2,000. Monthly aggregate: $10,000. Your BDC pays in their name on your behalf with full disclosure.</p></div>
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Stepper step={step} />
          <div className="mt-6 rise" style={{ animationDelay: "0.1s" }}>
            {step === 1 && <StepIntake data={formData} setData={setFormData} onNext={() => setStep(2)} userTier={userTier} isIndividual={isIndividual} />}
            {step === 2 && <StepCompliance onNext={() => setStep(3)} onBack={() => setStep(1)} isIndividual={isIndividual} />}
            {step === 3 && <StepReview data={formData} onNext={() => setStep(4)} onBack={() => setStep(2)} isIndividual={isIndividual} />}
            {step === 4 && <StepConfirmed data={formData} onNew={() => setStep(1)} onHistory={() => setHistoryOpen(true)} isIndividual={isIndividual} />}
          </div>
        </div>
        <aside className="lg:col-span-4"><SidebarHelp isIndividual={isIndividual} /></aside>
      </div>
    </div>
    <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}

function Stepper({ step }) {
  const steps = ["Intake", "Compliance", "Review", "Confirmed"];
  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      {steps.map((label, i) => {
        const active = i + 1 === step; const done = i + 1 < step;
        return (
          <React.Fragment key={label}>
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition" style={done ? { background: "var(--emerald)", color: "var(--lime)" } : active ? { background: "var(--ink)", color: "var(--lime)" } : { background: "var(--bone-2)", color: "var(--muted)" }}>{done ? <CheckCircle2 size={14} strokeWidth={2.5} /> : i + 1}</div>
              <span className="hidden truncate text-sm font-medium sm:block" style={{ color: active ? "var(--ink)" : "var(--muted)" }}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className="h-px flex-1" style={{ background: done ? "var(--emerald)" : "var(--line)" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepIntake({ data, setData, onNext, userTier, isIndividual }) {
  const { push } = useToast();
  const handleUpload = () => { setData({ ...data, invoiceUploaded: true }); push("Invoice uploaded · agent reading…", "info"); };
  const amount = parseFloat(data.amount || 0);
  const limits = [0, 5000, 50000, Infinity];
  const exceedsLimit = amount > limits[userTier];
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">Payment details</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{isIndividual ? "Your BDC will pay this on your behalf as disclosed payment agent." : "Tell us who you're paying."}</p>
      {exceedsLimit && (
        <div className="mt-5 rounded-xl p-4 text-xs" style={{ background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e" }}>
          <div className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /><div><div className="font-semibold">Amount exceeds your tier limit</div><p className="mt-1">Tier {userTier} limit: ${limits[userTier].toLocaleString()}. <button className="underline font-semibold">Unlock the next tier →</button></p></div></div>
        </div>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Payment amount (USD)">
          <div className="focus-ring flex items-center rounded-xl transition" style={{ background: "white", border: "1px solid var(--line)" }}>
            <span className="pl-3.5 text-sm font-mono" style={{ color: "var(--muted)" }}>$</span>
            <input type="text" value={data.amount} onChange={(e) => setData({ ...data, amount: e.target.value })} className="w-full bg-transparent px-2 py-3 text-sm outline-none font-mono" />
          </div>
        </Field>
        <Field label="Destination country"><Select value={data.country} onChange={(e) => setData({ ...data, country: e.target.value })}><option>China</option><option>United States</option><option>United Kingdom</option><option>UAE</option><option>Germany</option></Select></Field>
        <Field label="Supplier name" full><Input value={data.supplier} onChange={(e) => setData({ ...data, supplier: e.target.value })} /></Field>
        <Field label="Routing BDC" full><Select value={data.bdc} onChange={(e) => setData({ ...data, bdc: e.target.value })}><option>Corporate Exchange BDC</option><option>Dula Global BDC (Tier 1)</option><option>Sevenlocks BDC</option><option>Bergpoint BDC</option></Select></Field>
      </div>
      <div className="mt-6">
        <Label>Rail preference</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <RoleBtn active={data.rail === "auto"} onClick={() => setData({ ...data, rail: "auto" })}>Auto-route (recommended)</RoleBtn>
          {SHOW_TRIPLE_A && <RoleBtn active={data.rail === "fiat"} onClick={() => setData({ ...data, rail: "fiat" })}>Force Triple-A direct USD</RoleBtn>}
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{data.rail === "auto" ? "We'll choose the optimal route" : "Override: fiat-only routing"}</p>
      </div>
      <div className="mt-6">
        <Label>Upload invoice</Label>
        <button type="button" onClick={handleUpload} className="w-full rounded-xl p-7 text-center transition" style={data.invoiceUploaded ? { background: "var(--bone-2)", border: "1.5px dashed var(--emerald)" } : { background: "white", border: "1.5px dashed var(--line)" }}>
          {data.invoiceUploaded ? (<><CheckCircle2 size={22} className="mx-auto" style={{ color: "var(--emerald)" }} strokeWidth={2} /><p className="mt-2 font-mono text-sm font-medium" style={{ color: "var(--emerald)" }}>invoice_shenzhen_0419.pdf · 247 KB</p><p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Click to replace</p></>) : (<><Upload size={22} className="mx-auto" style={{ color: "var(--muted)" }} strokeWidth={1.75} /><p className="mt-2.5 text-sm" style={{ color: "var(--ink)" }}>Drop PDF or image, or <span className="font-medium underline" style={{ color: "var(--emerald)" }}>browse files</span></p><p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Or send via WhatsApp to +234 700 XAE PAY</p></>)}
        </button>
      </div>
      <div className="mt-6 flex justify-end"><PrimaryBtn onClick={onNext}>Run compliance checks <ArrowRight size={14} /></PrimaryBtn></div>
    </Card>
  );
}

function StepCompliance({ onNext, onBack, isIndividual }) {
  const baseChecks = [
    { label: "Invoice freshness", status: "pass", detail: "Dated 14 days ago · within 30-day policy" },
    { label: "Amount reconciliation", status: "warn", detail: "Invoice $50,000 · requested $47,500 · partial payment doc generated" },
    { label: "Payer-name match", status: "pass", detail: "Invoice payer matches sending account" },
    { label: "Supplier sanctions", status: "pass", detail: "No hits on OFAC, UN, EU, Nigerian watchlists" },
    { label: "Form M pre-flight", status: "pass", detail: "HS code 8517.62.00 · Form M attached" },
    { label: "Rail availability", status: "pass", detail: "Optimal route selected · ₦18 below alternate" },
  ];
  const individualChecks = isIndividual ? [{ label: "Third-party authorization", status: "pass", detail: "BDC payment-agent letter generated · disclosed to receiving bank" }] : [];
  const checks = [...baseChecks, ...individualChecks];
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-display text-xl font-semibold">Compliance checks</h2><p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{isIndividual ? "Seven agents, four seconds." : "Six agents, four seconds."}</p></div>
        <div className="rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ background: "var(--emerald)", color: "var(--lime)" }}>{checks.length - 1} of {checks.length} clean</div>
      </div>
      <div className="mt-6 space-y-2">
        {checks.map((c, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-4 rise" style={{ background: "var(--bone)", border: "1px solid var(--line)", animationDelay: `${i * 0.06}s` }}>
            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={c.status === "pass" ? { background: "var(--emerald)", color: "var(--lime)" } : { background: "#fbbf24", color: "var(--ink)" }}>{c.status === "pass" ? <CheckCircle2 size={12} strokeWidth={2.5} /> : <AlertTriangle size={12} strokeWidth={2.5} />}</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium">{c.label}</div><div className="text-xs" style={{ color: "var(--muted)" }}>{c.detail}</div></div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row"><SecondaryBtn onClick={onBack}>Back</SecondaryBtn><PrimaryBtn onClick={onNext}>Review payment <ArrowRight size={14} /></PrimaryBtn></div>
    </Card>
  );
}

function StepReview({ data, onNext, onBack, isIndividual }) {
  const amount = parseFloat(data.amount || 0);
  const xaeFee = Math.max(25, amount * 0.005);
  const bdcSpread = amount * 0.018;
  const total = amount + xaeFee + bdcSpread;
  const railName = !SHOW_TRIPLE_A ? "Licensed payment partner" : (data.rail === "fiat" ? "Triple-A direct USD" : "Cedar USDT corridor");
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">Review & confirm</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Rate locked for 4 minutes. Everything disclosed.</p>
      <div className="mt-6 rounded-xl p-4" style={{ background: "var(--ink)", color: "var(--bone)" }}>
        <div className="flex items-start gap-3"><Layers size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--lime)" }} />
          <div className="flex-1 text-xs"><div className="font-mono uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.6)" }}>Selected rail</div><div className="font-display text-base font-semibold mt-0.5">{railName}</div>
            <p className="mt-1 leading-relaxed" style={{ color: "rgba(247,245,240,0.65)" }}>{isIndividual ? `${data.bdc} routes via our licensed payment partner → wires to ${data.supplier}.` : `Routed via ${data.bdc} → our licensed payment partner → MT103 wire to ${data.supplier}.`}</p>
          </div>
        </div>
      </div>
      <dl className="mt-4 overflow-hidden rounded-xl" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
        <Row label="Payment to" value={data.supplier} sub={data.country} />
        <Row label="Routing BDC" value={data.bdc} sub="Licensed Tier-2 · CBN-approved" />
        <Row label="Amount to supplier" value={`$${amount.toLocaleString()}`} sub="USD" mono />
        <Row label="BDC FX spread" value={`$${bdcSpread.toFixed(2)}`} sub="1.80% · disclosed" mono />
        <Row label="XaePay Compliance Plus" value={`$${xaeFee.toFixed(2)}`} sub="0.50% · software & compliance fee" mono />
        <div className="flex items-center justify-between p-4" style={{ background: "var(--ink)", color: "var(--bone)" }}><div className="text-sm font-medium">Total you pay</div><div className="font-display text-xl font-semibold" style={{ color: "var(--lime)" }}>${total.toFixed(2)}</div></div>
      </dl>
      <div className="mt-5 rounded-xl p-4 text-xs" style={{ background: "#fef9e7", border: "1px solid #fcd34d", color: "#92400e" }}>
        <div className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /><p>Partial payment: invoice $50,000 vs payment $47,500. Partial-payment letter ships with the wire.</p></div>
      </div>
      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row"><SecondaryBtn onClick={onBack}>Back</SecondaryBtn><PrimaryBtn onClick={onNext}>Execute payment <Send size={14} /></PrimaryBtn></div>
    </Card>
  );
}

function StepConfirmed({ data, onNew, onHistory, isIndividual }) {
  const { push } = useToast();
  const download = (name) => push(`${name} · download started`, "success");
  const openWhatsApp = () => { push("Opening WhatsApp…", "info"); window.open(WHATSAPP_URL, "_blank"); };
  const docs = isIndividual ? [
    { icon: Receipt, title: "Updated Invoice", detail: "Your name as buyer · BDC as funding source" },
    { icon: FileText, title: "Third-Party Authorization", detail: "BDC pays as disclosed agent" },
    { icon: Send, title: "Disclosed Payment Letter", detail: "Receiving bank knows the underlying buyer" },
    { icon: Package, title: "Service Agreement", detail: "BDC payment-agent terms" },
  ] : [
    { icon: Receipt, title: "Invoice Pack", detail: "Original · partial letter · reconciliation" },
    { icon: FileText, title: "CBN Documentation", detail: "Form M · HS code · supplier KYB" },
    { icon: Send, title: "MT103 Wire Reference", detail: "Pending · ~90 minutes" },
    { icon: Package, title: "Evidence Tracking", detail: "Bill of lading expected T+30" },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl p-8" style={{ background: "var(--ink)", color: "var(--bone)" }}>
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--lime), transparent)" }} />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={24} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
      <h2 className="font-display relative mt-5 text-[28px] font-[450] tracking-tight">Payment executed.</h2>
      <p className="relative mt-2 text-sm" style={{ color: "rgba(247,245,240,0.7)" }}>{isIndividual ? `Funds routed to ${data.supplier} via ${data.bdc} as your disclosed payment agent.` : `Funds routed to ${data.supplier}.`}</p>
      <div className="relative mt-6 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.6)" }}>Audit trail</div>
        <div className="mt-2 space-y-1.5 text-xs font-mono" style={{ color: "rgba(247,245,240,0.85)" }}>
          <div>1. {isIndividual ? "You → " : ""}{data.bdc} ← ₦{(parseFloat(data.amount) * 1395).toLocaleString()}</div>
          <div>2. {data.bdc} → Licensed payment partner ← ${parseFloat(data.amount).toLocaleString()}</div>
          <div>3. Partner → MT103 → {data.supplier}</div>
        </div>
      </div>
      <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
        {docs.map((d, i) => (
          <button key={i} onClick={() => download(d.title)} className="flex items-start gap-3 rounded-xl p-4 text-left transition hover:bg-white/5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(197,242,74,0.1)", color: "var(--lime)" }}><d.icon size={15} /></div>
            <div className="min-w-0"><div className="text-sm font-medium" style={{ color: "var(--bone)" }}>{d.title}</div><div className="font-mono text-[10px] mt-0.5" style={{ color: "rgba(247,245,240,0.5)" }}>{d.detail}</div></div>
          </button>
        ))}
      </div>
      <div className="relative mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button onClick={() => download("XaePay compliance pack (ZIP)")} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition glow-lime" style={{ background: "var(--lime)", color: "var(--ink)" }}><Download size={14} /> Download compliance pack</button>
        <button onClick={onHistory} className="rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>View history</button>
        <button onClick={onNew} className="rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>New payment</button>
        <button onClick={openWhatsApp} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.15)" }}><MessageCircle size={14} /> Message support</button>
      </div>
    </div>
  );
}

function SidebarHelp({ isIndividual }) {
  const { push } = useToast();
  const openWhatsApp = () => { push("Opening WhatsApp…", "info"); window.open(WHATSAPP_URL, "_blank"); };
  return (
    <div className="space-y-4 rise" style={{ animationDelay: "0.15s" }}>
      <Card>
        <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><MessageCircle size={14} /></div><span className="text-sm font-semibold">Continue on WhatsApp</span></div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>Most customers run the entire flow via WhatsApp. Send your invoice to +234 700 XAE PAY.</p>
        <button onClick={openWhatsApp} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-[color:var(--bone-2)]" style={{ border: "1px solid var(--emerald)", color: "var(--emerald)" }}><ExternalLink size={14} /> Open WhatsApp</button>
      </Card>
      {isIndividual ? (
        <Card>
          <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><Building2 size={14} /></div><span className="text-sm font-semibold">Outgrowing limits?</span></div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>Forming a business unlocks higher limits and direct rails.</p>
          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition" style={{ background: "var(--ink)", color: "var(--bone)" }}>Form business in 7 days <ArrowRight size={14} /></button>
        </Card>
      ) : (
        <Card>
          <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><Shield size={14} /></div><span className="text-sm font-semibold">Why your BDC?</span></div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>XaePay routes through a CBN-licensed BDC. We don't hold funds — we validate, document, defend.</p>
        </Card>
      )}
    </div>
  );
}

function HistoryDrawer({ open, onClose }) {
  const { push } = useToast();
  const history = [
    { id: "XP-9840", supplier: "Shenzhen Electronics Co.", amount: 47500, status: "Executed", date: "Today · 14:02", rail: "Cedar USDT" },
    { id: "XP-9788", supplier: "Horizon Metals LLC", amount: 28000, status: "Executed", date: "Apr 14 · 11:18", rail: "Cedar USDT" },
    { id: "XP-9741", supplier: "Mumbai Pharmachem", amount: 22400, status: "Executed", date: "Apr 08 · 09:32", rail: "Triple-A" },
    { id: "XP-9702", supplier: "Guangzhou Textiles", amount: 64000, status: "Executed", date: "Apr 02 · 16:44", rail: "Cedar USDT" },
    { id: "XP-9656", supplier: "Hamburg Auto Parts GmbH", amount: 18200, status: "Rejected", date: "Mar 29 · 13:07", rail: "Triple-A" },
  ];
  return (
    <Drawer open={open} onClose={onClose} title="Transaction history">
      <div className="space-y-2">
        {history.map((h) => (
          <button key={h.id} onClick={() => push(`Opening ${h.id} details`, "info")} className="w-full rounded-xl p-4 text-left transition hover:border-[color:var(--emerald)]" style={{ background: "white", border: "1px solid var(--line)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><div className="text-sm font-medium truncate">{h.supplier}</div><div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{h.date} · {h.id} · {h.rail}</div></div>
              <div className="text-right flex-shrink-0"><div className="font-mono text-sm font-semibold">${h.amount.toLocaleString()}</div><div className="font-mono text-[10px] mt-0.5" style={{ color: h.status === "Rejected" ? "#b91c1c" : "var(--emerald)" }}>{h.status}</div></div>
            </div>
          </button>
        ))}
      </div>
    </Drawer>
  );
}

function BDCDashboard({ session }) {
  const [tab, setTab] = useState("quote");
  const [addedCustomers, setAddedCustomers] = useState([]);
  const addCustomer = (c) => setAddedCustomers((prev) => [c, ...prev].slice(0, 50));
  const tabs = [
    { id: "quote", label: "Quote tool", icon: Plus },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "customers", label: "Customers", icon: User },
    { id: "recipients", label: "Recipients", icon: Briefcase },
    { id: "earnings", label: "Earnings", icon: TrendingUp },
  ];
  // Operator name + role line. Demo session passes a single string; real auth-backed
  // sessions may carry user_metadata.company. Fall back gracefully.
  const operatorName = session?.name || "Corporate Exchange BDC";
  const operatorRoleLine = session?.type === "agent"
    ? "IMTO / SCUML / CAC-registered · Payment Agent"
    : "CBN-licensed BDC · Partner active";
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="rise">
          <SectionEyebrow>Operator dashboard</SectionEyebrow>
          <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-[40px]">{operatorName}</h1>
          <div className="mt-2 font-mono text-xs" style={{ color: "var(--muted)" }}>{operatorRoleLine}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ background: "var(--lime)", color: "var(--ink)" }}>
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ink)" }} />
            Production
          </div>
        </div>
      </div>

      <div className="lg:flex lg:gap-8">
        <aside className="hidden lg:block lg:w-56 lg:flex-shrink-0">
          <nav className="sticky top-24 space-y-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition" style={active ? { background: "var(--ink)", color: "var(--bone)" } : { color: "var(--muted)" }}>
                  <Icon size={15} strokeWidth={1.75} />
                  <span className="font-medium">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="lg:hidden mb-6 flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--line)" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="relative whitespace-nowrap px-4 py-3 text-sm font-medium transition" style={{ color: tab === t.id ? "var(--ink)" : "var(--muted)" }}>
              {t.label}
              {tab === t.id && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px]" style={{ background: "var(--ink)" }} />}
            </button>
          ))}
        </div>

        <div className="flex-1 fade-in min-w-0">
          {tab === "quote" && <BDCRailQuotes />}
          {tab === "transactions" && <BDCTransactions />}
          {tab === "customers" && <BDCCustomers addedCustomers={addedCustomers} onAddCustomer={addCustomer} />}
          {tab === "recipients" && <BDCRecipients />}
          {tab === "earnings" && <BDCEarnings />}
        </div>
      </div>
    </div>
  );
}

function BDCEarnings() {
  // Static demo for now; real per-month aggregation lands with the backend pass.
  const months = [
    { m: "April 2026", tx: 19, volume: 1200000, earned: 4280 },
    { m: "March 2026", tx: 14, volume: 825000, earned: 2440 },
    { m: "February 2026", tx: 8, volume: 412000, earned: 1180 },
    { m: "January 2026", tx: 4, volume: 188000, earned: 540 },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lifetime earnings" value="$8,440" sub="Across 4 months" />
        <StatCard label="Avg per transaction" value="$185" sub="Trending up" positive />
        <StatCard label="Pending payout" value="$2,140" sub="Settles April 30" />
      </div>
      <Card padding="none">
        <div className="p-4" style={{ borderBottom: "1px solid var(--line)" }}><div className="text-sm font-semibold">Monthly earnings</div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>{["Month", "Transactions", "Volume", "You earned"].map((h, i) => (<th key={i} className={`px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider ${["Volume", "Transactions", "You earned"].includes(h) ? "text-right" : ""}`} style={{ color: "var(--muted)" }}>{h}</th>))}</tr></thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.m} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="px-4 py-3.5 font-medium">{m.m}</td>
                  <td className="px-4 py-3.5 text-right font-mono">{m.tx}</td>
                  <td className="px-4 py-3.5 text-right font-mono">${m.volume.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold" style={{ color: "var(--emerald)" }}>${m.earned.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <div className="flex items-start gap-3">
          <DollarSign size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
          <div className="text-sm" style={{ color: "var(--ink)" }}>
            <div className="font-semibold mb-1">Bi-weekly payouts</div>
            <p style={{ color: "var(--muted)" }}>Earnings are paid every two weeks to your registered Nigerian bank account. Next payout: <span className="font-semibold" style={{ color: "var(--ink)" }}>April 30, 2026</span> · ₦2,983,200 (~$2,140 USD).</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NewTransactionModal({ open, onClose }) {
  const [form, setForm] = useState({ customer: "", amount: "", dest: "China", rail: "Auto-route" });
  const { push } = useToast();
  const submit = (e) => { e.preventDefault(); push(`Draft created for ${form.customer}`, "success"); onClose(); setForm({ customer: "", amount: "", dest: "China", rail: "Auto-route" }); };
  return (
    <Modal open={open} onClose={onClose} title="New transaction">
      <form onSubmit={submit} className="space-y-4">
        <div><Label>Customer</Label><Input required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="Customer name" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Amount (USD)</Label><Input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="50000" /></div>
          <div><Label>Destination</Label><Select value={form.dest} onChange={(e) => setForm({ ...form, dest: e.target.value })}><option>China</option><option>USA</option><option>UAE</option><option>UK</option><option>India</option></Select></div>
        </div>
        <div><Label>Rail</Label><Select value={form.rail} onChange={(e) => setForm({ ...form, rail: e.target.value })}>
          <option>Auto-route (recommended)</option>
          {SHOW_TRIPLE_A && <>
            <option>Triple-A direct USD</option>
            <option>Cedar Money stablecoin</option>
            <option>BDC USDT settlement</option>
            <option>Internal USD inventory</option>
          </>}
        </Select></div>
        <div className="flex justify-end gap-2 pt-2"><SecondaryBtn type="button" onClick={onClose}>Cancel</SecondaryBtn><PrimaryBtn type="submit">Create draft</PrimaryBtn></div>
      </form>
    </Modal>
  );
}

function BDCOverview({ onJumpTab }) {
  const { push } = useToast();
  const [pending, setPending] = useState([
    { id: 1, customer: "Adeyemi Okafor · Lagos", supplier: "Shenzhen Electronics · CN", amount: "$47,500", flag: "Partial payment" },
    { id: 2, customer: "Novus Trading Ltd", supplier: "Horizon Metals · AE", amount: "$128,000", flag: "Fresh review" },
    { id: 3, customer: "Chioma Nwosu (SF) → Lagos Build & Supply", supplier: "Diaspora inbound · vendor", amount: "$2,500", flag: SHOW_TRIPLE_A ? "Inbound · Triple-A" : "Inbound" },
    { id: 4, customer: "Funmi Adeleke (individual)", supplier: "Mumbai Pharmachem · IN", amount: "$1,800", flag: "Payment-agent · P2" },
  ]);
  const approve = (id, customer) => { setPending((p) => p.filter((x) => x.id !== id)); push(`Approved · ${customer}`, "success"); };
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Outbound volume · 30d" value="$2.84M" change="+18.2%" positive />
          <StatCard label="Inbound · diaspora · 30d" value="$412K" change="+41% MoM" positive />
          <StatCard label="XaePay rev-share" value="$3,540" change="this month" />
        </div>
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Pending approvals</h2>
            <span className="rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "#fef3c7", color: "#92400e" }}>{pending.length} waiting</span>
          </div>
          {pending.length === 0 ? (
            <div className="rounded-xl p-8 text-center text-sm" style={{ background: "var(--bone)", color: "var(--muted)" }}>All caught up.</div>
          ) : (
            <div className="space-y-2.5">{pending.map((p) => (<PendingRow key={p.id} customer={p.customer} supplier={p.supplier} amount={p.amount} flag={p.flag} onApprove={() => approve(p.id, p.customer)} />))}</div>
          )}
          <button onClick={() => onJumpTab("transactions")} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold transition hover:gap-2" style={{ color: "var(--emerald)" }}>View all <ChevronRight size={14} /></button>
        </Card>
        <Card>
          <h2 className="mb-6 font-display text-xl font-semibold">Volume by corridor · 30d</h2>
          <div className="space-y-5">
            <CorridorBar label="NGN → USD (China)" value="$1.24M" pct={44} />
            <CorridorBar label="NGN → USD (USA)" value="$640K" pct={23} />
            <CorridorBar label="NGN → USD (UAE)" value="$480K" pct={17} />
            <CorridorBar label="NGN → USD (UK)" value="$280K" pct={10} />
            <CorridorBar label="NGN → USD (Other)" value="$200K" pct={7} />
          </div>
        </Card>
      </div>
      <div className="space-y-4 lg:col-span-4">
        <Card>
          <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><Zap size={14} /></div><span className="text-sm font-semibold">Rail status</span></div>
          <div className="space-y-2.5">
            {SHOW_TRIPLE_A ? <>
              <RailStatus name="Triple-A (Singapore)" latency="T+0" />
              <RailStatus name="Cedar Money (US/NG)" latency="T+1" />
              <RailStatus name="BDC USDT (8 LPs)" latency="Instant" />
              <RailStatus name="Internal USD inventory" latency="Instant" />
            </> : <>
              <RailStatus name={PARTNER_DISPLAY_NAME} latency="T+0–T+1" />
              <RailStatus name="Internal USD inventory" latency="Instant" />
            </>}
          </div>
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#fef3c7", color: "#92400e" }}><Bell size={14} /></div><span className="text-sm font-semibold">Compliance alerts</span></div>
          <div className="space-y-1 text-sm">
            {SHOW_TRIPLE_A && <AlertRow severity="warn" text="Q1 evidence pack for Triple-A due in 11 days" onClick={() => onJumpTab("evidence")} />}
            {SHOW_TRIPLE_A && <AlertRow severity="info" text="USDT inventory low · 3 LPs offering" onClick={() => onJumpTab("liquidity")} />}
            <AlertRow severity="info" text="CBN weekly report ready" onClick={() => onJumpTab("compliance")} />
          </div>
        </Card>
        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: "var(--lime)" }} />
          <div className="relative mb-3 flex items-center gap-2"><BarChart3 size={14} style={{ color: "var(--lime)" }} /><span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.7)" }}>Rejection rate</span></div>
          <div className="relative font-display text-5xl font-[500] tracking-tight" style={{ color: "var(--lime)" }}>0.3%</div>
          <div className="relative mt-1.5 font-mono text-[10px]" style={{ color: "rgba(247,245,240,0.5)" }}>8 of 312 · down from 6.2%</div>
        </div>
      </div>
    </div>
  );
}

function BDCLiquidity() {
  const { push } = useToast();
  const lps = [
    { id: "LP-2841", name: "K. Asante (Diaspora US)", inventory: "180,000 USDT", rate: "₦1,388", chain: "TRC-20", rating: 4.9 },
    { id: "LP-3127", name: "Atlantic Holdings LLC", inventory: "450,000 USDT", rate: "₦1,390", chain: "ERC-20", rating: 4.8 },
    { id: "LP-3290", name: "M. Osei (UK exporter)", inventory: "78,000 USDT", rate: "₦1,386", chain: "TRC-20", rating: 4.9 },
    { id: "LP-3401", name: "Pan-African Trade Co", inventory: "320,000 USDT", rate: "₦1,391", chain: "BEP-20", rating: 4.7 },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.3)" }}>
        <div className="flex items-start gap-3"><Sparkles size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--amber)" }} />
          <div className="text-sm" style={{ color: "var(--ink)" }}><span className="font-semibold">Phase 2 · USDT Liquidity Marketplace.</span><p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>Source USDT directly from vetted LPs. Cheaper than fiat off-ramp for sub-$50K. Settlement is direct between your wallet and theirs — XaePay matches and audits, never custodies.</p></div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="USDT inventory" value="240K" change="at partner banks" />
        <StatCard label="Active LPs" value="8" change="vetted, ready" positive />
        <StatCard label="Best rate (USDT/NGN)" value="₦1,386" change="LP-3290" positive />
      </div>
      <Card padding="none">
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="text-sm font-semibold">Available liquidity providers</div>
          <SecondaryBtn onClick={() => push("Sourcing matched liquidity…", "info")}><Coins size={14} /> Source USDT</SecondaryBtn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>
                {["LP ID", "Name", "Inventory", "Rate", "Chain", "Rating", ""].map((h, i) => (<th key={i} className={`px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider ${["Inventory", "Rate", "Rating"].includes(h) ? "text-right" : ""}`} style={{ color: "var(--muted)" }}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {lps.map((lp) => (
                <tr key={lp.id} className="transition hover:bg-[color:var(--bone)]" style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold">{lp.id}</td>
                  <td className="px-4 py-3.5 font-medium">{lp.name}</td>
                  <td className="px-4 py-3.5 text-right font-mono">{lp.inventory}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold" style={{ color: "var(--emerald)" }}>{lp.rate}</td>
                  <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--muted)" }}>{lp.chain}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs">★ {lp.rating}</td>
                  <td className="px-4 py-3.5"><button onClick={() => push(`Match request sent to ${lp.id}`, "success")} className="rounded-lg px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition" style={{ background: "var(--ink)", color: "var(--lime)" }}>Match</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Current best LP USDT/NGN rate — drives Triple-A's effective NGN cost basis (BDC pays Triple-A in USDT).
// In production this would come from the Liquidity tab's live LP feed.
const LP_USDT_NGN = 1388;

// Inline label/value row used by the OperatorQuoteModal's "Live calculation" panel
// + the InvoicePreviewModal payment-instructions block. Variants: muted / highlight / emerald.
function EconRow({ label, value, muted, highlight, emerald }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span style={{ color: muted ? "var(--muted)" : "var(--ink)", fontWeight: highlight ? 600 : 400 }}>{label}</span>
      <span className="font-mono font-semibold" style={{ color: emerald ? "var(--emerald)" : muted ? "var(--muted)" : "var(--ink)" }}>{value}</span>
    </div>
  );
}

// ─── OperatorQuoteModal ─────────────────────────────────────────────────────
// MVP 5-step modal: Customer & transaction → Tier → Markup → Sent → Invoice preview.
// Self-contained: manages its own form state, computes live wholesale rate, hits Supabase
// to persist the quote, calls sendWhatsAppText to push the message via Cloud API. The wa.me
// fallback fires automatically if the Cloud-API send fails.
function OperatorQuoteModal({ open, onClose, onCreated }) {
  const auth = useAuth();
  const isSignedIn = !!auth.user;
  const { push } = useToast();
  const empty = {
    customerName: "",
    customerPhone: "",
    direction: "outbound", // 'outbound' (NG → world) or 'inbound' (world → NG)
    amount: "25000",
    currency: "USD",
    country: "China",
    supplier: "",
    invoice: false,
    selectedTier: "documented",
    markupAmount: TIERS.documented.minMarkup,
  };
  const [step, setStep] = useState(1);
  const [data, setData] = useState(empty);
  const [sending, setSending] = useState(false);
  const [createdRef, setCreatedRef] = useState(""); // populated after successful send
  // Live wholesale rate from Cedar (via cedar-rate Edge Function → relay → Cedar's /v1/sendf2f/price).
  // Falls back to a sane default while loading or if Cedar is unreachable.
  const [cedarRate, setCedarRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => { setStep(1); setData(empty); setCreatedRef(""); setCedarRate(null); }, 250);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch live Cedar rate whenever the modal opens, the amount changes, or the currency changes.
  // Debounced lightly so typing doesn't fire dozens of calls.
  useEffect(() => {
    if (!open) return;
    const amt = parseFloat(data.amount) || 0;
    if (amt <= 0) return;
    const isInbound = data.direction === "inbound";
    const fromCcy = isInbound ? data.currency : "NGN";
    const toCcy = isInbound ? "NGN" : data.currency;
    const toAmount = amt;
    setRateLoading(true);
    const t = setTimeout(async () => {
      const { ok, data: payload } = await fetchCedarRate({ fromCurrencySymbol: fromCcy, toCurrencySymbol: toCcy, toAmount });
      if (ok && payload?.rate) {
        // Cedar returns rate in the perspective from→to. We always want a NGN/$ figure
        // for the operator UI: when we asked for NGN→USD, payload.rate IS NGN/$.
        // When we asked for USD→NGN (inbound), payload.rate is USD/NGN, so we invert.
        const ngnPerForeign = isInbound ? 1 / payload.rate : payload.rate;
        setCedarRate({ rate: ngnPerForeign, raw: payload, fetchedAt: Date.now() });
      }
      setRateLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [open, data.amount, data.currency, data.direction]);

  const wholesaleRate = cedarRate?.rate ?? 1394.40;

  const tier = TIERS[data.selectedTier];
  const isInbound = data.direction === "inbound";
  const customerRate = isInbound ? wholesaleRate - data.markupAmount : wholesaleRate + data.markupAmount;
  const amount = parseFloat(data.amount) || 0;
  const ngnTotal = Math.round(amount * customerRate);
  const totalMarginUSD = customerRate > 0 ? (data.markupAmount * amount) / customerRate : 0;
  const operatorEarn = totalMarginUSD * tier.operatorShare;
  const xaepayEarn = totalMarginUSD * tier.xaepayShare;
  const markupValid = data.markupAmount >= tier.minMarkup;
  const markupPctEffective = wholesaleRate > 0 ? (data.markupAmount / wholesaleRate) * 100 : 0;

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  // Build the WhatsApp message body. Encoded for wa.me; plain for Cloud API send.
  const buildMessage = (displayRef, urlToken, plain) => {
    const approvalUrl = `${window.location.origin}/?quote=${urlToken}`;
    const NL = plain ? "\n" : "%0A";
    const url = plain ? approvalUrl : encodeURIComponent(approvalUrl);
    return (
      `Hello ${data.customerName || "there"},${NL}${NL}` +
      `Trade payment quote via XaePay (ref ${displayRef}):${NL}` +
      `• Send: $${amount.toLocaleString()} ${data.currency} to ${data.supplier || data.country}${NL}` +
      `• Rate: ₦${customerRate.toFixed(2)} / $${NL}` +
      `• Total naira: ₦${ngnTotal.toLocaleString()}${NL}` +
      `• Settlement: same day${NL}${NL}` +
      `Tap to review and approve:${NL}${url}${NL}${NL}` +
      `Or reply YES ${displayRef} to confirm here.`
    );
  };

  const sendQuote = async () => {
    if (!isSignedIn) { push("Sign in first to send.", "warn"); return; }
    if (!data.customerPhone || !markupValid) return;
    setSending(true);
    const phoneDigits = data.customerPhone.replace(/[^\d]/g, "");
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000).toISOString();
    const { data: quoteRow, error } = await supabase
      .from("quotes")
      .insert({
        bdc_user_id: auth.user.id,
        bdc_name: auth.user.user_metadata?.company || "Operator",
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        amount,
        currency: data.currency,
        beneficiary: data.supplier || data.country,
        destination: data.country,
        rate: parseFloat(customerRate.toFixed(2)),
        ngn_total: ngnTotal,
        rail: "Cedar Money", // internal partner id; UI shows generic label elsewhere
        settlement_text: "T+0 · same day",
        cost_basis_ngn: wholesaleRate,
        markup_pct: parseFloat(markupPctEffective.toFixed(4)),
        status: "pending_approval",
        expires_at: expiresAt,
      })
      .select("*")
      .single();
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Insert quote failed:", error);
      push("Couldn't save quote — try again.", "warn");
      setSending(false);
      return;
    }
    const displayRef = `QU-${quoteRow.id.slice(0, 4).toUpperCase()}`;
    setCreatedRef(displayRef);
    // Try Cloud API send; fall back to opening wa.me if that fails
    const text = buildMessage(displayRef, quoteRow.id, true);
    const result = await sendWhatsAppText(phoneDigits, text);
    if (result.ok) {
      push(`Quote ${displayRef} auto-sent`, "success");
    } else {
      const message = buildMessage(displayRef, quoteRow.id, false);
      window.open(`https://wa.me/${phoneDigits}?text=${message}`, "_blank");
      push(`Quote ${displayRef} sent · WhatsApp opened`, "success");
    }
    if (onCreated) onCreated(quoteRow);
    setSending(false);
    setStep(4);
  };

  return (
    <Modal open={open} onClose={onClose} title={`New quote · Step ${Math.min(step, 4)} of 4${step === 5 ? " · preview" : ""}`} size="xl">
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold mb-2">Customer & transaction</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Enter your customer's payment details. They don't need a XaePay account — quotes go through you.</p>
          </div>
          <div>
            <Label>Direction of this transaction</Label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setData({ ...data, direction: "outbound" })} className="rounded-xl px-4 py-3 text-sm font-medium transition" style={data.direction === "outbound" ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
                <div className="font-semibold">Outbound</div>
                <div className="font-mono text-[10px] uppercase tracking-wider mt-0.5 opacity-70">Nigeria → World</div>
              </button>
              <button type="button" onClick={() => setData({ ...data, direction: "inbound" })} className="rounded-xl px-4 py-3 text-sm font-medium transition" style={data.direction === "inbound" ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", border: "1px solid var(--line)" }}>
                <div className="font-semibold">Inbound</div>
                <div className="font-mono text-[10px] uppercase tracking-wider mt-0.5 opacity-70">World → Nigeria</div>
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name"><Input value={data.customerName} onChange={(e) => setData({ ...data, customerName: e.target.value })} placeholder="Adekunle Imports Ltd" /></Field>
            <Field label="Customer WhatsApp"><Input value={data.customerPhone} onChange={(e) => setData({ ...data, customerPhone: e.target.value })} placeholder="+234 803 123 4567" /></Field>
            <Field label={`Amount (${data.currency})`}>
              <div className="focus-ring flex items-center rounded-xl transition" style={{ background: "white", border: "1px solid var(--line)" }}>
                <span className="pl-3.5 text-sm font-mono" style={{ color: "var(--muted)" }}>$</span>
                <input type="text" value={data.amount} onChange={(e) => setData({ ...data, amount: e.target.value })} className="w-full bg-transparent px-2 py-3 text-sm outline-none font-mono" />
              </div>
            </Field>
            <Field label={isInbound ? "Recipient country" : "Supplier country"}>
              <Select value={isInbound ? "Nigeria" : data.country} onChange={(e) => setData({ ...data, country: e.target.value })} disabled={isInbound}>
                {isInbound ? <option>Nigeria</option> : (<><option>China</option><option>USA</option><option>UK</option><option>Germany</option><option>UAE</option><option>India</option><option>Türkiye</option></>)}
              </Select>
            </Field>
            <Field label={isInbound ? "Recipient (Nigerian supplier/vendor)" : "Supplier name"} full>
              <Input value={data.supplier} onChange={(e) => setData({ ...data, supplier: e.target.value })} placeholder={isInbound ? "Lagos Trading Ltd" : "Shenzhen Electronics Co., Ltd"} />
            </Field>
          </div>
          <div className="flex justify-end pt-2">
            <PrimaryBtn onClick={next} disabled={!data.customerName || !data.customerPhone || !data.supplier}>Pick service tier <ArrowRight size={14} /></PrimaryBtn>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold mb-2">Pick the service tier</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Each tier has a minimum markup and an earnings split. Pick based on what your customer needs and what they'll pay for.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Object.values(TIERS).map((t) => {
              const selected = data.selectedTier === t.id;
              const isPro = t.id === "pro";
              return (
                <button key={t.id} type="button" onClick={() => setData({ ...data, selectedTier: t.id, markupAmount: Math.max(data.markupAmount, t.minMarkup) })} className="card-lift rounded-xl p-5 text-left transition" style={selected ? { background: "var(--ink)", color: "var(--bone)", border: `2px solid ${isPro ? "var(--lime)" : "var(--ink)"}` } : { background: "white", border: "1px solid var(--line)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-display text-base font-semibold">{t.name}</div>
                      <div className="font-mono text-[9px] uppercase tracking-wider mt-0.5" style={{ color: selected ? "rgba(247,245,240,0.6)" : "var(--muted)" }}>{t.tagline}</div>
                    </div>
                    {selected && <CheckCircle2 size={16} style={{ color: "var(--lime)" }} />}
                  </div>
                  <div className="font-display text-xl font-semibold" style={{ color: selected ? "var(--lime)" : "var(--ink)" }}>₦{t.minMarkup.toFixed(2)}<span className="text-xs ml-1" style={{ color: selected ? "rgba(247,245,240,0.6)" : "var(--muted)" }}>/$ minimum</span></div>
                  <div className="mt-3 font-mono text-[10px]" style={{ color: selected ? "rgba(247,245,240,0.5)" : "var(--muted)" }}>You: {(t.operatorShare * 100).toFixed(0)}% · XaePay: {(t.xaepayShare * 100).toFixed(0)}%</div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between pt-2">
            <SecondaryBtn onClick={back}>Back</SecondaryBtn>
            <PrimaryBtn onClick={next}>Set your markup <ArrowRight size={14} /></PrimaryBtn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold mb-2">Set your markup</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>You picked <span className="font-semibold" style={{ color: "var(--ink)" }}>{tier.name}</span> · minimum ₦{tier.minMarkup.toFixed(2)}/$. {isInbound ? "Inbound: your spread is subtracted from the wholesale rate (recipient gets fewer naira per dollar)." : "Set your markup at or above the minimum."}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <div className="space-y-4">
                <Field label="Your markup (₦ per $)">
                  <div className="focus-ring flex items-center rounded-xl transition" style={{ background: "white", border: markupValid ? "1px solid var(--line)" : "1px solid var(--amber)" }}>
                    <span className="pl-3.5 text-sm font-mono" style={{ color: "var(--muted)" }}>₦</span>
                    <input type="number" step="0.10" value={data.markupAmount} onChange={(e) => setData({ ...data, markupAmount: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent px-2 py-3 text-sm outline-none font-mono" />
                    <span className="pr-3.5 text-sm font-mono" style={{ color: "var(--muted)" }}>/ $</span>
                  </div>
                  {!markupValid && <div className="mt-2 text-xs" style={{ color: "var(--amber)" }}>Below {tier.name} minimum of ₦{tier.minMarkup.toFixed(2)}/$</div>}
                </Field>
                <div className="flex flex-wrap gap-2">
                  {[tier.minMarkup, tier.minMarkup + 1, tier.minMarkup + 2, tier.minMarkup + 3].map((v) => (
                    <button key={v} onClick={() => setData({ ...data, markupAmount: v })} className="rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition" style={Math.abs(data.markupAmount - v) < 0.01 ? { background: "var(--ink)", color: "var(--bone)" } : { background: "var(--bone)", color: "var(--ink)", border: "1px solid var(--line)" }}>₦{v.toFixed(2)}</button>
                  ))}
                </div>
              </div>
            </Card>
            <Card>
              <div className="font-mono text-[10px] uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--muted)" }}>
                <span>Live calculation · {isInbound ? "Inbound" : "Outbound"}</span>
                {rateLoading
                  ? <span className="font-normal" style={{ color: "var(--amber)" }}>· fetching Cedar rate…</span>
                  : cedarRate
                    ? <span className="font-normal flex items-center gap-1" style={{ color: "var(--emerald)" }}><div className="h-1 w-1 rounded-full pulse-dot" style={{ background: "var(--emerald)" }} />live from Cedar</span>
                    : <span className="font-normal" style={{ color: "var(--muted)" }}>· using fallback rate</span>}
              </div>
              <div className="space-y-2.5">
                <EconRow label="Wholesale rate" value={`₦${wholesaleRate.toFixed(2)}/$`} muted />
                <EconRow label={isInbound ? "Your spread (subtracted)" : "Your markup (added)"} value={`${isInbound ? "−" : "+"}₦${data.markupAmount.toFixed(2)}/$`} highlight />
                <EconRow label={isInbound ? "Recipient receives at" : "Customer all-in rate"} value={`₦${customerRate.toFixed(2)}/$`} />
                <div className="h-px my-2" style={{ background: "var(--line)" }} />
                <EconRow label={`Amount: $${amount.toLocaleString()}`} value={`${isInbound ? "Recipient gets " : ""}₦${ngnTotal.toLocaleString()}`} />
                <EconRow label="Total margin captured" value={`$${totalMarginUSD.toFixed(2)}`} />
                <div className="h-px my-2" style={{ background: "var(--line)" }} />
                <EconRow label={`You earn (${(tier.operatorShare * 100).toFixed(0)}%)`} value={`$${operatorEarn.toFixed(2)}`} emerald />
                <EconRow label={`XaePay (${(tier.xaepayShare * 100).toFixed(0)}%)`} value={`$${xaepayEarn.toFixed(2)}`} muted />
              </div>
            </Card>
          </div>
          <div className="flex justify-between pt-2">
            <SecondaryBtn onClick={back}>Back</SecondaryBtn>
            <PrimaryBtn onClick={sendQuote} disabled={!markupValid || sending || !data.customerPhone}>
              {sending ? <><Loader2 size={14} className="spin" /> Sending…</> : <>Send quote to customer <Send size={14} /></>}
            </PrimaryBtn>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-5" style={{ background: "var(--lime)" }}>
            <Send size={28} strokeWidth={2.5} style={{ color: "var(--ink)" }} />
          </div>
          <h3 className="font-display text-2xl font-semibold mb-3">Quote sent to customer</h3>
          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "var(--muted)" }}>
            Locked rate <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>₦{customerRate.toFixed(2)}/$</span> sent to {data.customerName || "your customer"} on WhatsApp. Reference <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>{createdRef}</span>. They have 4 minutes to confirm.
          </p>
          <div className="rounded-xl p-5 max-w-md mx-auto mb-6 text-left" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
            <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>If customer confirms</div>
            <ul className="space-y-1.5 text-sm">
              <li>1. Invoice + payment instructions PDF auto-generated</li>
              <li>2. Funding instructions (bank, account, reference) sent</li>
              <li>3. Customer NGN deposit triggers settlement</li>
              <li>4. Beneficiary receives funds same day</li>
              <li>5. Documentation delivered via WhatsApp + email</li>
              <li>6. You earn ${operatorEarn.toFixed(2)}</li>
            </ul>
          </div>
          <div className="flex gap-2 justify-center">
            <SecondaryBtn onClick={onClose}>Done</SecondaryBtn>
            <PrimaryBtn onClick={() => setStep(5)}>Preview confirmation flow <ArrowRight size={14} /></PrimaryBtn>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={18} style={{ color: "var(--emerald)" }} strokeWidth={2.5} />
              <h3 className="font-display text-lg font-semibold">Customer confirmed · Invoice generated</h3>
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>This is what XaePay automatically generates and delivers when your customer confirms a quote. Delivered via WhatsApp + email.</p>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: "var(--emerald)" }} />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">Invoice + payment instructions PDF</span>
              </div>
              <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>Auto-generated · preview</span>
            </div>
            <div className="p-6 bg-white">
              <div className="flex items-start justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--line)" }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: "linear-gradient(135deg, var(--emerald), var(--emerald-deep))" }}>
                      <span className="font-display text-xs font-semibold" style={{ color: "var(--lime)" }}>X</span>
                    </div>
                    <span className="font-display text-sm font-semibold">XaePay</span>
                  </div>
                  <div className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>Issued by {auth.user?.user_metadata?.company || "Operator"}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>Reference</div>
                  <div className="font-mono text-sm font-semibold">{createdRef || "QU-XXXX"}</div>
                  <div className="font-mono text-[9px] mt-1" style={{ color: "var(--muted)" }}>{new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} WAT</div>
                </div>
              </div>
              <div className="mb-5">
                <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Bill to</div>
                <div className="text-sm font-semibold">{data.customerName || "(customer name)"}</div>
                <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{data.customerPhone || "(customer WhatsApp)"}</div>
              </div>
              <div className="mb-5 grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>{isInbound ? "Recipient" : "Beneficiary (supplier)"}</div>
                  <div className="text-sm font-semibold">{data.supplier || "(beneficiary)"}</div>
                  <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{isInbound ? "Nigeria" : data.country}</div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Service tier</div>
                  <div className="text-sm font-semibold">{tier.name}</div>
                  <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{tier.tagline}</div>
                </div>
              </div>
              <div className="rounded-lg p-4 mb-5" style={{ background: "var(--bone)" }}>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Amount ({isInbound ? "incoming" : "outgoing"})</span><span className="font-mono">${amount.toLocaleString()} {data.currency}</span></div>
                  <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Locked rate</span><span className="font-mono">₦{customerRate.toFixed(2)}/$</span></div>
                  <div className="flex justify-between pt-2 mt-2 font-semibold" style={{ borderTop: "1px solid var(--line)" }}>
                    <span>{isInbound ? "Recipient receives" : "Total NGN to fund"}</span>
                    <span className="font-mono">₦{ngnTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {!isInbound && (
                <div className="rounded-lg p-4 mb-5" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
                  <div className="font-mono text-[9px] uppercase tracking-wider mb-2" style={{ color: "var(--emerald)" }}>Payment instructions — fund this transaction</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Bank</span><span>(operator collection bank)</span></div>
                    <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Account name</span><span>{auth.user?.user_metadata?.company || "Operator"} Collections</span></div>
                    <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Account number</span><span className="font-mono">(operator-provided)</span></div>
                    <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Reference (must include)</span><span className="font-mono font-semibold" style={{ color: "var(--emerald)" }}>{createdRef || "QU-XXXX"}</span></div>
                    <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Amount</span><span className="font-mono font-semibold">₦{ngnTotal.toLocaleString()}</span></div>
                    <div className="flex justify-between pt-2 mt-2" style={{ borderTop: "1px dashed var(--line)" }}><span style={{ color: "var(--muted)" }}>Quote validity</span><span className="font-mono" style={{ color: "var(--amber)" }}>4 minutes</span></div>
                  </div>
                </div>
              )}
              <div className="text-[9px] leading-relaxed" style={{ color: "var(--muted)" }}>Payment execution by licensed payment partner. XaePay is a software and compliance documentation platform. This invoice is generated upon quote confirmation and represents the locked terms of the transaction. Reference number must be included in the wire transfer for proper allocation.</div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <SecondaryBtn full onClick={() => push("PDF generation lands with backend pass", "info")}><Download size={14} /> Download PDF</SecondaryBtn>
            <SecondaryBtn full onClick={() => push("WhatsApp delivery lands with backend pass", "info")}><MessageCircle size={14} /> Send via WhatsApp</SecondaryBtn>
            <SecondaryBtn full onClick={() => push("Email delivery lands with backend pass", "info")}><Send size={14} /> Email customer</SecondaryBtn>
          </div>
          <div className="flex justify-end pt-2"><PrimaryBtn onClick={onClose}>Done</PrimaryBtn></div>
        </div>
      )}
    </Modal>
  );
}

function BDCRailQuotes() {
  const { push } = useToast();
  const auth = useAuth();
  const isSignedIn = !!auth.user;
  const [direction, setDirection] = useState("off-ramp"); // off-ramp = NGN customer → foreign supplier (outbound); on-ramp = foreign sender → NGN beneficiary (diaspora inbound)
  const [amount, setAmount] = useState("50000");
  const [destinationCcy, setDestinationCcy] = useState("USD");
  const [destinationCorridor, setDestinationCorridor] = useState("China");
  const [urgency, setUrgency] = useState("standard");
  const [markupPct, setMarkupPct] = useState("1.80"); // legacy, kept for back-compat with existing DB rows
  const [tick, setTick] = useState(0);
  // Funding method controls which rail(s) appear. Triple-A requires USDT inventory;
  // Cedar runs on NGN fiat. "compare" shows both side-by-side so the BDC can decide.
  const [fundingMethod, setFundingMethod] = useState("ngn-fiat"); // 'ngn-fiat' | 'usdt' | 'compare'

  // Per-transaction tier + markup. Operator picks Standard/Verified/Documented/Pro and a markup
  // in ₦/$ at or above the tier's minimum. Earnings split per tier.operatorShare / tier.xaepayShare.
  const [selectedTier, setSelectedTier] = useState("documented");
  const [markupAmount, setMarkupAmount] = useState(TIERS.documented.minMarkup);
  const tier = TIERS[selectedTier];
  const markupValid = markupAmount >= tier.minMarkup;

  // Invoice preview — shows the operator what the customer will receive when they confirm
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  // The new MVP-style 5-step quote modal. Replaces the inline form for quote creation.
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  // Sidebar FX calculator — operator types an amount + currency, sees the live Cedar
  // wholesale rate and total NGN it would cost. Mirrors Cedar's own FX calculator UX.
  const [fxAmount, setFxAmount] = useState("25000");
  const [fxCurrency, setFxCurrency] = useState("USD");
  const [liveCedarRate, setLiveCedarRate] = useState(null);
  const [fxLoading, setFxLoading] = useState(false);
  useEffect(() => {
    const amt = parseFloat(fxAmount) || 0;
    if (amt <= 0) { setLiveCedarRate(null); return; }
    let cancelled = false;
    setFxLoading(true);
    const t = setTimeout(async () => {
      const { ok, data } = await fetchCedarRate({ fromCurrencySymbol: "NGN", toCurrencySymbol: fxCurrency, toAmount: amt });
      if (!cancelled) {
        if (ok && data?.rate) setLiveCedarRate({ rate: data.rate, depositNgn: data.amount, fetchedAt: Date.now() });
        setFxLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [fxAmount, fxCurrency]);
  // Background refresh every 60s
  useEffect(() => {
    const i = setInterval(() => setFxAmount((a) => a), 60000); // touch to retrigger fetch
    return () => clearInterval(i);
  }, []);

  // Customer form (resets after every Send, so BDC can compose more quotes back-to-back)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [chosenRail, setChosenRail] = useState(null);
  const [sendingQuote, setSendingQuote] = useState(false);

  // Pending quotes list — fetched from DB; supports many concurrent quotes per BDC
  const [pendingQuotes, setPendingQuotes] = useState([]);

  // Orders shown at the bottom of the Rail Quotes tab. Signed-in users see real submitted quotes
  // from the DB; unsigned visitors see two demo rows so the section isn't empty.
  const DEMO_ORDERS = [
    { id: "ORD-2218", rail: SHOW_TRIPLE_A ? "Cedar Money" : PARTNER_DISPLAY_NAME, customer: "Sahara Foods Import", amount: 32000, customerRate: 1421.40, ts: "12 min ago", status: "filled" },
    { id: "ORD-2217", rail: SHOW_TRIPLE_A ? "Triple-A" : PARTNER_DISPLAY_NAME, customer: "Novus Trading Ltd", amount: 128000, customerRate: 1422.10, ts: "47 min ago", status: "settling" },
  ];
  const [orders, setOrders] = useState(isSignedIn ? [] : DEMO_ORDERS);

  const fetchOrders = async () => {
    if (!isSignedIn) return;
    const { data, error } = await supabase
      .from("quotes")
      .select("id, customer_name, amount, rate, rail, status, submitted_at, created_at")
      .in("status", ["submitted_to_rail", "filled"])
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .limit(8);
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Fetch orders failed:", error);
      return;
    }
    setOrders((data || []).map((q) => ({
      id: `ORD-${q.id.slice(0, 4).toUpperCase()}`,
      dbId: q.id,
      rail: q.rail,
      customer: q.customer_name || "Unnamed",
      amount: parseFloat(q.amount),
      customerRate: parseFloat(q.rate),
      ts: relativeTime(q.submitted_at || q.created_at),
      status: q.status === "filled" ? "filled" : "submitted",
    })));
  };

  useEffect(() => { fetchOrders(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [auth.user?.id]);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(i);
  }, []);

  const wobble = (base, ampBps) => base + (Math.sin(tick * 0.7) + Math.cos(tick * 0.3)) * 0.5 * (base * ampBps / 10000);

  // ── Cedar Money — NGN-native quotes (both directions). ─────────────────
  const cedarMid = wobble(1394.40, 4);
  const cedarFeeBps = urgency === "priority" ? 18 : 12;
  const cedarAllInNGN = cedarMid * (1 + cedarFeeBps / 10000);
  const cedar = {
    name: "Cedar Money",
    displayName: SHOW_TRIPLE_A ? "Cedar Money" : PARTNER_DISPLAY_NAME,
    sublabel: direction === "off-ramp" ? "NGN-native · off-ramp (NG → abroad)" : "NGN-native · on-ramp (abroad → NG)",
    quoteCurrency: "NGN",
    rateLine: `₦${cedarMid.toFixed(2)} / $`,
    feeBps: cedarFeeBps,
    feeLine: `${cedarFeeBps} bps · ${(cedarFeeBps / 100).toFixed(2)}%`,
    settlement: urgency === "priority" ? "T+0 · 25 min" : "T+0 · 90 min",
    network: direction === "off-ramp" ? "BDC funds Cedar in NGN → wire/payout abroad" : "Foreign sender → Cedar → BDC NGN account",
    minTicket: 1000,
    nativeCostNGN: cedarAllInNGN,
    headlineLabel: "All-in NGN cost / $",
    headlinePrimary: `₦${cedarAllInNGN.toFixed(2)}`,
    headlineSecondary: null,
    note: "Cedar quotes natively in naira because they operate locally in Nigeria.",
  };

  // ── Triple-A — USDT-based (off-ramp Singapore) or USD-based (on-ramp via US arm). ──
  const tripleAFeeBps = urgency === "priority" ? 28 : 22;
  let tripleA;
  if (direction === "off-ramp") {
    // Off-ramp: BDC sends USDT (TRC-20) to Triple-A Singapore; Triple-A pays beneficiary in foreign fiat.
    const usdtPerUsd = 1 + tripleAFeeBps / 10000;
    const ngnPerUsd = usdtPerUsd * LP_USDT_NGN; // BDC has to source the USDT at current LP rate
    tripleA = {
      name: "Triple-A",
      displayName: "Triple-A",
      sublabel: "Singapore (MAS) · off-ramp · settles in foreign fiat",
      quoteCurrency: "USDT",
      rateLine: `${usdtPerUsd.toFixed(4)} USDT / $`,
      feeBps: tripleAFeeBps,
      feeLine: `${tripleAFeeBps} bps · ${(tripleAFeeBps / 100).toFixed(2)}%`,
      settlement: urgency === "priority" ? "T+0 · 90 min" : "T+0 · 4 hrs",
      network: "BDC sends USDT TRC-20 → Triple-A wires foreign fiat (SWIFT MT103)",
      minTicket: 5000,
      nativeCostNGN: ngnPerUsd,
      headlineLabel: "BDC pays in USDT / $",
      headlinePrimary: `${usdtPerUsd.toFixed(4)} USDT`,
      headlineSecondary: `≈ ₦${ngnPerUsd.toFixed(2)} at LP rate ₦${LP_USDT_NGN}/USDT`,
      note: `BDC pays Triple-A in USDT (TRC-20). The naira figure uses your current best LP USDT rate (₦${LP_USDT_NGN.toLocaleString()}/USDT).`,
    };
  } else {
    // On-ramp via Triple-A US arm: foreign sender → Triple-A US → BDC's USD partner bank → BDC settles NGN to beneficiary.
    const ngnPerUsd = wobble(1395.40, 5) * (1 + tripleAFeeBps / 10000); // Triple-A US returns USD; BDC handles NGN side at BDC's own internal rate
    tripleA = {
      name: "Triple-A (US)",
      displayName: "Triple-A (US)",
      sublabel: "US arm · on-ramp · receives foreign fiat",
      quoteCurrency: "USD",
      rateLine: `${(tripleAFeeBps / 100).toFixed(2)}% on USD received`,
      feeBps: tripleAFeeBps,
      feeLine: `${tripleAFeeBps} bps · ${(tripleAFeeBps / 100).toFixed(2)}%`,
      settlement: urgency === "priority" ? "T+0 · 2 hrs" : "T+1 · same business day",
      network: "Foreign sender → Triple-A US → BDC's USD partner bank → BDC settles NGN locally",
      minTicket: 2000,
      nativeCostNGN: ngnPerUsd,
      headlineLabel: "Triple-A US fee on USD received",
      headlinePrimary: `${(tripleAFeeBps / 100).toFixed(2)}%`,
      headlineSecondary: `≈ ₦${ngnPerUsd.toFixed(2)} effective at your NGN payout rate`,
      note: "Triple-A US handles overseas-individual/business inbound. BDC's banking partner receives USD; BDC then pays NGN beneficiary.",
    };
  }

  // On off-ramp the BDC picks the rail based on what they're funding with (NGN fiat vs USDT).
  // On on-ramp the foreign sender funds the rail, so funding method doesn't apply — show both.
  // When SHOW_TRIPLE_A is false, the dashboard collapses to a single rail (Cedar) regardless of direction.
  const railsByFunding = !SHOW_TRIPLE_A
    ? [cedar]
    : direction === "off-ramp"
      ? (fundingMethod === "ngn-fiat" ? [cedar]
        : fundingMethod === "usdt" ? [tripleA]
        : [tripleA, cedar])
      : [tripleA, cedar];
  const eligibleRails = railsByFunding.filter((r) => parseFloat(amount) >= r.minTicket);
  const cheapest = eligibleRails.length > 0 ? eligibleRails.reduce((a, b) => (a.nativeCostNGN < b.nativeCostNGN ? a : b)) : null;
  // Customer rate inverts by direction:
  //   off-ramp (outbound, NG → World): customer buys foreign currency → rate = wholesale + markup
  //   on-ramp  (inbound,  World → NG): customer/sender buys NGN        → rate = wholesale − markup
  // Total margin (NGN) = markupAmount * amount in both cases — converted to USD via customerRate.
  const isInbound = direction === "on-ramp";
  const customerRate = cheapest ? (isInbound ? cheapest.nativeCostNGN - markupAmount : cheapest.nativeCostNGN + markupAmount) : 0;
  const grossMarginPerUSD = markupAmount;
  const grossMarginTotal = grossMarginPerUSD * parseFloat(amount || 0);
  const ngnTotal = customerRate * parseFloat(amount || 0);
  const totalMarginUSD = customerRate > 0 ? (markupAmount * parseFloat(amount || 0)) / customerRate : 0;
  const operatorEarnUSD = totalMarginUSD * tier.operatorShare;
  const xaepayEarnUSD = totalMarginUSD * tier.xaepayShare;
  // Equivalent percentage form (for legacy markup_pct DB column and back-compat surfaces)
  const markupPctEffective = cheapest && cheapest.nativeCostNGN > 0 ? (markupAmount / cheapest.nativeCostNGN) * 100 : 0;

  // Default chosenRail to cheapest when it changes
  useEffect(() => {
    if (cheapest && !chosenRail) setChosenRail(cheapest.name);
  }, [cheapest, chosenRail]);

  // Drop the chosen rail when the funding-method filter or direction switches —
  // the previously chosen rail may no longer be on the visible set.
  useEffect(() => { setChosenRail(null); }, [fundingMethod, direction]);

  // When the operator picks a different tier, snap markup up to the tier's minimum if it's below.
  useEffect(() => {
    setMarkupAmount((m) => Math.max(m, TIERS[selectedTier].minMarkup));
  }, [selectedTier]);

  // Build the WhatsApp message body for a given quote — used both for new sends and re-sends from the pending list
  const buildQuoteMessage = (q, displayRef, urlToken) => {
    const approvalUrl = `${window.location.origin}/?quote=${urlToken}`;
    return (
      `Hello ${q.customer_name || "there"},%0A%0A` +
      `Trade payment quote via XaePay (ref ${displayRef}):%0A` +
      `• Send: $${parseFloat(q.amount).toLocaleString()} ${q.currency || "USD"} to ${q.beneficiary || q.destination || "destination"}%0A` +
      `• Rate: ₦${parseFloat(q.rate).toFixed(2)} / $%0A` +
      `• Total naira: ₦${Math.round(q.ngn_total || 0).toLocaleString()}%0A` +
      `• Settlement: ${q.settlement_text || "—"}%0A%0A` +
      `Tap to review and approve:%0A${encodeURIComponent(approvalUrl)}%0A%0A` +
      `Or reply YES ${displayRef} to confirm here.`
    );
  };

  // Plain-text version of the same message — used by the Cloud API send (real \n, real URL).
  const buildQuoteMessagePlain = (q, displayRef, urlToken) => {
    const approvalUrl = `${window.location.origin}/?quote=${urlToken}`;
    return (
      `Hello ${q.customer_name || "there"},\n\n` +
      `Trade payment quote via XaePay (ref ${displayRef}):\n` +
      `• Send: $${parseFloat(q.amount).toLocaleString()} ${q.currency || "USD"} to ${q.beneficiary || q.destination || "destination"}\n` +
      `• Rate: ₦${parseFloat(q.rate).toFixed(2)} / $\n` +
      `• Total naira: ₦${Math.round(q.ngn_total || 0).toLocaleString()}\n` +
      `• Settlement: ${q.settlement_text || "—"}\n\n` +
      `Tap to review and approve:\n${approvalUrl}\n\n` +
      `Or reply YES ${displayRef} to confirm here.`
    );
  };

  const sendQuoteOnWhatsApp = async () => {
    if (!customerPhone || sendingQuote) { if (!customerPhone) push("Enter a customer WhatsApp number first.", "warn"); return; }
    if (!cheapest) { push("Pick valid amount/urgency first — no eligible rail.", "warn"); return; }
    setSendingQuote(true);
    const phoneDigits = customerPhone.replace(/[^\d]/g, "");
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000).toISOString();
    const railName = chosenRail || cheapest.name;
    const settlement = cheapest.settlement;

    let urlToken;
    let displayRef;

    if (isSignedIn) {
      const { data, error } = await supabase
        .from("quotes")
        .insert({
          bdc_user_id: auth.user.id,
          bdc_name: auth.user.user_metadata?.company || "Corporate Exchange BDC",
          customer_name: customerName,
          customer_phone: customerPhone,
          amount: parseFloat(amount),
          currency: destinationCcy,
          beneficiary: beneficiary || destinationCorridor,
          destination: destinationCorridor,
          rate: parseFloat(customerRate.toFixed(2)),
          ngn_total: Math.round(ngnTotal),
          rail: railName,
          settlement_text: settlement,
          cost_basis_ngn: cheapest.nativeCostNGN,
          // markup_pct kept for back-compat — derived from the operator's new ₦/$ markup
          // and the rail's NGN cost basis. tier and markup_amount aren't persisted yet
          // (pending DB migration); they live only in UI state until then.
          markup_pct: parseFloat(markupPctEffective.toFixed(4)),
          status: "pending_approval",
          expires_at: expiresAt,
        })
        .select("*")
        .single();
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Insert quote failed:", error);
        push("Couldn't save quote — try again.", "warn");
        setSendingQuote(false);
        return;
      }
      urlToken = data.id;
      displayRef = `QU-${data.id.slice(0, 4).toUpperCase()}`;
      // Optimistic insert: prepend to the pending list immediately
      setPendingQuotes((prev) => [{ ...data, displayRef }, ...prev]);
    } else {
      displayRef = `QU-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      urlToken = encodeQuoteToken({
        id: displayRef,
        customer: customerName,
        amount: parseFloat(amount),
        currency: destinationCcy,
        rate: parseFloat(customerRate.toFixed(2)),
        ngnTotal: Math.round(ngnTotal),
        rail: railName,
        settlement,
        beneficiary: beneficiary || destinationCorridor,
        bdcName: "Corporate Exchange BDC",
        expiresAt,
      });
    }

    const message = buildQuoteMessage({
      customer_name: customerName, amount, currency: destinationCcy,
      beneficiary, destination: destinationCorridor, rate: customerRate,
      ngn_total: ngnTotal, settlement_text: settlement,
    }, displayRef, urlToken);
    window.open(`https://wa.me/${phoneDigits}?text=${message}`, "_blank");
    push(`Quote ${displayRef} sent to ${customerName || phoneDigits}`, "success");

    // Reset form so BDC can compose another quote immediately
    setCustomerName(""); setCustomerPhone(""); setBeneficiary("");
    setSendingQuote(false);
  };

  // Auto-send variant: same DB insert as sendQuoteOnWhatsApp, but pushes the message via Cloud API
  // instead of opening wa.me. Beta — only fires when BDC clicks the dedicated button.
  const sendQuoteAuto = async () => {
    if (!isSignedIn) { push("Sign in first to use auto-send.", "warn"); return; }
    if (!customerPhone || sendingQuote) { if (!customerPhone) push("Enter a customer WhatsApp number first.", "warn"); return; }
    if (!cheapest) { push("Pick valid amount/urgency first — no eligible rail.", "warn"); return; }
    setSendingQuote(true);
    const phoneDigits = customerPhone.replace(/[^\d]/g, "");
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000).toISOString();
    const railName = chosenRail || cheapest.name;
    const settlement = cheapest.settlement;

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        bdc_user_id: auth.user.id,
        bdc_name: auth.user.user_metadata?.company || "Corporate Exchange BDC",
        customer_name: customerName,
        customer_phone: customerPhone,
        amount: parseFloat(amount),
        currency: destinationCcy,
        beneficiary: beneficiary || destinationCorridor,
        destination: destinationCorridor,
        rate: parseFloat(customerRate.toFixed(2)),
        ngn_total: Math.round(ngnTotal),
        rail: railName,
        settlement_text: settlement,
        cost_basis_ngn: cheapest.nativeCostNGN,
        markup_pct: parseFloat(markupPct || 0),
        status: "pending_approval",
        expires_at: expiresAt,
      })
      .select("*")
      .single();
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Insert quote failed:", error);
      push("Couldn't save quote — try again.", "warn");
      setSendingQuote(false);
      return;
    }
    const displayRef = `QU-${data.id.slice(0, 4).toUpperCase()}`;
    setPendingQuotes((prev) => [{ ...data, displayRef }, ...prev]);

    const text = buildQuoteMessagePlain({
      customer_name: customerName, amount, currency: destinationCcy,
      beneficiary, destination: destinationCorridor, rate: customerRate,
      ngn_total: ngnTotal, settlement_text: settlement,
    }, displayRef, data.id);

    const result = await sendWhatsAppText(phoneDigits, text);
    if (result.ok) {
      push(`Auto-sent ${displayRef} to ${customerName || phoneDigits}`, "success");
      setCustomerName(""); setCustomerPhone(""); setBeneficiary("");
    } else {
      // eslint-disable-next-line no-console
      console.error("Auto-send failed:", result);
      push(`Auto-send failed (${result.status}) — quote saved, use manual Resend.`, "warn");
    }
    setSendingQuote(false);
  };

  // Fetch all in-flight quotes for this BDC (pending / approved / declined). Replaces the per-row polling
  // we had with a single list-fetch every 5s.
  const [refreshingPending, setRefreshingPending] = useState(false);
  const fetchPendingQuotes = async ({ manual = false } = {}) => {
    if (!isSignedIn) return;
    if (manual) setRefreshingPending(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .in("status", ["pending_approval", "customer_approved", "customer_declined"])
      .order("created_at", { ascending: false })
      .limit(20);
    if (manual) setRefreshingPending(false);
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Fetch pending quotes failed:", error);
      if (manual) push("Couldn't refresh — check connection.", "warn");
      return;
    }
    setPendingQuotes((data || []).map((q) => ({ ...q, displayRef: `QU-${q.id.slice(0, 4).toUpperCase()}` })));
    if (manual) push(`Refreshed · ${(data || []).length} in flight`, "success");
  };

  useEffect(() => { fetchPendingQuotes(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [auth.user?.id]);

  // Continuous polling — keeps the pending list and statuses fresh
  useEffect(() => {
    if (!isSignedIn) return;
    const interval = setInterval(fetchPendingQuotes, 5000);
    return () => clearInterval(interval);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [isSignedIn]);

  const submitPendingOrder = async (q) => {
    const railToUse = q.rail || cheapest?.name;
    if (!railToUse) { push("No rail set on this quote.", "warn"); return; }
    const { error } = await supabase
      .from("quotes")
      .update({ status: "submitted_to_rail", rail: railToUse, submitted_at: new Date().toISOString() })
      .eq("id", q.id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Submit failed:", error);
      push("Couldn't submit — try again.", "warn");
      return;
    }
    push(`Order ${q.displayRef} submitted to ${SHOW_TRIPLE_A ? railToUse : "partner"}`, "success");
    fetchPendingQuotes();
    fetchOrders();
  };

  const cancelPendingQuote = async (q) => {
    if (!window.confirm(`Cancel quote ${q.displayRef}?`)) return;
    const { error } = await supabase.from("quotes").update({ status: "cancelled" }).eq("id", q.id);
    if (error) { push("Couldn't cancel.", "warn"); return; }
    push(`Quote ${q.displayRef} cancelled`, "info");
    fetchPendingQuotes();
  };

  const resendPendingQuote = (q) => {
    const phoneDigits = (q.customer_phone || "").replace(/[^\d]/g, "");
    if (!phoneDigits) { push("No phone on this quote.", "warn"); return; }
    const message = buildQuoteMessage(q, q.displayRef, q.id);
    window.open(`https://wa.me/${phoneDigits}?text=${message}`, "_blank");
    push(`Re-opened WhatsApp for ${q.displayRef}`, "info");
  };

  const resendPendingQuoteAuto = async (q) => {
    const phoneDigits = (q.customer_phone || "").replace(/[^\d]/g, "");
    if (!phoneDigits) { push("No phone on this quote.", "warn"); return; }
    const text = buildQuoteMessagePlain(q, q.displayRef, q.id);
    const result = await sendWhatsAppText(phoneDigits, text);
    if (result.ok) {
      push(`Auto-resent ${q.displayRef}`, "success");
    } else {
      // eslint-disable-next-line no-console
      console.error("Auto-resend failed:", result);
      push(`Auto-resend failed (${result.status}) — try manual Resend.`, "warn");
    }
  };

  return (
    <div className="space-y-5">
      {/* MVP intro panel — quote tool landing. Quote creation happens in the modal below. */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="This month earnings" value="$4,280" change="+$1,840 vs last month" positive />
            <StatCard label="Active transactions" value={String(pendingQuotes.length)} sub={pendingQuotes.length === 0 ? "None in flight" : `${pendingQuotes.length} in flight`} />
            <StatCard label="Volume routed · 30d" value="$1.2M" change="+38% vs prior" positive />
          </div>
          <Card>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-display text-xl font-semibold">Start a new quote</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Customer messages you, you quote them in 2 minutes.</p>
              </div>
              <button onClick={() => setQuoteModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition" style={{ background: "var(--ink)", color: "var(--bone)" }}>
                <Plus size={14} /> New quote
              </button>
            </div>
            <div className="rounded-xl p-5" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
              <div className="flex items-start gap-3">
                <MessageCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
                <div>
                  <div className="text-sm font-semibold mb-1">WhatsApp shortcut</div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>Forward customer requests directly to <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>{WHATSAPP_NUMBER_NG.replace(/(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3').replace(/^234/, '+234 ')}</span> with the customer's invoice and amount. We'll reply with quotes for all five tiers — you pick which one to send back.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Tier minimums today</div>
            <div className="space-y-3">
              {Object.values(TIERS).map((t) => (
                <div key={t.id} className="flex items-baseline justify-between">
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{t.tagline}</div>
                  </div>
                  <div className="font-mono text-lg font-semibold">₦{t.minMarkup.toFixed(2)}<span className="text-xs" style={{ color: "var(--muted)" }}>/$</span></div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-wider mb-3 flex items-center justify-between" style={{ color: "var(--muted)" }}>
              <span>FX rate calculator</span>
              {fxLoading
                ? <span style={{ color: "var(--amber)" }}>fetching…</span>
                : liveCedarRate
                  ? <span className="flex items-center gap-1" style={{ color: "var(--emerald)" }}><div className="h-1 w-1 rounded-full pulse-dot" style={{ background: "var(--emerald)" }} />live</span>
                  : null}
            </div>
            {/* Amount + currency inputs — same shape as Cedar's calculator */}
            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr auto" }}>
              <div className="focus-ring flex items-center rounded-xl transition" style={{ background: "white", border: "1px solid var(--line)" }}>
                <span className="pl-3 text-xs font-mono" style={{ color: "var(--muted)" }}>$</span>
                <input type="number" inputMode="decimal" step="500" value={fxAmount} onChange={(e) => setFxAmount(e.target.value)} className="w-full bg-transparent px-2 py-2 text-sm outline-none font-mono" placeholder="25000" />
              </div>
              <Select value={fxCurrency} onChange={(e) => setFxCurrency(e.target.value)}>
                <option>USD</option><option>GBP</option><option>EUR</option><option>CNY</option>
              </Select>
            </div>
            <div className="mt-3 font-display text-3xl font-[500] tracking-tight">
              ₦{(liveCedarRate?.rate ?? 1395).toFixed(2)}
              <span className="text-base ml-1" style={{ color: "var(--muted)" }}>/{fxCurrency}</span>
            </div>
            {liveCedarRate?.depositNgn && (
              <div className="mt-1 text-xs" style={{ color: "var(--ink)" }}>
                ≈ <span className="font-mono font-semibold">₦{Math.round(parseFloat(liveCedarRate.depositNgn)).toLocaleString()}</span>{" "}
                <span style={{ color: "var(--muted)" }}>to deposit for ${parseFloat(fxAmount || 0).toLocaleString()} {fxCurrency} payout</span>
              </div>
            )}
            <div className="mt-2 text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--muted)" }}>{liveCedarRate ? "Live from licensed partner · auto-refreshes" : "Connecting…"}</div>
          </Card>
        </div>
      </div>

      {/* Pending quotes — supports many in-flight quotes at once */}
      {isSignedIn && (
        <Card padding="none">
          <div className="flex items-center justify-between p-4 gap-2 flex-wrap" style={{ borderBottom: "1px solid var(--line)" }}>
            <div>
              <h3 className="font-display text-lg font-semibold">In-flight quotes</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Pending customer reply, approved (ready to submit), or declined. Polls every 5 sec.</p>
            </div>
            <SecondaryBtn onClick={() => fetchPendingQuotes({ manual: true })} disabled={refreshingPending}>
              <Loader2 size={14} className={refreshingPending ? "spin" : ""} />
              {refreshingPending ? "Refreshing…" : "Refresh"}
            </SecondaryBtn>
          </div>
          {pendingQuotes.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No quotes in flight. Send one above.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--line)" }}>
              {pendingQuotes.map((q) => {
                const isApproved = q.status === "customer_approved";
                const isDeclined = q.status === "customer_declined";
                const expired = q.expires_at && new Date(q.expires_at).getTime() < Date.now() && q.status === "pending_approval";
                const status = expired ? "expired" : q.status;
                const statusStyles = {
                  pending_approval: { bg: "#fef3c7", color: "#92400e", label: "Awaiting reply" },
                  customer_approved: { bg: "var(--emerald)", color: "var(--lime)", label: "Approved · ready to submit" },
                  customer_declined: { bg: "#fee2e2", color: "#991b1b", label: "Declined" },
                  expired: { bg: "var(--bone-2)", color: "var(--muted)", label: "Expired" },
                }[status] || { bg: "var(--bone-2)", color: "var(--muted)", label: status };
                return (
                  <div key={q.id} className="p-4" style={{ background: isApproved ? "rgba(15,95,63,0.04)" : "white" }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold">{q.displayRef}</span>
                          <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ background: statusStyles.bg, color: statusStyles.color }}>{statusStyles.label}</span>
                          <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{relativeTime(q.created_at)}</span>
                        </div>
                        <div className="mt-1 text-sm font-medium">{q.customer_name || "Unnamed"} <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>· {q.customer_phone || "—"}</span></div>
                        <div className="mt-1 font-mono text-xs" style={{ color: "var(--muted)" }}>${parseFloat(q.amount).toLocaleString()} {q.currency} → {q.beneficiary || q.destination || "—"} · ₦{parseFloat(q.rate).toFixed(2)}/$ · total ₦{Math.round(q.ngn_total || 0).toLocaleString()} · via {SHOW_TRIPLE_A ? (q.rail || "—") : PARTNER_DISPLAY_NAME.toLowerCase()}</div>
                        {q.markup_pct != null && <div className="mt-1 font-mono text-[10px]" style={{ color: "var(--muted)" }}>Markup: {parseFloat(q.markup_pct).toFixed(2)}% · cost basis ₦{parseFloat(q.cost_basis_ngn || 0).toFixed(2)}/$</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {status === "pending_approval" && (
                          <>
                            <button onClick={() => resendPendingQuote(q)} className="rounded-lg px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition" style={{ border: "1px solid var(--line)" }}><MessageCircle size={11} className="inline mr-1" />Resend</button>
                            <button onClick={() => resendPendingQuoteAuto(q)} className="rounded-lg px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition" style={{ border: "1px solid var(--line)", background: "var(--bone-2)" }} title="Re-send via XaePay Cloud API (beta)"><Send size={11} className="inline mr-1" />Auto</button>
                            <button onClick={() => cancelPendingQuote(q)} className="rounded-lg px-2 py-1.5 transition" style={{ border: "1px solid var(--line)", color: "var(--muted)" }} title="Cancel quote"><X size={12} /></button>
                          </>
                        )}
                        {isApproved && (
                          <>
                            <button onClick={() => submitPendingOrder(q)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition glow-lime" style={{ background: "var(--lime)", color: "var(--ink)" }}><Send size={11} /> Submit to {SHOW_TRIPLE_A ? q.rail : "partner"}</button>
                            <button onClick={() => cancelPendingQuote(q)} className="rounded-lg px-2 py-1.5 transition" style={{ border: "1px solid var(--line)", color: "var(--muted)" }} title="Cancel quote"><X size={12} /></button>
                          </>
                        )}
                        {(isDeclined || expired) && (
                          <button onClick={() => cancelPendingQuote(q)} className="rounded-lg px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition" style={{ border: "1px solid var(--line)", color: "var(--muted)" }}>Dismiss</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Recent orders */}
      <Card padding="none">
        <div className="p-4" style={{ borderBottom: "1px solid var(--line)" }}>
          <h3 className="font-display text-lg font-semibold">Recent orders</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Submitted orders awaiting rail confirmation. Filled orders move to Transactions.</p>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No orders submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>{["Order ID", "Customer", "Rail", "Amount", "Customer rate", "When", "Status"].map((h, i) => (<th key={i} className={`px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider ${["Amount", "Customer rate"].includes(h) ? "text-right" : ""}`} style={{ color: "var(--muted)" }}>{h}</th>))}</tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-[color:var(--bone)]" style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold">{o.id}</td>
                    <td className="px-4 py-3.5 font-medium">{o.customer}</td>
                    <td className="px-4 py-3.5">{o.rail}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold">${o.amount.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right font-mono">₦{o.customerRate.toFixed(2)}</td>
                    <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--muted)" }}>{o.ts}</td>
                    <td className="px-4 py-3.5"><StatusPill status={o.status === "submitted" ? "pending" : o.status === "settling" ? "processing" : "completed"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <OperatorQuoteModal open={quoteModalOpen} onClose={() => setQuoteModalOpen(false)} onCreated={() => fetchPendingQuotes()} />
    </div>
  );
}

function InvoicePreviewModal({ open, onClose, data }) {
  if (!open) return null;
  const { push } = useToast();
  const isInbound = data.direction === "on-ramp";
  // Stable preview reference — XPT-XXXX format. Real refs come from the DB on send.
  const ref = `XPT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const issued = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  return (
    <Modal open={open} onClose={onClose} title="Invoice + payment instructions · preview" size="lg">
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>This is what XaePay generates when your customer confirms the quote. Delivered via WhatsApp + email. PDF generation lands with the backend pass.</p>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2">
            <FileText size={14} style={{ color: "var(--emerald)" }} />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">Invoice + payment instructions</span>
          </div>
          <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>Auto-generated · preview</span>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-start justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--line)" }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: "linear-gradient(135deg, var(--emerald), var(--emerald-deep))" }}>
                  <span className="font-display text-xs font-semibold" style={{ color: "var(--lime)" }}>X</span>
                </div>
                <span className="font-display text-sm font-semibold">XaePay</span>
              </div>
              <div className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>Issued by {data.operatorCompany}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>Reference</div>
              <div className="font-mono text-sm font-semibold">{ref}</div>
              <div className="font-mono text-[9px] mt-1" style={{ color: "var(--muted)" }}>{issued} WAT</div>
            </div>
          </div>

          <div className="mb-5">
            <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Bill to</div>
            <div className="text-sm font-semibold">{data.customerName || "(customer name)"}</div>
            <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{data.customerPhone || "(customer WhatsApp)"}</div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-4">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>{isInbound ? "Recipient" : "Beneficiary (supplier)"}</div>
              <div className="text-sm font-semibold">{data.beneficiary || "(beneficiary)"}</div>
              <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{isInbound ? "Nigeria" : data.country || "—"}</div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Service tier</div>
              <div className="text-sm font-semibold">{data.tier.name}</div>
              <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{data.tier.tagline}</div>
            </div>
          </div>

          <div className="rounded-lg p-4 mb-5" style={{ background: "var(--bone)" }}>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Amount ({isInbound ? "incoming" : "outgoing"})</span><span className="font-mono">${data.amount.toLocaleString()} {data.currency}</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Locked rate</span><span className="font-mono">₦{data.customerRate.toFixed(2)}/$</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Settlement</span><span className="font-mono text-xs">{data.settlement || "—"}</span></div>
              <div className="flex justify-between pt-2 mt-2 font-semibold" style={{ borderTop: "1px solid var(--line)" }}>
                <span>{isInbound ? "Recipient receives" : "Total NGN to fund"}</span>
                <span className="font-mono">₦{Math.round(data.ngnTotal).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {!isInbound && (
            <div className="rounded-lg p-4 mb-5" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
              <div className="font-mono text-[9px] uppercase tracking-wider mb-2" style={{ color: "var(--emerald)" }}>Payment instructions — fund this transaction</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Bank</span><span>(operator's collection bank)</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Account name</span><span>{data.operatorCompany} Collections</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Account number</span><span className="font-mono">(operator-provided)</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Reference (must include)</span><span className="font-mono font-semibold" style={{ color: "var(--emerald)" }}>{ref}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Amount</span><span className="font-mono font-semibold">₦{Math.round(data.ngnTotal).toLocaleString()}</span></div>
                <div className="flex justify-between pt-2 mt-2" style={{ borderTop: "1px dashed var(--line)" }}><span style={{ color: "var(--muted)" }}>Quote validity</span><span className="font-mono" style={{ color: "var(--amber)" }}>4 minutes from confirmation</span></div>
              </div>
              <p className="mt-3 text-[10px]" style={{ color: "var(--muted)" }}>The actual collection bank, account name, and account number will be filled in from the operator's banking details when the customer confirms.</p>
            </div>
          )}

          {isInbound && (
            <div className="rounded-lg p-4 mb-5" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.25)" }}>
              <div className="font-mono text-[9px] uppercase tracking-wider mb-2" style={{ color: "var(--amber)" }}>Inbound — sender funds in foreign currency</div>
              <p className="text-xs" style={{ color: "var(--ink)" }}>The sender pays our licensed payment partner in {data.currency}. Once cleared, the recipient receives ₦{Math.round(data.ngnTotal).toLocaleString()} to their Nigerian bank account. Operator does not collect NGN on inbound — payment instructions for the foreign side are generated separately at confirmation.</p>
            </div>
          )}

          <div className="text-[9px] leading-relaxed" style={{ color: "var(--muted)" }}>Payment execution by licensed payment partner. XaePay is a software and compliance documentation platform. This invoice is generated upon quote confirmation and represents the locked terms of the transaction. Reference number must be included in the wire transfer for proper allocation.</div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 mt-4">
        <SecondaryBtn full onClick={() => push("PDF generation lands with backend pass", "info")}><Download size={14} /> Download PDF</SecondaryBtn>
        <SecondaryBtn full onClick={() => push("WhatsApp delivery lands with backend pass", "info")}><MessageCircle size={14} /> Send via WhatsApp</SecondaryBtn>
        <SecondaryBtn full onClick={() => push("Email delivery lands with backend pass", "info")}><Send size={14} /> Email customer</SecondaryBtn>
      </div>

      <div className="flex justify-end pt-3">
        <PrimaryBtn onClick={onClose}>Close preview</PrimaryBtn>
      </div>
    </Modal>
  );
}

function BDCPaymentAgent() {
  const { push } = useToast();
  const customers = [
    { name: "Funmi Adeleke", txCount: 4, monthVolume: 6800, lastTx: "Today" },
    { name: "Tunde Bakare", txCount: 12, monthVolume: 9200, lastTx: "Yesterday" },
    { name: "Aisha Mohammed", txCount: 7, monthVolume: 4500, lastTx: "Apr 16" },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.3)" }}>
        <div className="flex items-start gap-3"><Sparkles size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--amber)" }} />
          <div className="text-sm" style={{ color: "var(--ink)" }}><span className="font-semibold">Phase 2 · Payment Agent for Individuals.</span><p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>Process trade payments for individuals as disclosed payment agent. XaePay generates third-party authorization, disclosed payment letter, full audit trail per transaction.</p></div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Individual customers" value="14" change="+3 this month" positive />
        <StatCard label="Volume · 30d" value="$48K" change="38 transactions" />
        <StatCard label="Service fee revenue" value="$1,920" change="4% avg" />
      </div>
      <Card padding="none">
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="text-sm font-semibold">Individual customers · payment agent</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>{["Customer", "Transactions", "Month volume", "Last", ""].map((h, i) => (<th key={i} className={`px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider ${["Transactions", "Month volume"].includes(h) ? "text-right" : ""}`} style={{ color: "var(--muted)" }}>{h}</th>))}</tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.name} className="transition hover:bg-[color:var(--bone)]" style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="px-4 py-3.5 font-medium">{c.name}</td>
                  <td className="px-4 py-3.5 text-right font-mono">{c.txCount}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold">${c.monthVolume.toLocaleString()}</td>
                  <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--muted)" }}>{c.lastTx}</td>
                  <td className="px-4 py-3.5 text-right"><button onClick={() => push(`Opening authorization docs for ${c.name}`, "info")} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition" style={{ border: "1px solid var(--line)" }}><FileText size={11} /> Docs</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Hardcoded sample transactions shown to unsigned visitors so the page isn't empty during demos.
const DEMO_TRANSACTIONS = [
  { id: "XP-9841", customer: "Novus Trading Ltd", dest: "AE", amount: 128000, status: "processing", rail: "Triple-A", date: "Today · 14:22" },
  { id: "XP-9840", customer: "Adeyemi Okafor", dest: "CN", amount: 47500, status: "pending", rail: "Cedar USDT", date: "Today · 13:58" },
  { id: "XD-4421", customer: "Diaspora → Lagos Build & Supply", dest: "IN", amount: 2500, status: "completed", rail: "Cedar (inbound)", date: "Today · 12:17" },
  { id: "XP-9839", customer: "Sahara Foods Import", dest: "CN", amount: 82000, status: "completed", rail: "Cedar USDT", date: "Today · 11:42" },
  { id: "XD-4398", customer: "Diaspora → Adeola Nwosu", dest: "IN", amount: 800, status: "completed", rail: "Cedar (inbound)", date: "Yesterday · 16:55" },
  { id: "XP-9838", customer: "Funmi Adeleke (Ind.)", dest: "IN", amount: 1800, status: "pending", rail: "BDC USDT", date: "Today · 10:17" },
  { id: "XP-9837", customer: "Delta Petrochem", dest: "US", amount: 215000, status: "completed", rail: "Triple-A", date: "Yesterday · 17:03" },
  { id: "XP-9836", customer: "Kaduna Textiles", dest: "CN", amount: 68500, status: "completed", rail: "Cedar USDT", date: "Yesterday · 15:41" },
  { id: "XP-9835", customer: "Port Harcourt Supply", dest: "UK", amount: 34200, status: "disputed", rail: "Triple-A", date: "Yesterday · 09:18" },
];

// Quote rows have status values from the workflow state machine; the table UI uses simpler labels.
const QUOTE_STATUS_TO_TX_STATUS = {
  pending_approval: "pending",
  customer_approved: "pending",
  customer_declined: "disputed",
  submitted_to_rail: "processing",
  filled: "completed",
  expired: "disputed",
  cancelled: "disputed",
};

function BDCTransactions() {
  const { push } = useToast();
  const auth = useAuth();
  const isSignedIn = !!auth.user;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [realTxs, setRealTxs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTxs = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("id, customer_name, customer_phone, beneficiary, destination, amount, currency, rate, ngn_total, rail, status, submitted_at, created_at, markup_pct, cost_basis_ngn")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Fetch transactions failed:", error);
      push("Couldn't load transactions — check console.", "warn");
    } else {
      setRealTxs((data || []).map((q) => ({
        id: `XP-${q.id.slice(0, 4).toUpperCase()}`,
        dbId: q.id,
        customer: q.customer_name || "Unnamed",
        customerPhone: q.customer_phone,
        beneficiary: q.beneficiary,
        dest: q.destination || "—",
        amount: parseFloat(q.amount),
        currency: q.currency,
        rate: parseFloat(q.rate),
        ngnTotal: q.ngn_total,
        markupPct: q.markup_pct != null ? parseFloat(q.markup_pct) : null,
        costBasisNgn: q.cost_basis_ngn != null ? parseFloat(q.cost_basis_ngn) : null,
        rail: q.rail || "—",
        status: QUOTE_STATUS_TO_TX_STATUS[q.status] || "pending",
        date: relativeTime(q.submitted_at || q.created_at),
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchTxs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [auth.user?.id]);

  const txs = isSignedIn ? realTxs : DEMO_TRANSACTIONS;
  const showEmptyState = isSignedIn && !loading && realTxs.length === 0;
  const filtered = txs.filter((t) => {
    const q = query.toLowerCase();
    const matchQ = !q || t.id.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q) || t.rail.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || t.status === statusFilter;
    return matchQ && matchS;
  });
  return (
    <>
    <Card padding="none">
      <div className="flex flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-center" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="focus-ring flex flex-1 items-center gap-2 rounded-xl px-3 py-2" style={{ background: "white", border: "1px solid var(--line)" }}>
          <Search size={14} style={{ color: "var(--muted)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions, customers…" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {!isSignedIn && <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--bone-2)", color: "var(--muted)" }}>Demo data</span>}
          <Select small value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option><option value="completed">Completed</option><option value="processing">Processing</option><option value="pending">Pending</option><option value="disputed">Disputed</option>
          </Select>
          <SecondaryBtn onClick={() => { setQuery(""); setStatusFilter("all"); push("Filters cleared", "info"); }}><Filter size={14} /> Clear</SecondaryBtn>
          <SecondaryBtn onClick={() => push(`Exporting ${filtered.length} rows to CSV…`, "success")}><Download size={14} /> Export</SecondaryBtn>
          {isSignedIn && <SecondaryBtn onClick={fetchTxs}><Loader2 size={14} className={loading ? "spin" : ""} /> Refresh</SecondaryBtn>}
        </div>
      </div>
      {showEmptyState ? (
        <div className="p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--bone-2)" }}><Receipt size={20} style={{ color: "var(--muted)" }} /></div>
          <h3 className="font-display text-lg font-semibold">No transactions yet</h3>
          <p className="mt-1.5 text-sm max-w-md mx-auto" style={{ color: "var(--muted)" }}>Submitted orders from the Rail Quotes tab will appear here. Send a quote, get customer approval, submit to a rail — it'll show up.</p>
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>{["Ref", "Customer", "Dest", "Amount", "Rail", "Status", "Date", ""].map((h, i) => (<th key={i} className={`px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider ${h === "Amount" ? "text-right" : ""}`} style={{ color: "var(--muted)" }}>{h}</th>))}</tr></thead>
          <tbody>
            {filtered.length === 0 ? (<tr><td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: "var(--muted)" }}>No transactions match.</td></tr>) : filtered.map((t) => (
              <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer transition hover:bg-[color:var(--bone)]" style={{ borderBottom: "1px solid var(--line)" }}>
                <td className="px-4 py-3.5 font-mono text-xs font-semibold">{t.id}</td>
                <td className="px-4 py-3.5 font-medium">{t.customer}</td>
                <td className="px-4 py-3.5 font-mono text-xs">{t.dest}</td>
                <td className="px-4 py-3.5 text-right font-mono font-semibold">${t.amount.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-[13px]" style={{ color: "var(--muted)" }}>{SHOW_TRIPLE_A ? t.rail : "Partner"}</td>
                <td className="px-4 py-3.5"><StatusPill status={t.status} /></td>
                <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--muted)" }}>{t.date}</td>
                <td className="px-4 py-3.5"><ChevronRight size={14} style={{ color: "var(--muted)" }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </Card>
    <TxDrawer tx={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function TxDrawer({ tx, onClose }) {
  const { push } = useToast();
  if (!tx) return null;
  return (
    <Drawer open={!!tx} onClose={onClose} title={`Transaction ${tx.id}`}>
      <div className="space-y-5">
        <div className="flex items-center justify-between"><StatusPill status={tx.status} /><span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{tx.date}</span></div>
        <div className="relative overflow-hidden rounded-xl p-5" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-30 blur-3xl" style={{ background: "var(--lime)" }} />
          <div className="relative font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.5)" }}>Amount</div>
          <div className="relative font-display mt-1 text-4xl font-[500] tracking-tight" style={{ color: "var(--lime)" }}>${tx.amount.toLocaleString()}</div>
          <div className="relative mt-1 font-mono text-[11px]" style={{ color: "rgba(247,245,240,0.6)" }}>{tx.customer} → {tx.dest} · via {SHOW_TRIPLE_A ? tx.rail : "partner"}</div>
        </div>

        {(tx.rate != null || tx.markupPct != null) && (
          <div>
            <Label>Pricing breakdown</Label>
            <div className="space-y-1.5 rounded-xl p-4 text-xs font-mono" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
              {tx.costBasisNgn != null && <div className="flex items-baseline justify-between"><span style={{ color: "var(--muted)" }}>Rail cost basis</span><span className="font-semibold">₦{tx.costBasisNgn.toFixed(2)}/$</span></div>}
              {tx.markupPct != null && <div className="flex items-baseline justify-between"><span style={{ color: "var(--muted)" }}>Your markup</span><span className="font-semibold">{tx.markupPct.toFixed(2)}%</span></div>}
              {tx.rate != null && <div className="flex items-baseline justify-between pt-1.5" style={{ borderTop: "1px solid var(--line)" }}><span className="font-semibold">Customer rate</span><span className="font-semibold">₦{tx.rate.toFixed(2)}/$</span></div>}
              {tx.ngnTotal != null && <div className="flex items-baseline justify-between"><span style={{ color: "var(--muted)" }}>Customer pays</span><span className="font-semibold">₦{Math.round(tx.ngnTotal).toLocaleString()}</span></div>}
              {tx.markupPct != null && tx.costBasisNgn != null && tx.amount && <div className="flex items-baseline justify-between pt-1.5" style={{ borderTop: "1px solid var(--line)" }}><span style={{ color: "var(--emerald)" }}>BDC margin (est.)</span><span className="font-semibold" style={{ color: "var(--emerald)" }}>₦{Math.round((tx.rate - tx.costBasisNgn) * tx.amount).toLocaleString()}</span></div>}
            </div>
          </div>
        )}

        <div>
          <Label>Audit trail</Label>
          <div className="space-y-1.5 rounded-xl p-4 text-xs font-mono" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
            <div>1. Customer → BDC ← ₦{Math.round((tx.ngnTotal || tx.amount * 1395)).toLocaleString()}</div>
            <div>2. BDC → {SHOW_TRIPLE_A ? (tx.rail || "rail") : "partner"} ← {tx.amount.toLocaleString()} {SHOW_TRIPLE_A && tx.rail === "Triple-A" ? "USDT" : "USD"}</div>
            <div>3. {SHOW_TRIPLE_A ? (tx.rail || "Rail") : "Partner"} → MT103 → {tx.beneficiary || "beneficiary"}</div>
          </div>
        </div>
        <div>
          <Label>Compliance checks</Label>
          <div className="space-y-2 rounded-xl p-4 text-sm" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
            {["Payer-name match", "Sanctions screening", "Form M pre-flight", "Invoice freshness"].map((c, i) => (<div key={i} className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--emerald)" }} strokeWidth={2.5} /> {c}</div>))}
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid var(--line)" }}>
          <PrimaryBtn onClick={() => push(`Downloading evidence pack for ${tx.id}`, "success")} full><Download size={14} /> Download evidence pack</PrimaryBtn>
          <SecondaryBtn onClick={() => push(`Opened dispute for ${tx.id}`, "info")} full>Open dispute</SecondaryBtn>
        </div>
      </div>
    </Drawer>
  );
}

// Hardcoded sample data shown to unsigned visitors so the dashboard isn't empty during demos.
const DEMO_CUSTOMERS = [
  { name: "Novus Trading Ltd", volume: 1240000, count: 34, tier: "Corporate", kycTier: 3 },
  { name: "Delta Petrochem", volume: 890000, count: 12, tier: "Corporate", kycTier: 3 },
  { name: "Sahara Foods Import", volume: 420000, count: 28, tier: "SME", kycTier: 2 },
  { name: "Kaduna Textiles Ltd", volume: 380000, count: 19, tier: "SME", kycTier: 2 },
  { name: "Adeyemi Okafor", volume: 142000, count: 8, tier: "SME", kycTier: 2 },
  { name: "Funmi Adeleke", volume: 6800, count: 4, tier: "Individual", kycTier: 1 },
];

// Cedar-style KYC status taxonomy. Maps any persisted status (legacy or new) to a
// label + colors for the badge. Customers must be "Approved" before they can transact.
function kycStatusLabel(status) {
  switch ((status || "").toLowerCase()) {
    case "approved":
    case "verified":
      return { label: "Approved", bg: "var(--emerald)", color: "var(--lime)" };
    case "under_review":
    case "in_review":
    case "submitted":
      return { label: "Under Review", bg: "rgba(15,95,63,0.10)", color: "var(--emerald)" };
    case "action_needed":
      return { label: "Action Needed", bg: "#fef3c7", color: "#92400e" };
    case "rejected":
      return { label: "Rejected", bg: "#fee2e2", color: "#991b1b" };
    case "pending":
    case "":
    case null:
    case undefined:
    default:
      return { label: "Pending KYC", bg: "#fef3c7", color: "#92400e" };
  }
}

// Map a Supabase customers row to the shape the table expects
function dbCustomerToUi(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    contactName: row.contact_name,
    tier: row.type || "SME",
    kycTier: row.kyc_tier ?? 0,
    kycStatus: row.kyc_status,
    volume: Math.round((row.lifetime_volume_cents || 0) / 100),
    count: row.transaction_count || 0,
    onboardedVia: row.onboarded_via,
    addedAt: row.created_at,
    // Cedar Money compliance state
    cedarBusinessId: row.cedar_business_id,
    cedarKycStatus: row.cedar_kyc_status,
    cedarCountryIso: row.cedar_country_iso,
    cedarState: row.cedar_state,
    cedarCity: row.cedar_city,
    cedarAddress: row.cedar_address,
    cedarStreetNumber: row.cedar_street_number,
    cedarZipcode: row.cedar_zipcode,
    cedarContactPhonePrefix: row.cedar_contact_phone_prefix,
    cedarIndustry: row.cedar_industry,
    cedarLocalRegNumber: row.cedar_local_reg_number,
    cedarSubmittedAt: row.cedar_submitted_at,
  };
}

function BDCCustomers({ addedCustomers = [], onAddCustomer }) {
  const { push } = useToast();
  const auth = useAuth();
  const isSignedIn = !!auth.user;
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [realCustomers, setRealCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Fetch customers failed:", error);
      push("Couldn't load customers — check console.", "warn");
    } else {
      setRealCustomers((data || []).map(dbCustomerToUi));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [auth.user?.id]);

  // Signed-in users see only their real DB rows. Unsigned visitors see in-memory adds + demo seed.
  const customers = isSignedIn ? realCustomers : [...addedCustomers, ...DEMO_CUSTOMERS];
  const showEmptyState = isSignedIn && !loading && realCustomers.length === 0;

  const approvedCount = customers.filter((c) => kycStatusLabel(c.kycStatus).label === "Approved").length;
  const pendingCount = customers.length - approvedCount;
  return (
    <>
    {/* Stage 1 explainer — only relevant for signed-in operators with real customers */}
    {isSignedIn && (
      <div className="mb-4 rounded-2xl p-4" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
        <div className="flex items-start gap-3">
          <Shield size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
          <div className="text-sm" style={{ color: "var(--ink)" }}>
            <span className="font-semibold">Stage 1 of the platform: customer KYC.</span> Customers must be <span className="font-semibold" style={{ color: "var(--emerald)" }}>Approved</span> by our licensed payment partner before they can transact. Typical turnaround is 5–15 business days. Onboard new customers here — once approved, they show up as eligible in the quote flow.
          </div>
        </div>
      </div>
    )}
    <Card padding="none">
      <div className="flex items-center justify-between p-4 gap-2 flex-wrap" style={{ borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="text-sm font-semibold">
            {loading ? "Loading…" : `${customers.length} customer${customers.length === 1 ? "" : "s"}`}
            {!isSignedIn && <span className="ml-2 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--bone-2)", color: "var(--muted)" }}>Demo data — sign in to manage real customers</span>}
          </div>
          {isSignedIn && customers.length > 0 && (
            <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{approvedCount} approved · {pendingCount} awaiting KYC</div>
          )}
        </div>
        <div className="flex gap-2">
          <SecondaryBtn onClick={() => push(`Exporting ${customers.length} customers…`, "success")}><Download size={14} /> Export</SecondaryBtn>
          <PrimaryBtn onClick={() => setAddOpen(true)}><Plus size={14} /> Onboard customer</PrimaryBtn>
        </div>
      </div>
      {showEmptyState ? (
        <div className="p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--bone-2)" }}><User size={20} style={{ color: "var(--muted)" }} /></div>
          <h3 className="font-display text-lg font-semibold">No customers yet</h3>
          <p className="mt-1.5 text-sm max-w-md mx-auto" style={{ color: "var(--muted)" }}>Add your first customer — push a KYC link to their WhatsApp, or capture their docs at the counter. They'll show up here once saved.</p>
          <PrimaryBtn onClick={() => setAddOpen(true)}><Plus size={14} /> Add your first customer</PrimaryBtn>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>{["Customer", "Type", "KYC status", "Lifetime volume", "Transactions", ""].map((h, i) => (<th key={i} className={`px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider ${["Lifetime volume", "Transactions"].includes(h) ? "text-right" : ""}`} style={{ color: "var(--muted)" }}>{h}</th>))}</tr></thead>
            <tbody>
              {customers.map((c) => {
                const kyc = kycStatusLabel(c.kycStatus);
                return (
                  <tr key={c.id || c.name} onClick={() => setSelected(c)} className="cursor-pointer transition hover:bg-[color:var(--bone)]" style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="px-4 py-3.5 font-medium">{c.name}</td>
                    <td className="px-4 py-3.5"><span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={c.tier === "Corporate" ? { background: "var(--emerald)", color: "var(--lime)" } : c.tier === "SME" ? { background: "#fef3c7", color: "#92400e" } : { background: "var(--bone-2)", color: "var(--muted)" }}>{c.tier}</span></td>
                    <td className="px-4 py-3.5"><span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ background: kyc.bg, color: kyc.color }}>{kyc.label}</span></td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold">${c.volume.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right font-mono">{c.count}</td>
                    <td className="px-4 py-3.5"><ChevronRight size={14} style={{ color: "var(--muted)" }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
    <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />
    <AddCustomerModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={() => { setAddOpen(false); fetchCustomers(); }} onAddLocal={(c) => { if (onAddCustomer) onAddCustomer(c); setAddOpen(false); }} />
    </>
  );
}

// ─── Recipients ─────────────────────────────────────────────────────────────
// Saved supplier / beneficiary banking details, scoped per-customer. Operator
// reuses these when composing quotes so they don't re-key bank info each time.
// Persistence backend deferred — for now this is component-local + demo seed.
const DEMO_RECIPIENTS = [
  { id: 1, customer: "Adekunle Imports Ltd", direction: "outbound", name: "Shenzhen Electronics Co., Ltd", country: "China", bank: "Bank of China", account: "•••• 4521", currency: "USD", lastUsed: "Today", txCount: 6 },
  { id: 2, customer: "Adekunle Imports Ltd", direction: "outbound", name: "Hangzhou Logistics", country: "China", bank: "ICBC", account: "•••• 8829", currency: "USD", lastUsed: "Apr 15", txCount: 3 },
  { id: 3, customer: "Sahara Foods", direction: "outbound", name: "Mumbai Pharma Ltd", country: "India", bank: "State Bank of India", account: "•••• 2341", currency: "USD", lastUsed: "Apr 12", txCount: 4 },
  { id: 4, customer: "Delta Petrochem", direction: "outbound", name: "Hamburg Auto Parts GmbH", country: "Germany", bank: "Deutsche Bank", account: "•••• 1198", currency: "EUR", lastUsed: "Apr 18", txCount: 2 },
  { id: 5, customer: "London Diaspora Ltd", direction: "inbound", name: "Lagos Trading Hub Ltd", country: "Nigeria", bank: "GTBank", account: "•••• 7733", currency: "NGN", lastUsed: "Today", txCount: 4 },
  { id: 6, customer: "Boston Imports US", direction: "inbound", name: "Onitsha Distributors", country: "Nigeria", bank: "Access Bank", account: "•••• 4408", currency: "NGN", lastUsed: "Apr 14", txCount: 2 },
];

function DirectionBadge({ direction }) {
  const isOut = direction === "outbound";
  return (
    <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider inline-flex items-center gap-1" style={{ background: isOut ? "rgba(15,95,63,0.12)" : "rgba(212,168,44,0.12)", color: isOut ? "var(--emerald)" : "var(--amber)" }}>
      {isOut ? "→ Out" : "← In"}
    </span>
  );
}

function BDCRecipients() {
  const { push } = useToast();
  const auth = useAuth();
  const isSignedIn = !!auth.user;
  const [addOpen, setAddOpen] = useState(false);
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [localAdds, setLocalAdds] = useState([]);

  // Until the recipients table lands, signed-in users see only their own session adds
  // (no cross-device persistence) and unsigned visitors see the demo seed.
  const recipients = isSignedIn ? localAdds : [...localAdds, ...DEMO_RECIPIENTS];
  const filtered = filterCustomer === "all" ? recipients : recipients.filter((r) => r.customer === filterCustomer);
  const customers = [...new Set(recipients.map((r) => r.customer))];

  const handleAdded = (rec) => {
    setLocalAdds((prev) => [{ ...rec, id: Date.now(), lastUsed: "Just now", txCount: 0 }, ...prev]);
    setAddOpen(false);
    push(`${rec.name} saved as recipient for ${rec.customer}`, "success");
  };

  return (
    <>
    <Card padding="none">
      <div className="flex flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-center" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="flex-1">
          <div className="text-sm font-semibold">{filtered.length} saved recipient{filtered.length === 1 ? "" : "s"}</div>
          <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>Reuse these in quotes — no need to re-enter banking details each time. {isSignedIn && localAdds.length === 0 && "Persistence lands with the backend pass."}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {customers.length > 0 && (
            <Select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}>
              <option value="all">All customers</option>
              {customers.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          )}
          <PrimaryBtn onClick={() => setAddOpen(true)}><Plus size={14} /> Add recipient</PrimaryBtn>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--bone-2)" }}><Briefcase size={20} style={{ color: "var(--muted)" }} /></div>
          <h3 className="font-display text-lg font-semibold">No recipients saved yet</h3>
          <p className="mt-1.5 text-sm max-w-md mx-auto" style={{ color: "var(--muted)" }}>Save the suppliers and beneficiaries your customers transact with most often. They'll appear as quick-select chips in the quote builder.</p>
          <div className="mt-4"><PrimaryBtn onClick={() => setAddOpen(true)}><Plus size={14} /> Add your first recipient</PrimaryBtn></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>{["Recipient", "Customer", "Direction", "Banking", "Currency", "Last used", "Transactions"].map((h, i) => (<th key={i} className={`px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider ${["Transactions"].includes(h) ? "text-right" : ""}`} style={{ color: "var(--muted)" }}>{h}</th>))}</tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => push(`Opening ${r.name}`, "info")} className="cursor-pointer transition hover:bg-[color:var(--bone)]" style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="px-4 py-3.5">
                    <div className="font-medium">{r.name}</div>
                    <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{r.country}</div>
                  </td>
                  <td className="px-4 py-3.5 text-sm" style={{ color: "var(--muted)" }}>{r.customer}</td>
                  <td className="px-4 py-3.5"><DirectionBadge direction={r.direction} /></td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm">{r.bank}</div>
                    <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{r.account}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs">{r.currency}</td>
                  <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--muted)" }}>{r.lastUsed}</td>
                  <td className="px-4 py-3.5 text-right font-mono">{r.txCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
    <AddRecipientModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={handleAdded} />
    </>
  );
}

function AddRecipientModal({ open, onClose, onAdded }) {
  const empty = { customer: "", direction: "outbound", name: "", country: "China", bank: "", account: "", swift: "", currency: "USD" };
  const [data, setData] = useState(empty);
  const submit = (e) => {
    e.preventDefault();
    onAdded({ ...data, account: data.account ? `•••• ${data.account.slice(-4)}` : data.account });
    setData(empty);
  };
  return (
    <Modal open={open} onClose={onClose} title="Add recipient" size="lg">
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>Save a supplier or beneficiary's banking details for fast reuse in quotes. Linked to a specific customer.</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Linked customer" full>
            <Input value={data.customer} onChange={(e) => setData({ ...data, customer: e.target.value })} placeholder="Customer business name" />
          </Field>
          <Field label="Direction">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setData({ ...data, direction: "outbound", country: "China", currency: "USD" })} className="rounded-xl px-3 py-2.5 text-sm font-medium transition" style={data.direction === "outbound" ? { background: "var(--ink)", color: "var(--bone)" } : { background: "white", color: "var(--ink)", border: "1px solid var(--line)" }}>Outbound</button>
              <button type="button" onClick={() => setData({ ...data, direction: "inbound", country: "Nigeria", currency: "NGN" })} className="rounded-xl px-3 py-2.5 text-sm font-medium transition" style={data.direction === "inbound" ? { background: "var(--ink)", color: "var(--bone)" } : { background: "white", color: "var(--ink)", border: "1px solid var(--line)" }}>Inbound</button>
            </div>
          </Field>
          <Field label="Recipient name"><Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder={data.direction === "inbound" ? "Lagos Trading Hub Ltd" : "Shenzhen Electronics Co., Ltd"} /></Field>
          <Field label="Country">
            <Select value={data.country} onChange={(e) => setData({ ...data, country: e.target.value })}>
              {data.direction === "inbound" ? (
                <option>Nigeria</option>
              ) : (
                <>
                  <option>China</option><option>USA</option><option>UK</option><option>Germany</option><option>UAE</option><option>India</option><option>Türkiye</option>
                </>
              )}
            </Select>
          </Field>
          <Field label="Bank name" full><Input value={data.bank} onChange={(e) => setData({ ...data, bank: e.target.value })} placeholder="Bank of China" /></Field>
          <Field label="Account number"><Input value={data.account} onChange={(e) => setData({ ...data, account: e.target.value })} /></Field>
          <Field label={data.direction === "inbound" ? "Sort code (if applicable)" : "SWIFT / IBAN"}><Input value={data.swift} onChange={(e) => setData({ ...data, swift: e.target.value })} /></Field>
          <Field label="Currency" full>
            <Select value={data.currency} onChange={(e) => setData({ ...data, currency: e.target.value })}>
              {data.direction === "inbound" ? <option>NGN</option> : <><option>USD</option><option>GBP</option><option>EUR</option><option>CNY</option></>}
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <SecondaryBtn type="button" onClick={onClose}>Cancel</SecondaryBtn>
          <PrimaryBtn type="submit" disabled={!data.customer || !data.name || !data.bank || !data.account}>Save recipient</PrimaryBtn>
        </div>
      </form>
    </Modal>
  );
}

function AddCustomerModal({ open, onClose, onAdded, onAddLocal }) {
  // MVP 3-step "Stage 1: customer KYC" modal.
  // Step 1: business info form. Step 2: required docs + WhatsApp upload recommendation.
  // Step 3: submitted/success screen.
  // The actual customer-row insert + WhatsApp onboarding link fires when the user clicks
  // "Submit for review" at the end of step 2.
  const { push } = useToast();
  const auth = useAuth();
  const isSignedIn = !!auth.user;
  const empty = { name: "", contact: "", phone: "", email: "", cac: "", direction: "", purpose: "", tier: "SME" };
  const [step, setStep] = useState(1);
  const [data, setData] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const closeAndReset = () => { setStep(1); setData(empty); setSubmitting(false); onClose(); };
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => { setStep(1); setData(empty); setSubmitting(false); }, 250);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist customer row. Returns inserted row id (or null on local-only path).
  const persistCustomer = async (row) => {
    if (!isSignedIn) {
      onAddLocal?.({ ...row, volume: 0, count: 0, addedAt: "just now" });
      return null;
    }
    const { data: inserted, error } = await supabase
      .from("customers")
      .insert({
        bdc_user_id: auth.user.id,
        name: row.name,
        phone: row.phone,
        type: row.tier,
        kyc_status: row.kycStatus,
        kyc_tier: row.kycTier,
        onboarded_via: row.onboardedVia,
        onboard_token: row.onboardToken || null,
        onboard_expires_at: row.onboardExpiresAt || null,
      })
      .select("id")
      .single();
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Insert customer failed:", error);
      throw error;
    }
    return inserted?.id;
  };

  // Submit for compliance review: persist + send WhatsApp onboarding link, then advance to step 3.
  const submit = async () => {
    if (!data.name || !data.contact || !data.email || !data.phone) {
      push("Name, contact, phone and email are required.", "warn");
      return;
    }
    setSubmitting(true);
    try {
      const phoneDigits = data.phone.replace(/[^\d]/g, "");
      const onboardTokenStr = encodeQuoteToken({
        type: "onboard",
        customer: data.name,
        bdcName: auth.user?.user_metadata?.company || "Your operator",
        tier: data.tier,
        requestedAt: new Date().toISOString(),
      });
      const onboardExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const onboardUrl = `${window.location.origin}/?onboard=${onboardTokenStr}`;

      await persistCustomer({
        name: data.name, phone: data.phone, tier: data.tier,
        kycTier: 0, kycStatus: "submitted",
        onboardedVia: "whatsapp-link",
        onboardToken: onboardTokenStr,
        onboardExpiresAt,
      });

      const message =
        `Hello ${data.name},%0A%0A` +
        `${auth.user?.user_metadata?.company || "Your operator"} has invited you to onboard via XaePay.%0A%0A` +
        `Tap to securely complete your KYC — takes about 4 minutes:%0A` +
        `${encodeURIComponent(onboardUrl)}%0A%0A` +
        `Once approved, you can request trade payment quotes directly. Reply if you have questions.`;
      window.open(`https://wa.me/${phoneDigits}?text=${message}`, "_blank");

      push(`${data.name} submitted for review · 5–15 day approval · WhatsApp link sent`, "success");
      if (isSignedIn) onAdded?.();
      setStep(3);
    } catch {
      push("Couldn't save customer — try again.", "warn");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={closeAndReset} title={`Onboard customer · Step ${step} of 3`} size="lg">
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold mb-2">Stage 1 of the platform: Customer KYC</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Before your customer can transact, our licensed payment partner's compliance team must approve them. This typically takes 5–15 business days. Submit them here, we'll handle the review process and notify you when they're approved.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" full><Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Adekunle Imports Ltd" /></Field>
            <Field label="Primary contact"><Input value={data.contact} onChange={(e) => setData({ ...data, contact: e.target.value })} placeholder="Folake Adekunle" /></Field>
            <Field label="Phone (WhatsApp)"><Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="+234 803 123 4567" /></Field>
            <Field label="Email"><Input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="contact@adekunle.ng" /></Field>
            <Field label="CAC / business registration"><Input value={data.cac} onChange={(e) => setData({ ...data, cac: e.target.value })} placeholder="RC1234567 or equivalent" /></Field>
            <Field label="Direction of payments">
              <Select value={data.direction} onChange={(e) => setData({ ...data, direction: e.target.value })}>
                <option value="">Select</option>
                <option value="outbound">Outbound · Nigeria → World</option>
                <option value="inbound">Inbound · World → Nigeria</option>
                <option value="both">Both directions</option>
              </Select>
            </Field>
            <Field label="Primary use case" full>
              <Select value={data.purpose} onChange={(e) => setData({ ...data, purpose: e.target.value })}>
                <option value="">Select</option>
                <option>Trade payments to suppliers</option>
                <option>Service payments abroad</option>
                <option>Receiving from foreign buyers</option>
                <option>Aggregator (consolidating others)</option>
                <option>Mixed</option>
              </Select>
            </Field>
            <Field label="Customer type" full>
              <Select value={data.tier} onChange={(e) => setData({ ...data, tier: e.target.value })}>
                <option>Individual</option><option>SME</option><option>Corporate</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end pt-2"><PrimaryBtn onClick={() => setStep(2)} disabled={!data.name || !data.contact || !data.email}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold mb-2">Documents required for compliance review</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>You can either upload these now, or we'll send your customer a WhatsApp link where they upload directly. Most operators prefer the WhatsApp option — less work for you.</p>
          </div>
          <div className="space-y-2.5">
            {[
              "CAC certificate (incorporation document)",
              "Form CAC 1.1 (current directors and shareholders)",
              "Director's NIN slip + selfie",
              "Bank statements (last 3 months)",
              "Source of funds declaration",
              "Beneficial ownership disclosure (if 25%+ owner)",
            ].map((d, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm rounded-lg p-3" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
                <FileText size={14} style={{ color: "var(--emerald)" }} />
                <span style={{ color: "var(--ink)" }}>{d}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
            <div className="flex items-start gap-2">
              <MessageCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
              <p className="text-sm" style={{ color: "var(--ink)" }}><span className="font-semibold">WhatsApp upload recommended.</span> We'll send {data.contact || "your customer"} a link they tap to upload everything from their phone. They get notifications as compliance reviews each document.</p>
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <SecondaryBtn onClick={() => setStep(1)}>Back</SecondaryBtn>
            <PrimaryBtn onClick={submit} disabled={submitting}>{submitting ? <><Loader2 size={14} className="spin" /> Submitting…</> : <>Submit for review <ArrowRight size={14} /></>}</PrimaryBtn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-5" style={{ background: "var(--bone-2)" }}>
            <Loader2 size={28} className="spin" style={{ color: "var(--emerald)" }} />
          </div>
          <h3 className="font-display text-2xl font-semibold mb-3">Submitted for review</h3>
          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "var(--muted)" }}>{data.name || "Your customer"} is now in compliance review. Expected approval: <span className="font-semibold" style={{ color: "var(--ink)" }}>5–15 business days</span>. WhatsApp upload link sent to {data.phone || "their phone"}.</p>
          <div className="rounded-xl p-4 max-w-md mx-auto mb-6 text-left" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
            <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>What happens next</div>
            <ol className="space-y-1.5 text-sm list-none">
              <li>1. Customer uploads documents via WhatsApp link</li>
              <li>2. Compliance team reviews (1–3 days for internal review)</li>
              <li>3. If anything's missing, you and customer get notified</li>
              <li>4. Approval lands in your dashboard, customer can transact</li>
              <li>5. You get notified to start quoting</li>
            </ol>
          </div>
          <PrimaryBtn onClick={closeAndReset}>Done</PrimaryBtn>
        </div>
      )}
    </Modal>
  );
}

// Doc type labels shown in the drawer's upload picker + doc list
const DOC_TYPES = [
  { id: "id_front", label: "ID — front" },
  { id: "id_back", label: "ID — back" },
  { id: "selfie", label: "Selfie with ID" },
  { id: "bvn_slip", label: "BVN slip" },
  { id: "address_proof", label: "Proof of address" },
  { id: "other", label: "Other" },
];

// Cedar's industry enum (POST /v1/business/ requires one). Only the most common ones —
// the full Cedar list is ~25, but operators typically pick from these for trade payments.
const CEDAR_INDUSTRIES = [
  { id: "AGRICULTURE_FORESTRY_WILDLIFE", label: "Agriculture / Forestry / Wildlife" },
  { id: "BUSINESS_INFORMATION", label: "Business Information / Professional Services" },
  { id: "CONSTRUCTION_UTILITIES_CONTRACTING", label: "Construction / Utilities / Contracting" },
  { id: "EDUCATION", label: "Education" },
  { id: "FINANCE_INSURANCE", label: "Finance / Insurance" },
  { id: "FOOD_HOSPITALITY", label: "Food / Hospitality" },
  { id: "HEALTH_SERVICES", label: "Health Services" },
  { id: "MOTOR_VEHICLE", label: "Motor Vehicle" },
  { id: "NATURAL_RESOURCES_ENVIRONMENTAL", label: "Natural Resources / Environmental" },
  { id: "PERSONAL_SERVICES", label: "Personal Services" },
  { id: "REAL_ESTATE_HOUSING", label: "Real Estate / Housing" },
  { id: "TRANSPORTATION", label: "Transportation / Freight" },
  { id: "GARMENTS", label: "Garments / Textiles / Fashion" },
  { id: "PHARMACEUTICALS", label: "Pharmaceuticals" },
  { id: "TECHNOLOGY", label: "Technology" },
  { id: "MANUFACTURING", label: "Manufacturing" },
  { id: "ENTERTAINMENT", label: "Entertainment" },
  { id: "TELECOMMUNICATIONS", label: "Telecommunications" },
];

function CustomerDrawer({ customer, onClose }) {
  const { push } = useToast();
  // hooks must always run — guard the body, not the hooks
  const isRealCustomer = !!customer?.id && /^[0-9a-f-]{36}$/i.test(customer.id);
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docType, setDocType] = useState("id_front");
  const [uploading, setUploading] = useState(false);

  // Cedar Money compliance submission form. Pre-populates from the customer row
  // (so re-opening the drawer remembers what's already saved).
  const [cedarForm, setCedarForm] = useState({
    countryIso: "NG",
    state: "",
    city: "",
    address: "",
    streetNumber: "",
    zipcode: "",
    contactPhonePrefix: "234",
    industry: "",
    localRegNumber: "",
  });
  const [submittingCedar, setSubmittingCedar] = useState(false);
  const [cedarError, setCedarError] = useState(null); // { error, missing? }

  // Re-hydrate form from the customer record whenever it changes (drawer opens).
  useEffect(() => {
    if (!customer) return;
    setCedarForm({
      countryIso: customer.cedarCountryIso || "NG",
      state: customer.cedarState || "",
      city: customer.cedarCity || "",
      address: customer.cedarAddress || "",
      streetNumber: customer.cedarStreetNumber || "",
      zipcode: customer.cedarZipcode || "",
      contactPhonePrefix: customer.cedarContactPhonePrefix || "234",
      industry: customer.cedarIndustry || "",
      localRegNumber: customer.cedarLocalRegNumber || "",
    });
    setCedarError(null);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [customer?.id]);

  // Save the Cedar fields to the customer row, then call cedar-create-customer.
  const submitToCedar = async () => {
    if (!customer?.id) return;
    setSubmittingCedar(true);
    setCedarError(null);
    try {
      // 1) Persist the cedar_* columns the operator just filled in.
      const { error: patchErr } = await supabase.from("customers").update({
        cedar_country_iso: cedarForm.countryIso || null,
        cedar_state: cedarForm.state || null,
        cedar_city: cedarForm.city || null,
        cedar_address: cedarForm.address || null,
        cedar_street_number: cedarForm.streetNumber || null,
        cedar_zipcode: cedarForm.zipcode || null,
        cedar_contact_phone_prefix: cedarForm.contactPhonePrefix || null,
        cedar_industry: cedarForm.industry || null,
        cedar_local_reg_number: cedarForm.localRegNumber || null,
      }).eq("id", customer.id);
      if (patchErr) {
        // eslint-disable-next-line no-console
        console.error("Save Cedar fields failed:", patchErr);
        setCedarError({ error: "Couldn't save details — check console." });
        push("Save failed.", "warn");
        return;
      }
      // 2) Hit the Edge Function to actually create the merchant on Cedar's side.
      const { ok, data } = await submitCustomerToCedar(customer.id);
      if (!ok || !data?.cedar_business_id) {
        setCedarError({ error: data?.error || "Submit failed", missing: data?.missing });
        push(data?.error || "Cedar submit failed", "warn");
        return;
      }
      push(`${customer.name} submitted to Cedar · ID ${data.cedar_business_id}`, "success");
      // Drawer will pick up the new state when the parent customers list refreshes.
      onClose();
    } finally {
      setSubmittingCedar(false);
    }
  };

  const fetchDocs = async () => {
    if (!isRealCustomer) { setDocs([]); return; }
    setLoadingDocs(true);
    const { data, error } = await supabase
      .from("customer_documents")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Fetch docs failed:", error);
    } else {
      setDocs(data || []);
    }
    setLoadingDocs(false);
  };

  useEffect(() => { fetchDocs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [customer?.id]);

  const onFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-pick of same file
    if (!file || !isRealCustomer) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `${customer.id}/${docType}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("kyc-docs").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("customer_documents").insert({
        customer_id: customer.id,
        doc_type: docType,
        storage_path: path,
        file_name: file.name,
        size_bytes: file.size,
        mime_type: file.type,
      });
      if (dbErr) throw dbErr;
      push(`Uploaded · ${DOC_TYPES.find(d => d.id === docType)?.label || docType}`, "success");
      fetchDocs();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Upload failed:", err);
      push("Upload failed — check file size (5MB max) and type (JPG/PNG/WebP/PDF).", "warn");
    } finally {
      setUploading(false);
    }
  };

  const viewDoc = async (doc) => {
    const { data, error } = await supabase.storage.from("kyc-docs").createSignedUrl(doc.storage_path, 60 * 5); // 5 min
    if (error || !data?.signedUrl) {
      push("Couldn't generate view link.", "warn");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const deleteDoc = async (doc) => {
    if (!window.confirm(`Delete this ${DOC_TYPES.find(d => d.id === doc.doc_type)?.label || doc.doc_type}?`)) return;
    const { error: storageErr } = await supabase.storage.from("kyc-docs").remove([doc.storage_path]);
    if (storageErr) {
      // eslint-disable-next-line no-console
      console.error("Storage delete failed:", storageErr);
    }
    const { error: dbErr } = await supabase.from("customer_documents").delete().eq("id", doc.id);
    if (dbErr) {
      push("Couldn't delete — check console.", "warn");
      return;
    }
    push("Document removed.", "success");
    fetchDocs();
  };

  if (!customer) return null;
  return (
    <Drawer open={!!customer} onClose={onClose} title={customer.name}>
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-xl p-5" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-30 blur-3xl" style={{ background: "var(--lime)" }} />
          <div className="relative font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.5)" }}>Lifetime volume</div>
          <div className="relative font-display mt-1 text-4xl font-[500] tracking-tight" style={{ color: "var(--lime)" }}>${customer.volume.toLocaleString()}</div>
          <div className="relative mt-1 font-mono text-[11px]" style={{ color: "rgba(247,245,240,0.6)" }}>{customer.count} transactions · KYC: {kycStatusLabel(customer.kycStatus).label}</div>
        </div>

        {/* Cedar compliance submission panel — only for real customers, not the demo seed */}
        {isRealCustomer && (
          <div className="rounded-xl p-5" style={{ background: "rgba(15,95,63,0.04)", border: "1px solid rgba(15,95,63,0.18)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Cedar compliance partner</div>
                <div className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--muted)" }}>
                  {customer.cedarBusinessId ? `Cedar ID #${customer.cedarBusinessId}` : "Not yet submitted"}
                </div>
              </div>
              {customer.cedarBusinessId && (() => {
                const k = kycStatusLabel(customer.cedarKycStatus);
                return (
                  <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ background: k.bg, color: k.color }}>{k.label}</span>
                );
              })()}
            </div>

            {customer.cedarBusinessId ? (
              <div className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                Customer is registered on Cedar's side. KYC review typically takes 5–15 business days. The status pill above auto-updates when Cedar's compliance team reviews.
              </div>
            ) : (
              <>
                <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
                  Submit this customer to Cedar's compliance team. Fill in the address + business details below; Cedar requires these for KYC review.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Country">
                    <Select value={cedarForm.countryIso} onChange={(e) => setCedarForm({ ...cedarForm, countryIso: e.target.value })}>
                      <option value="NG">Nigeria (NG)</option>
                      <option value="US">United States (US)</option>
                      <option value="GB">United Kingdom (GB)</option>
                      <option value="DE">Germany (DE)</option>
                      <option value="ZA">South Africa (ZA)</option>
                      <option value="GH">Ghana (GH)</option>
                      <option value="KE">Kenya (KE)</option>
                    </Select>
                  </Field>
                  <Field label="State (ISO2, optional)"><Input value={cedarForm.state} onChange={(e) => setCedarForm({ ...cedarForm, state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="LA" /></Field>
                  <Field label="City"><Input value={cedarForm.city} onChange={(e) => setCedarForm({ ...cedarForm, city: e.target.value })} placeholder="Lagos" /></Field>
                  <Field label="Street address"><Input value={cedarForm.address} onChange={(e) => setCedarForm({ ...cedarForm, address: e.target.value })} placeholder="Akanu Ibiam Rd" /></Field>
                  <Field label="Street number"><Input value={cedarForm.streetNumber} onChange={(e) => setCedarForm({ ...cedarForm, streetNumber: e.target.value })} placeholder="12" /></Field>
                  <Field label="ZIP / postal code"><Input value={cedarForm.zipcode} onChange={(e) => setCedarForm({ ...cedarForm, zipcode: e.target.value })} placeholder="100001" /></Field>
                  <Field label="Phone country code"><Input value={cedarForm.contactPhonePrefix} onChange={(e) => setCedarForm({ ...cedarForm, contactPhonePrefix: e.target.value.replace(/[^\d]/g, "") })} placeholder="234" /></Field>
                  <Field label="Industry">
                    <Select value={cedarForm.industry} onChange={(e) => setCedarForm({ ...cedarForm, industry: e.target.value })}>
                      <option value="">Select industry…</option>
                      {CEDAR_INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
                    </Select>
                  </Field>
                  <Field label="Registration number (optional)" full><Input value={cedarForm.localRegNumber} onChange={(e) => setCedarForm({ ...cedarForm, localRegNumber: e.target.value })} placeholder="RC1234567 / EIN / etc." /></Field>
                </div>
                {cedarError && (
                  <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}>
                    <div className="font-semibold">{cedarError.error}</div>
                    {Array.isArray(cedarError.missing) && cedarError.missing.length > 0 && (
                      <div className="mt-1">Missing: {cedarError.missing.join(", ")}</div>
                    )}
                  </div>
                )}
                <PrimaryBtn full onClick={submitToCedar} disabled={submittingCedar} className="mt-4">
                  {submittingCedar ? <><Loader2 size={14} className="spin" /> Submitting…</> : <><Shield size={14} /> Submit to compliance partner</>}
                </PrimaryBtn>
              </>
            )}
          </div>
        )}

        {isRealCustomer && (
          <>
            <div>
              <Label>KYC documents</Label>
              {loadingDocs ? (
                <div className="rounded-xl p-4 text-sm flex items-center gap-2" style={{ background: "var(--bone)", border: "1px solid var(--line)", color: "var(--muted)" }}>
                  <Loader2 size={14} className="spin" /> Loading…
                </div>
              ) : docs.length === 0 ? (
                <div className="rounded-xl p-4 text-sm" style={{ background: "var(--bone)", border: "1px solid var(--line)", color: "var(--muted)" }}>
                  No documents uploaded yet. Use the picker below.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "white", color: "var(--emerald)", border: "1px solid var(--line)" }}>
                        <FileText size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{DOC_TYPES.find(t => t.id === d.doc_type)?.label || d.doc_type}</div>
                        <div className="font-mono text-[10px] mt-0.5 truncate" style={{ color: "var(--muted)" }}>{d.file_name || "—"} · {d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : "—"}</div>
                      </div>
                      <button onClick={() => viewDoc(d)} className="rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition" style={{ background: "var(--ink)", color: "var(--bone)" }}>View</button>
                      <button onClick={() => deleteDoc(d)} className="rounded-lg px-2 py-1 transition" style={{ background: "white", border: "1px solid var(--line)", color: "var(--muted)" }} title="Delete"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--line)" }}>
              <Label>Upload a document</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {DOC_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </Select>
                <label className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer transition flex-shrink-0" style={{ background: "var(--ink)", color: "var(--bone)", opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? <><Loader2 size={14} className="spin" /> Uploading…</> : <><Upload size={14} /> Choose file</>}
                  <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onFilePicked} disabled={uploading} className="hidden" />
                </label>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>JPG / PNG / WebP / PDF · 5 MB max · stored privately, BDC-only access</p>
            </div>
          </>
        )}

        {!isRealCustomer && (
          <div className="rounded-xl p-4 text-sm" style={{ background: "var(--bone)", border: "1px solid var(--line)", color: "var(--muted)" }}>
            Demo customer — sign in and add real customers via the <span className="font-semibold" style={{ color: "var(--ink)" }}>Add customer</span> button to upload KYC documents.
          </div>
        )}

        <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid var(--line)" }}>
          <PrimaryBtn onClick={() => push(`Generating report for ${customer.name}`, "success")} full><FileText size={14} /> Generate report</PrimaryBtn>
          <SecondaryBtn onClick={() => push(`Opening transactions for ${customer.name}`, "info")} full>View transactions</SecondaryBtn>
        </div>
      </div>
    </Drawer>
  );
}

function BDCCompliance() {
  const { push } = useToast();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="font-display text-xl font-semibold">CBN Reporting</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Weekly and monthly returns auto-generated.</p>
        <div className="mt-5 space-y-2">
          <ReportRow label="Weekly Return · Week 16" status="ready" onClick={() => push("Downloading Weekly Return · Week 16", "success")} />
          <ReportRow label="Monthly FX Report · April" status="ready" onClick={() => push("Downloading Monthly FX Report", "success")} />
          <ReportRow label="Suspicious Activity Report · Q1" status="filed" onClick={() => push("Opening filed SAR · Q1", "info")} />
          <ReportRow label="Annual Compliance Attestation" status="draft" onClick={() => push("Opening draft attestation", "info")} />
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-xl font-semibold">Sanctions Screening</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>OFAC, UN, EU, and Nigerian watchlists.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <ComplianceStat label="Screened · 30d" value="312" />
          <ComplianceStat label="Clear hits" value="312" emphasis />
          <ComplianceStat label="Flagged for review" value="0" />
          <ComplianceStat label="False positives" value="2" />
        </div>
        <button onClick={() => push("Running full screen refresh…", "info")} className="mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition" style={{ background: "var(--ink)", color: "var(--bone)" }}>Run full refresh</button>
      </Card>
    </div>
  );
}

function BDCEvidence() {
  const { push } = useToast();
  const packs = SHOW_TRIPLE_A ? [
    { id: "EP-2026Q1-TA", partner: "Triple-A", quarter: "Q1 2026", transactions: 214, status: "ready", due: "Apr 30, 2026" },
    { id: "EP-2026Q1-CD", partner: "Cedar Money", quarter: "Q1 2026", transactions: 98, status: "ready", due: "Apr 30, 2026" },
    { id: "EP-2025Q4-TA", partner: "Triple-A", quarter: "Q4 2025", transactions: 187, status: "submitted", due: "Jan 31, 2026" },
    { id: "EP-2025Q4-CD", partner: "Cedar Money", quarter: "Q4 2025", transactions: 64, status: "submitted", due: "Jan 31, 2026" },
  ] : [
    { id: "EP-2026Q1", partner: PARTNER_DISPLAY_NAME, quarter: "Q1 2026", transactions: 312, status: "ready", due: "Apr 30, 2026" },
    { id: "EP-2025Q4", partner: PARTNER_DISPLAY_NAME, quarter: "Q4 2025", transactions: 251, status: "submitted", due: "Jan 31, 2026" },
  ];
  return (
    <Card padding="none">
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--line)" }}>
        <div><h2 className="font-display text-xl font-semibold">Evidence Packs</h2><p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Quarterly audit bundles for partner rail reviews</p></div>
        <SecondaryBtn onClick={() => push("Generating new evidence pack…", "info")}><Plus size={14} /> New pack</SecondaryBtn>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>{["Pack ID", "Partner", "Quarter", "Transactions", "Due", "Status", ""].map((h, i) => (<th key={i} className={`px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider ${h === "Transactions" ? "text-right" : ""}`} style={{ color: "var(--muted)" }}>{h}</th>))}</tr></thead>
          <tbody>
            {packs.map((p) => (
              <tr key={p.id} className="transition hover:bg-[color:var(--bone)]" style={{ borderBottom: "1px solid var(--line)" }}>
                <td className="px-4 py-3.5 font-mono text-xs font-semibold">{p.id}</td>
                <td className="px-4 py-3.5 font-medium">{p.partner}</td>
                <td className="px-4 py-3.5">{p.quarter}</td>
                <td className="px-4 py-3.5 text-right font-mono">{p.transactions}</td>
                <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--muted)" }}>{p.due}</td>
                <td className="px-4 py-3.5"><EvidenceStatus status={p.status} /></td>
                <td className="px-4 py-3.5"><button onClick={() => push(`Downloading ${p.id}`, "success")} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition" style={{ border: "1px solid var(--line)" }}><Download size={11} /> Pack</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function LPDashboard({ session }) {
  const { push } = useToast();
  const [tab, setTab] = useState("overview");
  const matches = [
    { id: "MT-8823", bdc: "Corporate Exchange BDC", amount: 42000, rate: "₦1,388", ngnReceivable: "₦58,296,000", status: "pending", date: "Today · 13:22" },
    { id: "MT-8819", bdc: "Sevenlocks BDC", amount: 18000, rate: "₦1,388", ngnReceivable: "₦24,984,000", status: "settled", date: "Today · 11:02" },
    { id: "MT-8815", bdc: "Bergpoint BDC", amount: 25000, rate: "₦1,386", ngnReceivable: "₦34,650,000", status: "settled", date: "Yesterday" },
    { id: "MT-8811", bdc: "Dula Global BDC", amount: 60000, rate: "₦1,390", ngnReceivable: "₦83,400,000", status: "settled", date: "Apr 18" },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="rise">
          <div className="flex items-center gap-2">
            <SectionEyebrow>Liquidity Provider portal</SectionEyebrow>
            <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}>Phase 2</span>
          </div>
          <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-[40px]">{session.name || "K. Asante"}</h1>
          <div className="mt-2 font-mono text-xs" style={{ color: "var(--muted)" }}>LP-2841 · TRC-20 verified · ★ 4.9</div>
        </div>
      </div>
      <div className="mb-6 rounded-2xl p-5" style={{ background: "rgba(212,168,44,0.08)", border: "1px solid rgba(212,168,44,0.3)" }}>
        <div className="flex items-start gap-3">
          <Shield size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--amber)" }} />
          <p className="text-xs" style={{ color: "var(--ink)" }}><span className="font-semibold">XaePay is not a counterparty.</span> You sell USDT directly to BDC wallets. XaePay only matches and records — never custodies or intermediates funds.</p>
        </div>
      </div>
      <div className="mb-6 flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--line)" }}>
        {[{ id: "overview", label: "Overview" }, { id: "matches", label: "Matches" }, { id: "inventory", label: "Inventory" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="relative whitespace-nowrap px-4 py-3 text-sm font-medium transition" style={{ color: tab === t.id ? "var(--ink)" : "var(--muted)" }}>
            {t.label}{tab === t.id && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px]" style={{ background: "var(--ink)" }} />}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="USDT listed" value="180K" change="TRC-20 verified" />
              <StatCard label="Matched · 30d" value="$145K" change="+$24K vs prior" positive />
              <StatCard label="Naira received" value="₦223M" change="8 settlements" positive />
            </div>
            <Card>
              <h2 className="font-display text-xl font-semibold">Recent matches</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>BDCs sourcing USDT from your wallet.</p>
              <div className="mt-5 space-y-2.5">
                {matches.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-3 rounded-xl p-4" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{m.bdc}</div>
                      <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{m.id} · {m.date} · rate {m.rate}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono text-sm font-semibold">${m.amount.toLocaleString()}</div>
                      <div className="font-mono text-[10px] mt-0.5" style={{ color: m.status === "settled" ? "var(--emerald)" : "#92400e" }}>{m.status}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setTab("matches")} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold transition hover:gap-2" style={{ color: "var(--emerald)" }}>View all matches <ChevronRight size={14} /></button>
            </Card>
          </div>
          <div className="space-y-4 lg:col-span-4">
            <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "var(--ink)", color: "var(--bone)" }}>
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: "var(--lime)" }} />
              <div className="relative mb-3 flex items-center gap-2"><TrendingUp size={14} style={{ color: "var(--lime)" }} /><span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.7)" }}>Your rate</span></div>
              <div className="relative font-display text-5xl font-[500] tracking-tight" style={{ color: "var(--lime)" }}>₦1,388</div>
              <div className="relative mt-1.5 font-mono text-[10px]" style={{ color: "rgba(247,245,240,0.5)" }}>USDT/NGN · best among active LPs</div>
              <button onClick={() => push("Opening rate editor…", "info")} className="relative mt-4 w-full rounded-lg px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition" style={{ background: "rgba(197,242,74,0.1)", color: "var(--lime)" }}>Adjust rate</button>
            </div>
            <Card>
              <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><Wallet size={14} /></div><span className="text-sm font-semibold">Wallets</span></div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between"><span className="font-mono" style={{ color: "var(--muted)" }}>TRC-20</span><span className="font-mono font-semibold">180,000 USDT</span></div>
                <div className="flex items-center justify-between" style={{ color: "var(--muted)" }}><span className="font-mono">ERC-20</span><span className="font-mono">Not configured</span></div>
                <div className="flex items-center justify-between" style={{ color: "var(--muted)" }}><span className="font-mono">BEP-20</span><span className="font-mono">Not configured</span></div>
              </div>
              <button onClick={() => push("Opening chain setup…", "info")} className="mt-4 w-full rounded-lg px-3 py-2 text-sm font-semibold transition" style={{ border: "1px solid var(--line)" }}>Add chain</button>
            </Card>
          </div>
        </div>
      )}
      {tab === "matches" && (
        <Card padding="none">
          <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="text-sm font-semibold">{matches.length} matches</div>
            <SecondaryBtn onClick={() => push("Exporting matches…", "success")}><Download size={14} /> Export</SecondaryBtn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>{["Match ID", "BDC", "USDT", "Rate", "Naira receivable", "Status", "Date"].map((h, i) => (<th key={i} className={`px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider ${["USDT", "Naira receivable"].includes(h) ? "text-right" : ""}`} style={{ color: "var(--muted)" }}>{h}</th>))}</tr></thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.id} className="transition hover:bg-[color:var(--bone)]" style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold">{m.id}</td>
                    <td className="px-4 py-3.5 font-medium">{m.bdc}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold">${m.amount.toLocaleString()}</td>
                    <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--emerald)" }}>{m.rate}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold">{m.ngnReceivable}</td>
                    <td className="px-4 py-3.5"><StatusPill status={m.status === "settled" ? "completed" : "pending"} /></td>
                    <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--muted)" }}>{m.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {tab === "inventory" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-xl font-semibold">USDT inventory</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Listed balance available for matching.</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl p-4" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
                <div><div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>TRC-20 · Tron</div><div className="font-mono text-sm font-semibold mt-0.5">T...x9Kq</div></div>
                <div className="text-right"><div className="font-mono text-lg font-semibold">180,000</div><div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>USDT listed</div></div>
              </div>
            </div>
            <button onClick={() => push("Opening inventory top-up…", "info")} className="mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition" style={{ background: "var(--ink)", color: "var(--bone)" }}>Top up inventory</button>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-semibold">Settlement bank</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Where naira settlements land.</p>
            <div className="mt-5 rounded-xl p-4" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
              <div className="flex items-center justify-between">
                <div><div className="text-sm font-semibold">GTBank</div><div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>•••• 4821</div></div>
                <CheckCircle2 size={16} style={{ color: "var(--emerald)" }} />
              </div>
            </div>
            <button onClick={() => push("Opening bank settings…", "info")} className="mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition" style={{ border: "1px solid var(--line)" }}>Change bank</button>
          </Card>
        </div>
      )}
    </div>
  );
}

function DiasporaOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", email: "", phone: "", country: "United States", currency: "USD", idType: "Passport", idNumber: "", idVerified: false, address: "", addressVerified: false, sofSigned: false, preferredRail: "auto" });
  const { push } = useToast();
  const [verifying, setVerifying] = useState(false);
  const verifyID = () => {
    if (!data.idNumber) return;
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setData({ ...data, idVerified: true, name: data.name || "Chioma Nwosu" }); push("ID verified · sanctions screening clear", "success"); }, 1500);
  };
  return (
    <div className="rise">
      <SectionEyebrow>Diaspora sender onboarding</SectionEyebrow>
      <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-4xl">Send to Nigeria and Africa.</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Five steps. Pay vendors, family, school fees, property, medical — any Nigerian or African account. Rails licensed in your country.</p>
      <div className="mt-6 rounded-xl p-4" style={{ background: "rgba(15,95,63,0.06)", border: "1px solid rgba(15,95,63,0.2)" }}>
        <div className="flex items-start gap-2">
          <Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--emerald)" }} />
          <p className="text-xs" style={{ color: "var(--ink)" }}><span className="font-semibold">Licensed rails.</span> Triple-A (MAS Singapore) handles USD, GBP, EUR, SGD. Cedar Money handles US-to-Nigeria stablecoin. XaePay never holds your money.</p>
        </div>
      </div>
      <div className="mt-8"><OnboardingStepper step={step} steps={["You", "ID verify", "Address", "Source", "Done"]} tiers={["T0", "T1", "T2", "T3", ""]} /></div>
      <div className="mt-6">
        {step === 1 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Tell us about you</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Your identity for sending-country AML compliance.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name (as on ID)" full><Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Chioma Nwosu" /></Field>
              <Field label="Email"><Input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="you@example.com" /></Field>
              <Field label="Phone (WhatsApp)"><Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="+1 415 123 4567" /></Field>
              <Field label="Country of residence"><Select value={data.country} onChange={(e) => setData({ ...data, country: e.target.value, currency: e.target.value === "United Kingdom" ? "GBP" : e.target.value === "Germany" || e.target.value === "France" ? "EUR" : e.target.value === "Canada" ? "CAD" : "USD" })}>
                <option>United States</option><option>United Kingdom</option><option>Canada</option><option>Germany</option><option>France</option><option>UAE</option><option>Australia</option><option>Other</option>
              </Select></Field>
              <Field label="Sending currency"><Select value={data.currency} onChange={(e) => setData({ ...data, currency: e.target.value })}>
                <option>USD</option><option>GBP</option><option>EUR</option><option>CAD</option><option>AUD</option>
              </Select></Field>
            </div>
            <TierUnlockNote tier={1} description="account created, you can send up to $5,000" />
            <div className="mt-6 flex justify-end"><PrimaryBtn onClick={() => setStep(2)} disabled={!data.name || !data.email}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 2 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">ID verification</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Document and selfie — required by the sending-country rail.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="ID type"><Select value={data.idType} onChange={(e) => setData({ ...data, idType: e.target.value })}>
                <option>Passport</option><option>Driver's License</option><option>National ID</option>
              </Select></Field>
              <Field label="ID number"><Input value={data.idNumber} onChange={(e) => setData({ ...data, idNumber: e.target.value })} placeholder="P12345678" /></Field>
            </div>
            <div className="mt-4">
              <button onClick={verifyID} disabled={verifying || !data.idNumber} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50" style={{ background: "var(--ink)", color: "var(--bone)" }}>
                {verifying ? <><Loader2 size={14} className="spin" /> Verifying via rail partner</> : <><Search size={14} /> Verify ID + run sanctions screen</>}
              </button>
            </div>
            {data.idVerified && (
              <div className="mt-5 rise rounded-xl p-5" style={{ background: "var(--ink)", color: "var(--bone)" }}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={14} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
                  <div className="flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.6)" }}>Identity verified · sanctions clear</div>
                    <div className="font-display mt-1 text-lg font-semibold">{data.name}</div>
                    <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                      <div><span style={{ color: "rgba(247,245,240,0.5)" }}>ID:</span> {data.idType}</div>
                      <div><span style={{ color: "rgba(247,245,240,0.5)" }}>Country:</span> {data.country}</div>
                      <div><span style={{ color: "rgba(247,245,240,0.5)" }}>Rail partner:</span> Triple-A</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <UploadRow label="Selfie with ID" sublabel="WhatsApp upload available · or browse files" done={false} onClick={() => push("Send to +234 700 XAE PAY or upload here", "info")} />
            <TierUnlockNote tier={2} description="ID verified. $5K – $50K corridor unlocked." />
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(1)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(3)} disabled={!data.idVerified}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Address verification</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Utility bill, bank statement, or tenancy agreement (within 90 days).</p>
            <div className="mt-6 space-y-4">
              <Field label="Residential address" full><Input value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} placeholder="123 Main St, San Francisco, CA 94103" /></Field>
              <UploadRow label="Proof of address document" sublabel="PDF or image · WhatsApp upload available" done={data.addressVerified} onClick={() => { setData({ ...data, addressVerified: true }); push("Proof of address accepted", "success"); }} />
            </div>
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(2)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(4)} disabled={!data.address || !data.addressVerified}>Continue <ArrowRight size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 4 && (
          <Card>
            <h2 className="font-display text-xl font-semibold">Source of funds</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Required above $10K aggregate or for higher-tier sending.</p>
            <div className="mt-6 space-y-2">
              <UploadRow label="Source of funds declaration" sublabel="One-page — salary, savings, business income, investment proceeds" done={data.sofSigned} onClick={() => { setData({ ...data, sofSigned: true }); push("Source of funds signed", "success"); }} />
            </div>
            <div className="mt-6 rounded-xl p-4" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
              <Label>Preferred rail (optional)</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                <RoleBtn active={data.preferredRail === "auto"} onClick={() => setData({ ...data, preferredRail: "auto" })}>Auto-route</RoleBtn>
                <RoleBtn active={data.preferredRail === "triple-a"} onClick={() => setData({ ...data, preferredRail: "triple-a" })}>Triple-A fiat</RoleBtn>
                <RoleBtn active={data.preferredRail === "cedar"} onClick={() => setData({ ...data, preferredRail: "cedar" })}>Cedar stablecoin</RoleBtn>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>Auto picks cheapest per-transaction and discloses choice</p>
            </div>
            <TierUnlockNote tier={3} description="full diaspora tier · unlimited monthly volume, all corridors" />
            <div className="mt-6 flex justify-between"><SecondaryBtn onClick={() => setStep(3)}>Back</SecondaryBtn><PrimaryBtn onClick={() => setStep(5)} disabled={!data.sofSigned}>Finish <Sparkles size={14} /></PrimaryBtn></div>
          </Card>
        )}
        {step === 5 && (
          <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--bone)" }}>
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--lime), transparent)" }} />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={24} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
              <h2 className="font-display mt-5 text-[28px] font-[450] tracking-tight">You're set up.</h2>
              <p className="mt-2 text-sm" style={{ color: "rgba(247,245,240,0.7)" }}>Send {data.currency} to any Nigerian or African account. Tier 3 unlocked — no monthly limit.</p>
              <button onClick={() => onComplete({ type: "diaspora", tier: 3, name: data.name, company: null, country: data.country, currency: data.currency })} className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition glow-lime" style={{ background: "var(--lime)", color: "var(--ink)" }}>Send your first payment <ArrowRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DiasporaApp({ session }) {
  const [step, setStep] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [senderType, setSenderType] = useState("individual"); // individual | business
  const currency = session.currency || "USD";
  const [formData, setFormData] = useState({
    amount: "2500", sendCurrency: currency, recipientType: "vendor",
    recipientName: "Lagos Build & Supply Ltd", recipientBank: "GTBank",
    recipientAccount: "0123456789", recipientCountry: "Nigeria",
    purpose: "Construction materials · Q2", documentUploaded: false, rail: "auto",
  });
  return (
    <>
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="rise">
          <SectionEyebrow>Overseas Operator portal · foreign currency → NGN</SectionEyebrow>
          <h1 className="font-display mt-3 text-3xl font-[450] tracking-tight sm:text-[40px]">{senderType === "business" ? "Pay into Nigeria from overseas" : "Send to Nigeria"}</h1>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <TierBadge tier={session.tier ?? 3} />
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{session.country || "United States"} · {currency}</span>
          </div>
        </div>
        <button onClick={() => setHistoryOpen(true)} className="rise inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-[color:var(--bone-2)]" style={{ background: "white", border: "1px solid var(--line)", animationDelay: "0.05s" }}><History size={14} /> History</button>
      </div>

      <div className="mb-8 rise rounded-2xl p-4 flex items-center gap-4 flex-wrap" style={{ background: "var(--bone)", border: "1px solid var(--line)", animationDelay: "0.05s" }}>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>I am sending as</div>
          <Select value={senderType} onChange={(e) => setSenderType(e.target.value)}>
            <option value="individual">An individual (family, school, vendor, property)</option>
            <option value="business">A business (payroll, supplier, distributor, services)</option>
          </Select>
        </div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {senderType === "individual" ? "Personal sends from abroad — typically family support, school fees, vendor payments, property." : "Business sends from abroad — payroll for Nigerian staff, distributor settlements, supplier invoices, recurring services."}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Stepper step={step} />
          <div className="mt-6 rise" style={{ animationDelay: "0.1s" }}>
            {step === 1 && <DiasporaStepIntake data={formData} setData={setFormData} senderType={senderType} onNext={() => setStep(2)} />}
            {step === 2 && <DiasporaStepCompliance onNext={() => setStep(3)} onBack={() => setStep(1)} data={formData} senderType={senderType} />}
            {step === 3 && <DiasporaStepReview data={formData} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
            {step === 4 && <DiasporaStepConfirmed data={formData} onNew={() => setStep(1)} onHistory={() => setHistoryOpen(true)} />}
          </div>
        </div>
        <aside className="lg:col-span-4"><DiasporaSidebar /></aside>
      </div>
    </div>
    <DiasporaHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} currency={currency} />
    </>
  );
}

function DiasporaStepIntake({ data, setData, senderType = "individual", onNext }) {
  const { push } = useToast();
  const handleUpload = () => { setData({ ...data, documentUploaded: true }); push("Document uploaded · parsing recipient metadata…", "info"); };
  const purposeOptions = senderType === "business"
    ? [
        { id: "vendor", label: "Supplier invoice", placeholder: "Lagos Build & Supply Ltd" },
        { id: "payroll", label: "Payroll", placeholder: "Local employee — staff name or batch ref" },
        { id: "distributor", label: "Distributor settlement", placeholder: "Distributor company name" },
        { id: "services", label: "Services / contractor", placeholder: "Vendor / consultant name" },
        { id: "property", label: "Property / lease", placeholder: "Landlord or estate company" },
        { id: "other", label: "Other business", placeholder: "Recipient business name" },
      ]
    : [
        { id: "vendor", label: "Vendor / supplier", placeholder: "Lagos Build & Supply Ltd" },
        { id: "family", label: "Family support", placeholder: "Recipient full name" },
        { id: "education", label: "Education", placeholder: "School / accountant office" },
        { id: "medical", label: "Medical", placeholder: "Hospital / clinic name" },
        { id: "property", label: "Property / rent", placeholder: "Landlord / estate company" },
        { id: "individual", label: "Other individual", placeholder: "Recipient full name" },
      ];
  // If current recipientType isn't in the new option list (e.g. user switched sender type), reset to first option
  useEffect(() => {
    if (!purposeOptions.some((p) => p.id === data.recipientType)) {
      setData({ ...data, recipientType: purposeOptions[0].id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senderType]);
  const currentOption = purposeOptions.find((p) => p.id === data.recipientType) || purposeOptions[0];
  const purposeLabel = currentOption.label;
  const recipientPlaceholder = currentOption.placeholder;
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">{senderType === "business" ? "Business payment details" : "Payment details"}</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{senderType === "business" ? "Who you're paying in Nigeria and what for. Each purpose has its own compliance bundle." : "Who you're paying and why. Each purpose has its own document bundle."}</p>
      <div className="mt-6">
        <Label>{senderType === "business" ? "Type of business payment" : "Purpose of payment"}</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {purposeOptions.map((p) => (<RoleBtn key={p.id} active={data.recipientType === p.id} onClick={() => setData({ ...data, recipientType: p.id })}>{p.label}</RoleBtn>))}
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={`Amount (${data.sendCurrency})`}>
          <div className="focus-ring flex items-center rounded-xl transition" style={{ background: "white", border: "1px solid var(--line)" }}>
            <span className="pl-3.5 text-sm font-mono" style={{ color: "var(--muted)" }}>{data.sendCurrency === "USD" ? "$" : data.sendCurrency === "GBP" ? "£" : data.sendCurrency === "EUR" ? "€" : data.sendCurrency}</span>
            <input type="text" value={data.amount} onChange={(e) => setData({ ...data, amount: e.target.value })} className="w-full bg-transparent px-2 py-3 text-sm outline-none font-mono" />
          </div>
        </Field>
        <Field label="Recipient country"><Select value={data.recipientCountry} onChange={(e) => setData({ ...data, recipientCountry: e.target.value })}>
          <option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>South Africa</option><option>Senegal</option><option>Côte d'Ivoire</option>
        </Select></Field>
        <Field label={senderType === "business" ? "Recipient (company or person)" : "Recipient name"} full><Input value={data.recipientName} onChange={(e) => setData({ ...data, recipientName: e.target.value })} placeholder={recipientPlaceholder} /></Field>
        <Field label="Recipient bank"><Select value={data.recipientBank} onChange={(e) => setData({ ...data, recipientBank: e.target.value })}>
          <option>GTBank</option><option>Access Bank</option><option>Zenith Bank</option><option>UBA</option><option>First Bank</option><option>Kuda</option><option>Opay</option>
        </Select></Field>
        <Field label="Account number"><Input value={data.recipientAccount} onChange={(e) => setData({ ...data, recipientAccount: e.target.value })} /></Field>
        <Field label="Payment memo" full><Input value={data.purpose} onChange={(e) => setData({ ...data, purpose: e.target.value })} placeholder={purposeLabel} /></Field>
      </div>
      <div className="mt-6">
        <Label>Rail preference</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <RoleBtn active={data.rail === "auto"} onClick={() => setData({ ...data, rail: "auto" })}>Auto-route (recommended)</RoleBtn>
          <RoleBtn active={data.rail === "cedar"} onClick={() => setData({ ...data, rail: "cedar" })}>Force Cedar stablecoin</RoleBtn>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{data.rail === "auto" ? "Triple-A for larger, Cedar stablecoin for sub-$10K" : "Override: Cedar-only routing"}</p>
      </div>
      <div className="mt-6">
        <Label>{data.recipientType === "vendor" ? "Invoice or purchase order" : data.recipientType === "education" ? "School letter or invoice" : data.recipientType === "property" ? "Lease or purchase agreement" : data.recipientType === "medical" ? "Medical invoice" : "Supporting document (optional)"}</Label>
        <button type="button" onClick={handleUpload} className="w-full rounded-xl p-7 text-center transition" style={data.documentUploaded ? { background: "var(--bone-2)", border: "1.5px dashed var(--emerald)" } : { background: "white", border: "1.5px dashed var(--line)" }}>
          {data.documentUploaded ? (<><CheckCircle2 size={22} className="mx-auto" style={{ color: "var(--emerald)" }} strokeWidth={2} /><p className="mt-2 font-mono text-sm font-medium" style={{ color: "var(--emerald)" }}>document_{data.recipientType}_0419.pdf</p><p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Click to replace</p></>) : (<><Upload size={22} className="mx-auto" style={{ color: "var(--muted)" }} strokeWidth={1.75} /><p className="mt-2.5 text-sm" style={{ color: "var(--ink)" }}>Drop PDF or image, or <span className="font-medium underline" style={{ color: "var(--emerald)" }}>browse files</span></p><p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Or send via WhatsApp to +234 700 XAE PAY</p></>)}
        </button>
      </div>
      <div className="mt-6 flex justify-end"><PrimaryBtn onClick={onNext}>Run compliance checks <ArrowRight size={14} /></PrimaryBtn></div>
    </Card>
  );
}

function DiasporaStepCompliance({ onNext, onBack, data }) {
  const checks = [
    { label: "Sender identity & sanctions", status: "pass", detail: "Triple-A AML clear · OFAC, UN, FinCEN" },
    { label: "Recipient account match", status: "pass", detail: `${data.recipientBank} returned name match for "${data.recipientName}"` },
    { label: "Purpose documentation", status: "pass", detail: `${data.recipientType === "vendor" ? "Vendor invoice" : "Supporting document"} received and parsed` },
    { label: "Amount threshold check", status: "pass", detail: `${data.sendCurrency} ${data.amount} within Tier 3 limits` },
    { label: "Recipient-side AML", status: "pass", detail: "Nigerian bank sanctions screen clear" },
    { label: "Rail availability", status: "pass", detail: "Cedar stablecoin selected · 23 bps below Triple-A fiat" },
    { label: "CBN inbound disclosure", status: "pass", detail: "Inbound remittance category assigned · no Form M required" },
  ];
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-display text-xl font-semibold">Compliance checks</h2><p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Seven agents, across sending and receiving sides.</p></div>
        <div className="rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ background: "var(--emerald)", color: "var(--lime)" }}>all clean</div>
      </div>
      <div className="mt-6 space-y-2">
        {checks.map((c, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-4 rise" style={{ background: "var(--bone)", border: "1px solid var(--line)", animationDelay: `${i * 0.06}s` }}>
            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "var(--emerald)", color: "var(--lime)" }}><CheckCircle2 size={12} strokeWidth={2.5} /></div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium">{c.label}</div><div className="text-xs" style={{ color: "var(--muted)" }}>{c.detail}</div></div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row"><SecondaryBtn onClick={onBack}>Back</SecondaryBtn><PrimaryBtn onClick={onNext}>Review payment <ArrowRight size={14} /></PrimaryBtn></div>
    </Card>
  );
}

function DiasporaStepReview({ data, onNext, onBack }) {
  const amount = parseFloat(data.amount || 0);
  const xaeFee = Math.max(4, amount * 0.005);
  const fxSpread = amount * 0.006;
  const total = amount + xaeFee + fxSpread;
  const rateMap = { USD: 1395, GBP: 1852, EUR: 1602, CAD: 996, AUD: 972 };
  const rate = rateMap[data.sendCurrency] || 1395;
  const ngnOut = Math.round(amount * rate).toLocaleString();
  const railName = data.rail === "cedar" ? "Cedar Money stablecoin" : "Cedar Money stablecoin (auto-selected)";
  const symbol = data.sendCurrency === "USD" ? "$" : data.sendCurrency === "GBP" ? "£" : data.sendCurrency === "EUR" ? "€" : `${data.sendCurrency} `;
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">Review & confirm</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Rate locked 4 minutes. Recipient gets the exact naira amount shown.</p>
      <div className="mt-6 rounded-xl p-4" style={{ background: "var(--ink)", color: "var(--bone)" }}>
        <div className="flex items-start gap-3"><Layers size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--lime)" }} />
          <div className="flex-1 text-xs">
            <div className="font-mono uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.6)" }}>Selected rail</div>
            <div className="font-display text-base font-semibold mt-0.5">{railName}</div>
            <p className="mt-1 leading-relaxed" style={{ color: "rgba(247,245,240,0.65)" }}>{data.sendCurrency} → USDT on Cedar → BDC (Corporate Exchange) → ₦ credited directly to {data.recipientName} at {data.recipientBank}.</p>
          </div>
        </div>
      </div>
      <dl className="mt-4 overflow-hidden rounded-xl" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
        <Row label="Recipient" value={data.recipientName} sub={`${data.recipientBank} · ${data.recipientAccount}`} />
        <Row label="Purpose" value={data.purpose} sub={data.recipientType} />
        <Row label="You send" value={`${symbol}${amount.toLocaleString()}`} sub={data.sendCurrency} mono />
        <Row label="FX spread" value={`${symbol}${fxSpread.toFixed(2)}`} sub="0.60% · disclosed" mono />
        <Row label="XaePay fee" value={`${symbol}${xaeFee.toFixed(2)}`} sub="0.50% · software & compliance" mono />
        <Row label="Rate" value={`1 ${data.sendCurrency} = ₦${rate.toLocaleString()}`} sub="Locked 4 min" mono />
        <div className="flex items-center justify-between p-4" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <div className="text-sm font-medium">Recipient receives</div>
          <div className="font-display text-xl font-semibold" style={{ color: "var(--lime)" }}>₦{ngnOut}</div>
        </div>
        <div className="flex items-center justify-between p-4" style={{ background: "var(--bone-2)" }}>
          <div className="text-sm font-medium">Total you pay</div>
          <div className="font-display text-base font-semibold">{symbol}{total.toFixed(2)}</div>
        </div>
      </dl>
      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row"><SecondaryBtn onClick={onBack}>Back</SecondaryBtn><PrimaryBtn onClick={onNext}>Execute payment <Send size={14} /></PrimaryBtn></div>
    </Card>
  );
}

function DiasporaStepConfirmed({ data, onNew, onHistory }) {
  const { push } = useToast();
  const download = (name) => push(`${name} · download started`, "success");
  const openWhatsApp = () => { push("Opening WhatsApp…", "info"); window.open(WHATSAPP_URL_US, "_blank"); };
  const amount = parseFloat(data.amount || 0);
  const rateMap = { USD: 1395, GBP: 1852, EUR: 1602, CAD: 996, AUD: 972 };
  const rate = rateMap[data.sendCurrency] || 1395;
  const ngnOut = Math.round(amount * rate).toLocaleString();
  const docs = [
    { icon: Receipt, title: "Payment receipt", detail: "Sender-side confirmation" },
    { icon: FileText, title: "Purpose documentation", detail: `${data.recipientType} · supporting docs` },
    { icon: Send, title: "Cedar settlement reference", detail: "Stablecoin leg · T+0" },
    { icon: Package, title: "Recipient advice", detail: `${data.recipientBank} credit notification` },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl p-8" style={{ background: "var(--ink)", color: "var(--bone)" }}>
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--lime), transparent)" }} />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--lime)" }}><CheckCircle2 size={24} strokeWidth={2.5} style={{ color: "var(--ink)" }} /></div>
      <h2 className="font-display relative mt-5 text-[28px] font-[450] tracking-tight">Payment sent.</h2>
      <p className="relative mt-2 text-sm" style={{ color: "rgba(247,245,240,0.7)" }}>₦{ngnOut} credited to {data.recipientName} at {data.recipientBank}. Typically arrives within 5 minutes.</p>
      <div className="relative mt-6 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.6)" }}>Audit trail</div>
        <div className="mt-2 space-y-1.5 text-xs font-mono" style={{ color: "rgba(247,245,240,0.85)" }}>
          <div>1. You → Triple-A ← {data.sendCurrency} {amount.toLocaleString()}</div>
          <div>2. Triple-A → Cedar Money ← {amount.toLocaleString()} USDT</div>
          <div>3. Cedar Money → BDC ← ₦{ngnOut} equivalent</div>
          <div>4. BDC → {data.recipientBank} → {data.recipientName} (₦{ngnOut})</div>
        </div>
      </div>
      <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
        {docs.map((d, i) => (
          <button key={i} onClick={() => download(d.title)} className="flex items-start gap-3 rounded-xl p-4 text-left transition hover:bg-white/5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(197,242,74,0.1)", color: "var(--lime)" }}><d.icon size={15} /></div>
            <div className="min-w-0"><div className="text-sm font-medium" style={{ color: "var(--bone)" }}>{d.title}</div><div className="font-mono text-[10px] mt-0.5" style={{ color: "rgba(247,245,240,0.5)" }}>{d.detail}</div></div>
          </button>
        ))}
      </div>
      <div className="relative mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button onClick={() => download("Payment pack (ZIP)")} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition glow-lime" style={{ background: "var(--lime)", color: "var(--ink)" }}><Download size={14} /> Download pack</button>
        <button onClick={onHistory} className="rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>View history</button>
        <button onClick={onNew} className="rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>New payment</button>
        <button onClick={openWhatsApp} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.15)" }}><MessageCircle size={14} /> Message support</button>
      </div>
    </div>
  );
}

function DiasporaSidebar() {
  const { push } = useToast();
  const openWhatsApp = () => { push("Opening WhatsApp…", "info"); window.open(WHATSAPP_URL_US, "_blank"); };
  return (
    <div className="space-y-4 rise" style={{ animationDelay: "0.15s" }}>
      <Card>
        <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><MessageCircle size={14} /></div><span className="text-sm font-semibold">Send via WhatsApp</span></div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>Send the recipient details to +234 700 XAE PAY. We handle the rest.</p>
        <button onClick={openWhatsApp} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-[color:var(--bone-2)]" style={{ border: "1px solid var(--emerald)", color: "var(--emerald)" }}><ExternalLink size={14} /> Open WhatsApp</button>
      </Card>
      <Card>
        <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><Shield size={14} /></div><span className="text-sm font-semibold">How this works</span></div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>Triple-A holds your funds on the sending side under MAS license. Cedar Money bridges via stablecoin. A Nigerian BDC credits the recipient. Full paper trail, zero custody by XaePay.</p>
      </Card>
      <Card>
        <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><TrendingUp size={14} /></div><span className="text-sm font-semibold">Today's rates</span></div>
        <div className="space-y-1.5 text-sm font-mono">
          <div className="flex items-center justify-between"><span style={{ color: "var(--muted)" }}>USD → NGN</span><span className="font-semibold">1,395</span></div>
          <div className="flex items-center justify-between"><span style={{ color: "var(--muted)" }}>GBP → NGN</span><span className="font-semibold">1,852</span></div>
          <div className="flex items-center justify-between"><span style={{ color: "var(--muted)" }}>EUR → NGN</span><span className="font-semibold">1,602</span></div>
          <div className="flex items-center justify-between"><span style={{ color: "var(--muted)" }}>CAD → NGN</span><span className="font-semibold">996</span></div>
        </div>
      </Card>
    </div>
  );
}

function DiasporaHistoryDrawer({ open, onClose, currency }) {
  const { push } = useToast();
  const symbol = currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : `${currency} `;
  const history = [
    { id: "XD-4421", recipient: "Lagos Build & Supply Ltd", purpose: "Vendor", amount: 2500, ngn: "₦3,487,500", status: "Delivered", date: "Today · 09:44" },
    { id: "XD-4398", recipient: "Adeola Nwosu (Mother)", purpose: "Family support", amount: 800, ngn: "₦1,116,000", status: "Delivered", date: "Apr 15 · 07:18" },
    { id: "XD-4362", recipient: "Unilag Accountant Office", purpose: "Education", amount: 1400, ngn: "₦1,953,000", status: "Delivered", date: "Apr 02 · 14:07" },
    { id: "XD-4321", recipient: "Victoria Garden Estates", purpose: "Property", amount: 12000, ngn: "₦16,740,000", status: "Delivered", date: "Mar 24 · 11:32" },
    { id: "XD-4288", recipient: "St. Luke's Medical Centre", purpose: "Medical", amount: 3200, ngn: "₦4,464,000", status: "Delivered", date: "Mar 18 · 15:21" },
  ];
  return (
    <Drawer open={open} onClose={onClose} title="Send history">
      <div className="space-y-2">
        {history.map((h) => (
          <button key={h.id} onClick={() => push(`Opening ${h.id} details`, "info")} className="w-full rounded-xl p-4 text-left transition hover:border-[color:var(--emerald)]" style={{ background: "white", border: "1px solid var(--line)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><div className="text-sm font-medium truncate">{h.recipient}</div><div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{h.date} · {h.id} · {h.purpose}</div></div>
              <div className="text-right flex-shrink-0"><div className="font-mono text-sm font-semibold">{symbol}{h.amount.toLocaleString()}</div><div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--emerald)" }}>{h.ngn}</div></div>
            </div>
          </button>
        ))}
      </div>
    </Drawer>
  );
}

function SectionEyebrow({ children }) {
  return <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--emerald)" }}>{children}</div>;
}

function Card({ children, padding = "default" }) {
  const p = padding === "none" ? "" : "p-6";
  return <div className={`card-soft rounded-2xl bg-white ${p}`} style={{ border: "1px solid var(--line)" }}>{children}</div>;
}

function Label({ children }) {
  return <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{children}</label>;
}

function Input(props) {
  return (
    <div className="focus-ring flex items-center rounded-xl transition" style={{ background: "white", border: "1px solid var(--line)" }}>
      <input {...props} className="w-full bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-stone-400" />
    </div>
  );
}

function Select({ children, small, ...props }) {
  return (
    <div className="focus-ring rounded-xl transition" style={{ background: "white", border: "1px solid var(--line)" }}>
      <select {...props} className={`w-full bg-transparent text-sm outline-none ${small ? "px-3 py-2" : "px-3.5 py-3"}`}>{children}</select>
    </div>
  );
}

function Field({ label, children, full }) {
  return <div className={full ? "sm:col-span-2" : ""}><Label>{label}</Label>{children}</div>;
}

function PrimaryBtn({ children, onClick, type = "button", full, disabled }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${full ? "w-full" : ""}`} style={{ background: "var(--ink)", color: "var(--bone)" }}>{children}</button>;
}

function SecondaryBtn({ children, onClick, type = "button", full, disabled }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${full ? "w-full" : ""}`} style={{ background: "white", border: "1px solid var(--line)", color: "var(--ink)" }}>{children}</button>;
}

function RoleBtn({ children, active, onClick }) {
  return <button type="button" onClick={onClick} className="rounded-xl px-3 py-2.5 text-sm font-medium transition" style={active ? { background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)" } : { background: "white", color: "var(--ink)", border: "1px solid var(--line)" }}>{children}</button>;
}

function Row({ label, value, sub, mono }) {
  return (
    <div className="flex items-start justify-between p-4" style={{ borderBottom: "1px solid var(--line)" }}>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</div>
        <div className={`mt-0.5 text-sm font-medium truncate ${mono ? "font-mono" : ""}`}>{value}</div>
      </div>
      {sub && <div className="ml-3 text-right flex-shrink-0"><div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{sub}</div></div>}
    </div>
  );
}

function StatCard({ label, value, change, sub, positive }) {
  return (
    <div className="card-soft rounded-2xl bg-white p-5" style={{ border: "1px solid var(--line)" }}>
      <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="font-display mt-2 text-3xl font-[500] tracking-tight">{value}</div>
      {(change || sub) && <div className="mt-1.5 font-mono text-[10px]" style={{ color: positive ? "var(--emerald)" : "var(--muted)" }}>{change || sub}</div>}
    </div>
  );
}

function PendingRow({ customer, supplier, amount, flag, onApprove }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl p-4" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{customer}</div>
        <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{supplier} · {flag}</div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="font-mono text-sm font-semibold">{amount}</div>
        <button onClick={onApprove} className="rounded-lg px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition" style={{ background: "var(--ink)", color: "var(--lime)" }}>Approve</button>
      </div>
    </div>
  );
}

function CorridorBar({ label, value, pct }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-xs font-semibold">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--bone-2)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--emerald), var(--lime))" }} />
      </div>
    </div>
  );
}

function RailStatus({ name, latency }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="relative h-1.5 w-1.5 rounded-full" style={{ background: "var(--emerald)" }}>
          <div className="absolute inset-0 rounded-full pulse-dot" style={{ background: "var(--emerald)" }} />
        </div>
        <span className="text-xs">{name}</span>
      </div>
      <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{latency}</span>
    </div>
  );
}

function AlertRow({ severity, text, onClick }) {
  const color = severity === "warn" ? "#92400e" : "var(--emerald)";
  return (
    <button onClick={onClick} className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-[color:var(--bone)]">
      <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: color }} />
      <span className="text-xs" style={{ color: "var(--ink)" }}>{text}</span>
    </button>
  );
}

function StatusPill({ status }) {
  const styles = {
    completed: { background: "var(--emerald)", color: "var(--lime)", label: "Completed" },
    processing: { background: "#dbeafe", color: "#1e40af", label: "Processing" },
    pending: { background: "#fef3c7", color: "#92400e", label: "Pending" },
    disputed: { background: "#fee2e2", color: "#991b1b", label: "Disputed" },
  }[status] || { background: "var(--bone-2)", color: "var(--muted)", label: status };
  return <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: styles.background, color: styles.color }}>{styles.label}</span>;
}

function ReportRow({ label, status, onClick }) {
  const styles = {
    ready: { background: "var(--emerald)", color: "var(--lime)", label: "Ready" },
    filed: { background: "var(--bone-2)", color: "var(--muted)", label: "Filed" },
    draft: { background: "#fef3c7", color: "#92400e", label: "Draft" },
  }[status];
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-xl p-3 text-left transition hover:bg-[color:var(--bone)]" style={{ border: "1px solid var(--line)" }}>
      <span className="text-sm font-medium">{label}</span>
      <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: styles.background, color: styles.color }}>{styles.label}</span>
    </button>
  );
}

function ComplianceStat({ label, value, emphasis }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
      <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="font-display mt-1 text-2xl font-[500]" style={{ color: emphasis ? "var(--emerald)" : "var(--ink)" }}>{value}</div>
    </div>
  );
}

function EvidenceStatus({ status }) {
  const styles = {
    ready: { background: "var(--emerald)", color: "var(--lime)", label: "Ready" },
    submitted: { background: "var(--bone-2)", color: "var(--muted)", label: "Submitted" },
    draft: { background: "#fef3c7", color: "#92400e", label: "Draft" },
  }[status];
  return <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: styles.background, color: styles.color }}>{styles.label}</span>;
}
