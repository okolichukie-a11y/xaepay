import React, { useState, useEffect } from "react";
import {
  BarChart3, Users, Briefcase, Layers, Wallet, TrendingUp, Receipt,
  RefreshCw, CheckCircle2, X, FileText, ArrowRight, Loader2, Building2,
  Send, AlertTriangle,
} from "lucide-react";
import { supabase } from "../lib/supabase.js";

// =============================================================================
// Founder admin portal — at /?p=admin
// Gated to the platform default operator (operator_profiles.is_platform_default = true)
// V1 KPIs + recent activity feed + provider-application review queue. No charts;
// numbers + lists, kept tight so it loads fast even as data grows.
// =============================================================================

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--line)" }}>
      <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="font-display mt-1 text-2xl font-[500]" style={{ color: accent || "var(--ink)" }}>{value}</div>
      {sub && <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

function relativeTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(amount, currency = "USD") {
  return `${currency} ${parseFloat(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function AdminPortal() {
  const [authChecking, setAuthChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [providerApps, setProviderApps] = useState([]);
  const [topOperators, setTopOperators] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auth gate: must be signed in AND have an operator_profile flagged is_platform_default
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthChecking(false); return; }
      setAuthUser(user);
      const { data: profile } = await supabase
        .from("operator_profiles")
        .select("is_platform_default")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      setAuthorized(profile?.is_platform_default === true);
      setAuthChecking(false);
    })();
  }, []);

  // Data fetch — runs once authorized, refresh button re-triggers.
  const fetchAll = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const last7Start  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000).toISOString();

      // Parallel fetches — each is a single query
      const [
        { count: customerCount },
        { data: customerTypeRows },
        { count: operatorCount },
        { count: providerCount },
        { data: quotesAll },
        { count: invoiceCount },
        { data: invoiceIssuers },
        { data: feeLedger },
        { data: applications },
        { data: recentCustomers },
        { data: recentQuotes },
        { data: recentInvoices },
        { data: recentApplications },
      ] = await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("customers").select("type"),
        supabase.from("operator_profiles").select("*", { count: "exact", head: true }),
        supabase.from("service_providers").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("quotes").select("amount, currency, status, cedar_request_status, created_at, bdc_user_id, bdc_name, destination"),
        supabase.from("invoices").select("*", { count: "exact", head: true }),
        supabase.from("invoices").select("operator_user_id, customer_issuer_id"),
        supabase.from("provider_fee_ledger").select("fee_amount, fee_currency, accrued_at, status"),
        supabase.from("provider_applications").select("*").eq("status", "submitted").order("created_at", { ascending: false }).limit(20),
        supabase.from("customers").select("id, name, business_name, email, type, bdc_name, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("quotes").select("id, customer_name, beneficiary, amount, currency, status, cedar_request_status, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("invoices").select("id, invoice_number, customer_name, operator_name, total, currency, status, created_at, customer_issuer_id").order("created_at", { ascending: false }).limit(10),
        supabase.from("provider_applications").select("id, legal_entity_name, contact_email, status, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      // Aggregate quote stats
      const completedQuotes = (quotesAll || []).filter((q) => q.status === "filled" || (q.cedar_request_status || "").toUpperCase().includes("COMPLETED"));
      const lifetimeVolumeUsd = completedQuotes.reduce((s, q) => s + parseFloat(q.amount || 0), 0);
      const monthVolume = completedQuotes.filter((q) => q.created_at >= monthStart).reduce((s, q) => s + parseFloat(q.amount || 0), 0);
      const last30Quotes = (quotesAll || []).filter((q) => q.created_at >= last30Start);
      const last30Settled = last30Quotes.filter((q) => q.status === "filled" || (q.cedar_request_status || "").toUpperCase().includes("COMPLETED"));

      // Lifetime XaePay revenue from provider fees (note: most accrued from settled txns;
      // some may be 'invoiced' or 'settled' already.)
      const lifetimeRevenue = (feeLedger || []).reduce((s, e) => s + parseFloat(e.fee_amount || 0), 0);
      const monthRevenue = (feeLedger || []).filter((e) => e.accrued_at >= monthStart).reduce((s, e) => s + parseFloat(e.fee_amount || 0), 0);

      // Customer type breakdown
      const individualCount = (customerTypeRows || []).filter((c) => c.type !== "business").length;
      const businessCount = (customerTypeRows || []).filter((c) => c.type === "business").length;

      // Invoice issuer breakdown
      const operatorIssuedCount = (invoiceIssuers || []).filter((i) => i.operator_user_id).length;
      const customerIssuedCount = (invoiceIssuers || []).filter((i) => i.customer_issuer_id).length;

      // Top operators by volume in last 30 days
      const opVolume = {};
      last30Settled.forEach((q) => {
        const key = q.bdc_user_id || "_unassigned";
        if (!opVolume[key]) opVolume[key] = { name: q.bdc_name || "Unassigned", txCount: 0, volumeUsd: 0 };
        opVolume[key].txCount += 1;
        opVolume[key].volumeUsd += parseFloat(q.amount || 0);
      });
      const topOps = Object.values(opVolume).sort((a, b) => b.volumeUsd - a.volumeUsd).slice(0, 5);

      setStats({
        customerCount: customerCount || 0,
        individualCount, businessCount,
        operatorCount: operatorCount || 0,
        providerCount: providerCount || 0,
        invoiceCount: invoiceCount || 0,
        operatorIssuedCount, customerIssuedCount,
        lifetimeVolumeUsd, monthVolume,
        lifetimeRevenue, monthRevenue,
        pendingApplications: (applications || []).length,
        last30TxCount: last30Quotes.length,
        last30SettledCount: last30Settled.length,
      });
      setProviderApps(applications || []);
      setTopOperators(topOps);

      // Merge recent items into a unified activity feed, sorted by time desc
      const feed = [
        ...(recentCustomers || []).map((c) => ({ kind: "customer_signup", at: c.created_at, body: `New ${c.type || "individual"} customer: ${c.business_name || c.name || c.email}`, operator: c.bdc_name })),
        ...(recentQuotes || []).map((q) => ({ kind: "quote", at: q.created_at, body: `Quote · ${q.customer_name || "?"} → ${q.beneficiary || "?"} · ${fmtMoney(q.amount, q.currency)} · ${q.status}` })),
        ...(recentInvoices || []).map((i) => ({ kind: i.customer_issuer_id ? "customer_invoice" : "operator_invoice", at: i.created_at, body: `Invoice ${i.invoice_number} · ${i.operator_name} → ${i.customer_name} · ${fmtMoney(i.total, i.currency)} · ${i.status}` })),
        ...(recentApplications || []).map((a) => ({ kind: "provider_application", at: a.created_at, body: `Provider application: ${a.legal_entity_name} (${a.contact_email}) · ${a.status}` })),
      ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 30);
      setActivity(feed);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Admin data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (authorized) fetchAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [authorized]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--paper)" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--muted)" }} />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--paper)" }}>
        <div className="max-w-md text-center">
          <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <h1 className="font-display text-2xl font-semibold">Sign in required</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Admin portal requires authentication. Sign in to your platform-admin account first.</p>
          <a href="/" className="mt-6 inline-block rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "var(--ink)", color: "var(--bone)" }}>← Back to xaepay.com</a>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--paper)" }}>
        <div className="max-w-md text-center">
          <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: "#92400e" }} />
          <h1 className="font-display text-2xl font-semibold">Not authorized</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>This page is reserved for the XaePay platform administrator. Your account ({authUser.email}) doesn't have admin access.</p>
          <a href="/" className="mt-6 inline-block rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "var(--ink)", color: "var(--bone)" }}>← Back to xaepay.com</a>
        </div>
      </div>
    );
  }

  // Authorized — render the dashboard
  const s = stats || {};
  const settledRate = s.last30TxCount > 0 ? Math.round((s.last30SettledCount / s.last30TxCount) * 100) : 0;

  const approveApplication = async (app) => {
    // V1: just mark the application as 'reviewing'. Full provider-creation
    // flow (insert service_providers + send invite) is a follow-up.
    await supabase.from("provider_applications").update({ status: "reviewing", reviewed_at: new Date().toISOString(), reviewed_by: authUser.id }).eq("id", app.id);
    fetchAll();
  };
  const rejectApplication = async (app) => {
    const reason = window.prompt("Reject this application? Reason:");
    if (!reason) return;
    await supabase.from("provider_applications").update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: authUser.id, rejection_reason: reason }).eq("id", app.id);
    fetchAll();
  };

  return (
    <div className="min-h-screen font-ui" style={{ background: "var(--paper)" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--emerald)" }}>Founder admin</div>
            <h1 className="font-display mt-2 text-3xl font-[450] tracking-tight sm:text-[40px]">XaePay control room</h1>
            <div className="mt-1 font-mono text-xs" style={{ color: "var(--muted)" }}>Signed in as {authUser.email} · {loading ? "refreshing…" : "live data"}</div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="font-mono text-[10px] uppercase tracking-wider underline" style={{ color: "var(--muted)" }}>← Back to site</a>
            <button onClick={fetchAll} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium" style={{ background: "var(--ink)", color: "var(--bone)" }}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Top-line KPIs */}
        <section className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Top-line</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Lifetime volume" value={`$${(s.lifetimeVolumeUsd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub={`${s.last30SettledCount || 0} settled in 30d`} accent="var(--emerald)" />
            <StatCard label="XaePay revenue" value={`$${(s.lifetimeRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub={`$${(s.monthRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} this month`} accent="var(--emerald)" />
            <StatCard label="MTD volume" value={`$${(s.monthVolume || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub="Settled this month" />
            <StatCard label="Settle rate (30d)" value={`${settledRate}%`} sub={`${s.last30SettledCount || 0} / ${s.last30TxCount || 0} quotes`} />
          </div>
        </section>

        {/* Entity counts */}
        <section className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Entities</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Customers" value={s.customerCount || 0} sub={`${s.businessCount || 0} biz · ${s.individualCount || 0} indiv`} />
            <StatCard label="Operators" value={s.operatorCount || 0} sub="Onboarded" />
            <StatCard label="Providers" value={s.providerCount || 0} sub="Active rails" />
            <StatCard label="Invoices" value={s.invoiceCount || 0} sub={`${s.operatorIssuedCount || 0} op · ${s.customerIssuedCount || 0} cust`} />
            <StatCard label="Pending apps" value={s.pendingApplications || 0} sub="Provider applications" accent={s.pendingApplications > 0 ? "var(--emerald)" : "var(--muted)"} />
          </div>
        </section>

        {/* Two columns: provider apps + top operators */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <section>
            <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Provider applications · pending review</div>
            <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid var(--line)" }}>
              {providerApps.length === 0 ? (
                <div className="p-6 text-center text-xs" style={{ color: "var(--muted)" }}>No pending applications.</div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                  {providerApps.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-3 text-sm">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <div className="font-semibold">{a.legal_entity_name}</div>
                        <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{relativeTime(a.created_at)}</span>
                      </div>
                      <div className="font-mono text-[11px] mt-1" style={{ color: "var(--muted)" }}>{a.contact_name} · {a.contact_email} · {a.integration_capability}</div>
                      <div className="font-mono text-[10px] mt-1" style={{ color: "var(--muted)" }}>Licenses: {a.licenses_held || "—"}</div>
                      {a.notes && <div className="text-xs mt-2 italic" style={{ color: "var(--muted)" }}>"{a.notes}"</div>}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => approveApplication(a)} className="rounded-lg px-3 py-1 text-xs font-semibold" style={{ background: "var(--lime)", color: "var(--ink)" }}><CheckCircle2 size={12} className="inline mr-1" />Mark reviewing</button>
                        <button onClick={() => rejectApplication(a)} className="rounded-lg px-3 py-1 text-xs font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}><X size={12} className="inline mr-1" />Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Top operators · 30d settled volume</div>
            <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid var(--line)" }}>
              {topOperators.length === 0 ? (
                <div className="p-6 text-center text-xs" style={{ color: "var(--muted)" }}>No settled transactions in the last 30 days yet.</div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                  {topOperators.map((op, idx) => (
                    <div key={op.name + idx} className="p-3 flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{op.name}</div>
                        <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{op.txCount} settled txn{op.txCount === 1 ? "" : "s"}</div>
                      </div>
                      <div className="font-mono font-semibold">${op.volumeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Recent activity feed */}
        <section>
          <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Recent activity · last 30 events</div>
          <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid var(--line)" }}>
            {activity.length === 0 ? (
              <div className="p-6 text-center text-xs" style={{ color: "var(--muted)" }}>No activity yet.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                {activity.map((e, i) => {
                  const Icon = e.kind === "customer_signup" ? Users
                    : e.kind === "quote" ? TrendingUp
                    : e.kind === "operator_invoice" ? FileText
                    : e.kind === "customer_invoice" ? Receipt
                    : Briefcase;
                  return (
                    <div key={i} className="p-3 flex items-start gap-3 text-sm">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bone-2)", color: "var(--emerald)" }}><Icon size={13} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{e.body}</div>
                        {e.operator && <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>via {e.operator}</div>}
                      </div>
                      <div className="font-mono text-[10px] flex-shrink-0" style={{ color: "var(--muted)" }}>{relativeTime(e.at)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="mt-12 text-center font-mono text-[10px]" style={{ color: "var(--muted)" }}>
          Admin portal v1 · queries run client-side · refresh to update
        </div>
      </div>
    </div>
  );
}
