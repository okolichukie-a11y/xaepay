import React, { useState, useEffect } from "react";
import {
  Users, Briefcase, Layers, Wallet, TrendingUp, Receipt, RefreshCw,
  CheckCircle2, X, FileText, Loader2, AlertTriangle, Search, Settings, Save,
} from "lucide-react";
import { supabase, sendEmail } from "../lib/supabase.js";

// =============================================================================
// Founder admin portal — at /?p=admin
// V1.1: KPI overview + customer reassignment + provider application
// onboarding (full create + invite) + platform settings.
// Gated to operator_profiles.is_platform_default = true.
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

function slugify(s) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export function AdminPortal() {
  const [authChecking, setAuthChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [tab, setTab] = useState("overview");

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

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "applications", label: "Applications", icon: Briefcase },
    { id: "customers", label: "Customers", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen font-ui" style={{ background: "var(--paper)" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--emerald)" }}>Founder admin</div>
            <h1 className="font-display mt-2 text-3xl font-[450] tracking-tight sm:text-[40px]">XaePay control room</h1>
            <div className="mt-1 font-mono text-xs" style={{ color: "var(--muted)" }}>{authUser.email} · is_platform_default</div>
          </div>
          <a href="/" className="font-mono text-[10px] uppercase tracking-wider underline" style={{ color: "var(--muted)" }}>← Back to site</a>
        </div>

        <div className="mb-6 -mx-1 overflow-x-auto">
          <div className="flex gap-1 px-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition"
                  style={active ? { background: "var(--ink)", color: "var(--bone)" } : { background: "transparent", color: "var(--muted)" }}>
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "overview"     && <OverviewTab authUser={authUser} />}
        {tab === "applications" && <ApplicationsTab authUser={authUser} />}
        {tab === "customers"    && <CustomersTab authUser={authUser} />}
        {tab === "settings"     && <SettingsTab authUser={authUser} />}
      </div>
    </div>
  );
}

// =============================================================================
// Overview — the KPIs + recent activity feed
// =============================================================================

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [topOperators, setTopOperators] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: customerCount },
        { data: customerTypeRows },
        { count: operatorCount },
        { count: providerCount },
        { data: quotesAll },
        { count: invoiceCount },
        { data: invoiceIssuers },
        { data: feeLedger },
        { count: pendingAppsCount },
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
        supabase.from("provider_applications").select("*", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("customers").select("id, name, business_name, email, type, bdc_name, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("quotes").select("id, customer_name, beneficiary, amount, currency, status, cedar_request_status, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("invoices").select("id, invoice_number, customer_name, operator_name, total, currency, status, created_at, customer_issuer_id").order("created_at", { ascending: false }).limit(10),
        supabase.from("provider_applications").select("id, legal_entity_name, contact_email, status, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const completedQuotes = (quotesAll || []).filter((q) => q.status === "filled" || (q.cedar_request_status || "").toUpperCase().includes("COMPLETED"));
      const lifetimeVolumeUsd = completedQuotes.reduce((s, q) => s + parseFloat(q.amount || 0), 0);
      const monthVolume = completedQuotes.filter((q) => q.created_at >= monthStart).reduce((s, q) => s + parseFloat(q.amount || 0), 0);
      const last30Quotes = (quotesAll || []).filter((q) => q.created_at >= last30Start);
      const last30Settled = last30Quotes.filter((q) => q.status === "filled" || (q.cedar_request_status || "").toUpperCase().includes("COMPLETED"));
      const lifetimeRevenue = (feeLedger || []).reduce((s, e) => s + parseFloat(e.fee_amount || 0), 0);
      const monthRevenue = (feeLedger || []).filter((e) => e.accrued_at >= monthStart).reduce((s, e) => s + parseFloat(e.fee_amount || 0), 0);
      const individualCount = (customerTypeRows || []).filter((c) => c.type !== "business").length;
      const businessCount = (customerTypeRows || []).filter((c) => c.type === "business").length;
      const operatorIssuedCount = (invoiceIssuers || []).filter((i) => i.operator_user_id).length;
      const customerIssuedCount = (invoiceIssuers || []).filter((i) => i.customer_issuer_id).length;

      const opVolume = {};
      last30Settled.forEach((q) => {
        const key = q.bdc_user_id || "_unassigned";
        if (!opVolume[key]) opVolume[key] = { name: q.bdc_name || "Unassigned", txCount: 0, volumeUsd: 0 };
        opVolume[key].txCount += 1;
        opVolume[key].volumeUsd += parseFloat(q.amount || 0);
      });
      const topOps = Object.values(opVolume).sort((a, b) => b.volumeUsd - a.volumeUsd).slice(0, 5);

      setStats({
        customerCount: customerCount || 0, individualCount, businessCount,
        operatorCount: operatorCount || 0, providerCount: providerCount || 0,
        invoiceCount: invoiceCount || 0, operatorIssuedCount, customerIssuedCount,
        lifetimeVolumeUsd, monthVolume, lifetimeRevenue, monthRevenue,
        pendingApplications: pendingAppsCount || 0,
        last30TxCount: last30Quotes.length, last30SettledCount: last30Settled.length,
      });
      setTopOperators(topOps);
      const feed = [
        ...(recentCustomers || []).map((c) => ({ kind: "customer_signup", at: c.created_at, body: `New ${c.type || "individual"} customer: ${c.business_name || c.name || c.email}`, operator: c.bdc_name })),
        ...(recentQuotes || []).map((q) => ({ kind: "quote", at: q.created_at, body: `Quote · ${q.customer_name || "?"} → ${q.beneficiary || "?"} · ${fmtMoney(q.amount, q.currency)} · ${q.status}` })),
        ...(recentInvoices || []).map((i) => ({ kind: i.customer_issuer_id ? "customer_invoice" : "operator_invoice", at: i.created_at, body: `Invoice ${i.invoice_number} · ${i.operator_name} → ${i.customer_name} · ${fmtMoney(i.total, i.currency)} · ${i.status}` })),
        ...(recentApplications || []).map((a) => ({ kind: "provider_application", at: a.created_at, body: `Provider application: ${a.legal_entity_name} (${a.contact_email}) · ${a.status}` })),
      ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 30);
      setActivity(feed);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const s = stats || {};
  const settledRate = s.last30TxCount > 0 ? Math.round((s.last30SettledCount / s.last30TxCount) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{loading ? "Refreshing…" : "Live data"}</div>
        <button onClick={fetchAll} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <section>
        <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Top-line</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Lifetime volume" value={`$${(s.lifetimeVolumeUsd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub={`${s.last30SettledCount || 0} settled in 30d`} accent="var(--emerald)" />
          <StatCard label="XaePay revenue" value={`$${(s.lifetimeRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub={`$${(s.monthRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} this month`} accent="var(--emerald)" />
          <StatCard label="MTD volume" value={`$${(s.monthVolume || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub="Settled this month" />
          <StatCard label="Settle rate (30d)" value={`${settledRate}%`} sub={`${s.last30SettledCount || 0} / ${s.last30TxCount || 0} quotes`} />
        </div>
      </section>
      <section>
        <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Entities</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Customers" value={s.customerCount || 0} sub={`${s.businessCount || 0} biz · ${s.individualCount || 0} indiv`} />
          <StatCard label="Operators" value={s.operatorCount || 0} sub="Onboarded" />
          <StatCard label="Providers" value={s.providerCount || 0} sub="Active rails" />
          <StatCard label="Invoices" value={s.invoiceCount || 0} sub={`${s.operatorIssuedCount || 0} op · ${s.customerIssuedCount || 0} cust`} />
          <StatCard label="Pending apps" value={s.pendingApplications || 0} sub="Provider applications" accent={s.pendingApplications > 0 ? "var(--emerald)" : "var(--muted)"} />
        </div>
      </section>
      <section>
        <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Top operators · 30d settled volume</div>
        <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid var(--line)" }}>
          {topOperators.length === 0 ? (
            <div className="p-6 text-center text-xs" style={{ color: "var(--muted)" }}>No settled transactions in the last 30 days.</div>
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
      <section>
        <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Recent activity · last 30 events</div>
        <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid var(--line)" }}>
          {activity.length === 0 ? (
            <div className="p-6 text-center text-xs" style={{ color: "var(--muted)" }}>No activity yet.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--line)" }}>
              {activity.map((e, i) => {
                const Icon = e.kind === "customer_signup" ? Users : e.kind === "quote" ? TrendingUp : e.kind === "operator_invoice" ? FileText : e.kind === "customer_invoice" ? Receipt : Briefcase;
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
    </div>
  );
}

// =============================================================================
// Applications — full approval workflow
// =============================================================================

function ApplicationsTab({ authUser }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);          // current app id being processed
  const [filter, setFilter] = useState("submitted"); // submitted | reviewing | invited | rejected | all

  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("provider_applications").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setApps(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  const approve = async (app) => {
    if (busy) return;
    if (!window.confirm(`Approve ${app.legal_entity_name}? This creates a service_providers row and sends a magic-link invite to ${app.contact_email}.`)) return;
    setBusy(app.id);
    try {
      // 1. Create the service_providers row from the application
      const baseSlug = slugify(app.legal_entity_name) || `provider-${app.id.slice(0, 6)}`;
      const sourceCountries = Array.isArray(app.countries_covered) ? app.countries_covered : [];
      const destCountries = Array.isArray(app.countries_covered) ? app.countries_covered : [];
      const currencies = Array.isArray(app.currencies_supported) ? app.currencies_supported : [];
      const hasApi = app.integration_capability === "full_api" || app.integration_capability === "webhook_only";
      const { data: provider, error: provErr } = await supabase.from("service_providers").insert({
        slug: baseSlug,
        display_name: app.legal_entity_name,
        legal_name: app.legal_entity_name,
        description: app.notes || null,
        contact_email: app.contact_email,
        has_api: hasApi,
        api_status: hasApi ? "sandbox" : "inactive",
        status: "active",
        supported_source_countries: sourceCountries,
        supported_dest_countries: destCountries,
        supported_currencies: currencies,
        onboarded_at: new Date().toISOString(),
        notes: `Onboarded from application ${app.id} · Licenses: ${app.licenses_held || "—"}`,
      }).select("*").single();
      if (provErr) throw provErr;

      // 2. Create invite for contact email so they can sign in and access the portal
      const { error: inviteErr } = await supabase.from("service_provider_invites").insert({
        service_provider_id: provider.id,
        email: app.contact_email.toLowerCase(),
        role: "admin",
        invited_by: authUser.id,
        status: "pending",
      });
      if (inviteErr && !inviteErr.message?.includes("duplicate")) throw inviteErr;

      // 3. Send invite email manually since the existing invite flow handles email
      //    from inside the provider portal — we're triggering it externally here.
      const inviteHtml = `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#fcfbf7;margin:0;padding:24px;"><div style="max-width:520px;margin:0 auto;background:white;border:1px solid #e5e7eb;border-radius:16px;padding:32px;"><h2 style="margin:0 0 8px;font-size:22px;color:#0a0b0d;">Welcome to XaePay · ${provider.display_name}</h2><p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Your application has been approved. You've been invited as an admin of the ${provider.display_name} service-provider portal on XaePay.</p><p style="text-align:center;margin:24px 0 8px;"><a href="https://xaepay.com/" style="display:inline-block;background:#0a0b0d;color:#d4f570;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">Sign in with this email</a></p><p style="color:#9ca3af;font-size:11px;text-align:center;margin:20px 0 0;">Use <strong>${app.contact_email}</strong> when signing in — we'll add you to ${provider.display_name} automatically.</p></div></body></html>`;
      sendEmail({ to: app.contact_email, subject: `Approved · Welcome to XaePay`, html: inviteHtml, text: `Your application for ${provider.display_name} has been approved. Sign in at https://xaepay.com/ with ${app.contact_email}.` }).catch(() => {});

      // 4. Flip the application status
      await supabase.from("provider_applications").update({
        status: "invited",
        reviewed_at: new Date().toISOString(),
        reviewed_by: authUser.id,
      }).eq("id", app.id);

      fetch();
      alert(`✓ ${provider.display_name} onboarded as a service provider. Invite email sent to ${app.contact_email}.`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Approval failed:", err);
      alert(`Couldn't approve: ${err?.message || err}`);
    } finally { setBusy(null); }
  };

  const reject = async (app) => {
    const reason = window.prompt(`Reject ${app.legal_entity_name}? Reason (will be saved):`);
    if (!reason) return;
    await supabase.from("provider_applications").update({
      status: "rejected", reviewed_at: new Date().toISOString(),
      reviewed_by: authUser.id, rejection_reason: reason,
    }).eq("id", app.id);
    fetch();
  };

  const STATUS_PILL = {
    submitted:  { bg: "#fef3c7", color: "#92400e" },
    reviewing:  { bg: "rgba(15,95,63,0.10)", color: "var(--emerald)" },
    invited:    { bg: "#d1fae5", color: "#065f46" },
    rejected:   { bg: "#fee2e2", color: "#991b1b" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
          {["submitted", "reviewing", "invited", "rejected", "all"].map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className="rounded px-3 py-1 text-xs font-medium capitalize"
              style={filter === f ? { background: "var(--ink)", color: "var(--bone)" } : { color: "var(--muted)" }}>{f}</button>
          ))}
        </div>
        <button onClick={fetch} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid var(--line)" }}>
        {apps.length === 0 ? (
          <div className="p-12 text-center"><Briefcase size={20} className="mx-auto mb-2" style={{ color: "var(--muted)" }} /><div className="text-sm" style={{ color: "var(--muted)" }}>No applications in this filter.</div></div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {apps.map((a) => {
              const pill = STATUS_PILL[a.status] || STATUS_PILL.submitted;
              return (
                <div key={a.id} className="p-4 text-sm">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
                    <div className="font-semibold">{a.legal_entity_name}</div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ background: pill.bg, color: pill.color }}>{a.status}</span>
                      <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{relativeTime(a.created_at)}</span>
                    </div>
                  </div>
                  <div className="font-mono text-[11px]" style={{ color: "var(--muted)" }}>
                    {a.contact_name} · {a.contact_email}{a.contact_phone ? ` · ${a.contact_phone}` : ""}
                  </div>
                  <div className="font-mono text-[10px] mt-1" style={{ color: "var(--muted)" }}>
                    Licenses: {a.licenses_held || "—"} · Integration: {a.integration_capability}
                  </div>
                  <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
                    Countries: {(a.countries_covered || []).join(", ") || "—"} · Currencies: {(a.currencies_supported || []).join(", ") || "—"}
                  </div>
                  {(a.daily_volume_capacity || a.monthly_volume_capacity) && (
                    <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
                      Capacity: {a.daily_volume_capacity || "—"}/day · {a.monthly_volume_capacity || "—"}/month
                    </div>
                  )}
                  {a.notes && <div className="text-xs mt-2 italic" style={{ color: "var(--muted)" }}>"{a.notes}"</div>}
                  {a.rejection_reason && <div className="text-xs mt-2 rounded p-2" style={{ background: "#fee2e2", color: "#991b1b" }}>Rejected: {a.rejection_reason}</div>}
                  {a.status === "submitted" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => approve(a)} disabled={busy === a.id} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "var(--lime)", color: "var(--ink)" }}>
                        {busy === a.id ? <Loader2 size={12} className="animate-spin inline mr-1" /> : <CheckCircle2 size={12} className="inline mr-1" />}
                        Approve · onboard provider + send invite
                      </button>
                      <button onClick={() => reject(a)} disabled={busy === a.id} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>
                        <X size={12} className="inline mr-1" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Customers — full list with reassignment
// =============================================================================

function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState(null);

  const fetch = async () => {
    setLoading(true);
    const [{ data: c }, { data: o }] = await Promise.all([
      supabase.from("customers").select("id, name, business_name, email, phone, type, kyc_status, bdc_user_id, bdc_name, created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("operator_profiles").select("auth_user_id, business_name, operator_type, is_platform_default").order("business_name"),
    ]);
    setCustomers(c || []);
    setOperators(o || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const reassign = async (customer, newOperatorAuthUserId) => {
    if (newOperatorAuthUserId === customer.bdc_user_id) return;
    setSavingId(customer.id);
    try {
      const newOp = operators.find((o) => o.auth_user_id === newOperatorAuthUserId);
      const { error } = await supabase.from("customers").update({
        bdc_user_id: newOperatorAuthUserId,
        bdc_name: newOp?.business_name || "Operator",
      }).eq("id", customer.id);
      if (error) throw error;
      // optimistic update
      setCustomers((cs) => cs.map((x) => x.id === customer.id ? { ...x, bdc_user_id: newOperatorAuthUserId, bdc_name: newOp?.business_name || x.bdc_name } : x));
    } catch (err) {
      alert(`Couldn't reassign: ${err?.message || err}`);
    } finally { setSavingId(null); }
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q)
      || (c.business_name || "").toLowerCase().includes(q)
      || (c.email || "").toLowerCase().includes(q)
      || (c.phone || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-md rounded-lg px-3 py-2" style={{ background: "white", border: "1px solid var(--line)" }}>
          <Search size={14} style={{ color: "var(--muted)" }} />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, business, email…" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <button onClick={fetch} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid var(--line)" }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center"><Users size={20} className="mx-auto mb-2" style={{ color: "var(--muted)" }} /><div className="text-sm" style={{ color: "var(--muted)" }}>{loading ? "Loading…" : "No customers match."}</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ background: "var(--bone)", borderBottom: "1px solid var(--line)" }}>
                {["Customer", "Type", "KYC", "Operator (reassign here)", "Added"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.business_name || c.name || "—"}</div>
                      <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{c.email || c.phone || "—"}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-xs">{c.type || "individual"}</td>
                    <td className="px-4 py-3 text-xs">{c.kyc_status || "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={c.bdc_user_id || ""}
                        onChange={(e) => reassign(c, e.target.value)}
                        disabled={savingId === c.id}
                        className="rounded px-2 py-1 text-xs font-mono"
                        style={{ background: "white", border: "1px solid var(--line)" }}
                      >
                        {!c.bdc_user_id && <option value="">— Unassigned —</option>}
                        {operators.map((op) => (
                          <option key={op.auth_user_id} value={op.auth_user_id}>
                            {op.business_name || op.auth_user_id.slice(0, 8)}
                            {op.is_platform_default ? " (default)" : ""}
                          </option>
                        ))}
                      </select>
                      {savingId === c.id && <Loader2 size={12} className="animate-spin inline ml-2" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{relativeTime(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs" style={{ color: "var(--muted)" }}>Showing up to 500 most recent customers. Search filters live across all loaded rows.</p>
    </div>
  );
}

// =============================================================================
// Settings — platform-wide key/value config
// =============================================================================

function SettingsTab({ authUser }) {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const [drafts, setDrafts] = useState({}); // key → current edited value

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("platform_settings").select("*").order("category").order("key");
    setSettings(data || []);
    setDrafts(Object.fromEntries((data || []).map((s) => [s.key, s.value])));
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const save = async (key) => {
    setSavingKey(key);
    try {
      const { error } = await supabase.from("platform_settings").update({
        value: drafts[key],
        updated_at: new Date().toISOString(),
        updated_by: authUser.id,
      }).eq("key", key);
      if (error) throw error;
      setSettings((ss) => ss.map((s) => s.key === key ? { ...s, value: drafts[key], updated_at: new Date().toISOString() } : s));
    } catch (err) { alert(`Couldn't save: ${err?.message || err}`); }
    finally { setSavingKey(null); }
  };

  const grouped = settings.reduce((acc, s) => {
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{loading ? "Loading…" : `${settings.length} settings`}</div>
        <button onClick={fetch} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium" style={{ background: "var(--ink)", color: "var(--bone)" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      {Object.keys(grouped).sort().map((cat) => (
        <section key={cat}>
          <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>{cat}</div>
          <div className="rounded-xl overflow-hidden divide-y" style={{ background: "white", border: "1px solid var(--line)", borderColor: "var(--line)" }}>
            {grouped[cat].map((s) => {
              const dirty = drafts[s.key] !== s.value;
              return (
                <div key={s.key} className="p-4">
                  <div className="font-mono text-xs font-semibold mb-1">{s.key}</div>
                  {s.description && <div className="text-xs mb-2" style={{ color: "var(--muted)" }}>{s.description}</div>}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={drafts[s.key] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                      className="flex-1 rounded px-2 py-1.5 text-sm font-mono"
                      style={{ background: dirty ? "#fef3c7" : "var(--bone)", border: "1px solid var(--line)" }}
                    />
                    <button onClick={() => save(s.key)} disabled={!dirty || savingKey === s.key} className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={{ background: dirty ? "var(--lime)" : "var(--bone)", color: "var(--ink)" }}>
                      {savingKey === s.key ? <Loader2 size={12} className="animate-spin" /> : <><Save size={12} className="inline mr-1" /> Save</>}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>Last updated {relativeTime(s.updated_at)}</div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Settings here are DB-backed. Some are wired into the app at runtime; others are reference values that don't yet influence runtime behavior — those will be wired in follow-up commits as needed.
      </p>
    </div>
  );
}
