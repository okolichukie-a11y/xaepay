import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

// =============================================================================
// Connectivity diagnostic page — /?p=connectivity-check
// Lightweight test page Chukie can send to anyone reporting "can't load
// xaepay.com" so we get specific diagnostic info instead of guessing.
// Runs a battery of browser-side checks and shows pass/fail per check.
// =============================================================================

const TESTS = [
  {
    key: "page_loaded",
    label: "This page loaded",
    detail: "Indicates DNS + Vercel are working from your network for at least one request.",
    run: async () => ({ pass: true, info: "Yes — you wouldn't see this otherwise." }),
  },
  {
    key: "fetch_homepage",
    label: "Fetch xaepay.com homepage",
    detail: "Tests that your browser can load the main HTML over HTTPS.",
    run: async () => {
      const t0 = performance.now();
      try {
        const res = await fetch("/", { method: "HEAD" });
        const ms = Math.round(performance.now() - t0);
        return { pass: res.ok, info: `HTTP ${res.status} in ${ms}ms` };
      } catch (e) {
        return { pass: false, info: `Fetch failed: ${e?.message || e}` };
      }
    },
  },
  {
    key: "fetch_supabase",
    label: "Reach Supabase (backend)",
    detail: "Tests that your network can reach our database / auth endpoints.",
    run: async () => {
      const t0 = performance.now();
      try {
        const res = await fetch("https://pgsriqdnadlbahfanxrm.supabase.co/auth/v1/health", { method: "HEAD" });
        const ms = Math.round(performance.now() - t0);
        return { pass: res.ok || res.status === 404, info: `HTTP ${res.status} in ${ms}ms` };
      } catch (e) {
        return { pass: false, info: `Fetch failed: ${e?.message || e}` };
      }
    },
  },
  {
    key: "fetch_meta",
    label: "Reach Meta WhatsApp Cloud API",
    detail: "Tests that your network can reach Meta's servers (used for WhatsApp notifications).",
    run: async () => {
      try {
        const t0 = performance.now();
        const res = await fetch("https://graph.facebook.com/v19.0/", { method: "HEAD" });
        const ms = Math.round(performance.now() - t0);
        return { pass: res.status < 500, info: `HTTP ${res.status} in ${ms}ms` };
      } catch (e) {
        return { pass: false, info: `Fetch failed: ${e?.message || e}` };
      }
    },
  },
  {
    key: "third_party_cookies",
    label: "Browser cookies enabled",
    detail: "Required for sign-in to work. Disable cookies = can't authenticate.",
    run: async () => {
      const supports = navigator.cookieEnabled;
      return { pass: !!supports, info: supports ? "Yes" : "Cookies are blocked — sign-in won't work" };
    },
  },
  {
    key: "online",
    label: "Browser reports online",
    detail: "Browser's own network status flag.",
    run: async () => ({ pass: navigator.onLine, info: navigator.onLine ? "Online" : "Offline" }),
  },
];

export function ConnectivityCheckPage() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

  const runAll = async () => {
    setRunning(true);
    setResults({});
    for (const t of TESTS) {
      try {
        const r = await t.run();
        setResults((prev) => ({ ...prev, [t.key]: r }));
      } catch (e) {
        setResults((prev) => ({ ...prev, [t.key]: { pass: false, info: `Threw: ${e?.message || e}` } }));
      }
    }
    setRunning(false);
  };

  useEffect(() => { runAll(); }, []);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "—";
  const lang = typeof navigator !== "undefined" ? navigator.language : "—";
  const conn = typeof navigator !== "undefined" && navigator.connection
    ? `${navigator.connection.effectiveType || "?"} · ${navigator.connection.downlink || "?"} Mbps · RTT ${navigator.connection.rtt || "?"}ms`
    : "Not available";

  const allPassed = Object.keys(results).length === TESTS.length && Object.values(results).every((r) => r.pass);
  const anyFailed = Object.values(results).some((r) => !r.pass);

  const buildShareText = () => {
    const lines = [
      "XaePay connectivity check",
      `Time: ${new Date().toISOString()}`,
      `UA: ${ua}`,
      `Lang: ${lang}`,
      `Network: ${conn}`,
      "",
      "Results:",
      ...TESTS.map((t) => {
        const r = results[t.key];
        if (!r) return `  - ${t.label}: pending`;
        return `  - ${t.label}: ${r.pass ? "OK" : "FAIL"} · ${r.info}`;
      }),
    ];
    return lines.join("\n");
  };

  const copyToClipboard = () => {
    const text = buildShareText();
    navigator.clipboard?.writeText(text).then(() => alert("Copied. Paste it into your message to XaePay support."));
  };

  return (
    <div className="min-h-screen font-ui" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <a href="/" className="font-mono text-[11px] uppercase tracking-wider underline" style={{ color: "var(--muted)" }}>← Back to xaepay.com</a>
        <h1 className="font-display mt-4 text-3xl font-[500] tracking-tight sm:text-4xl">Connectivity check</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          If xaepay.com isn't loading for you on a different device / browser, run these checks here and share the results back to whoever asked you to.
        </p>

        <div className="mt-6 flex gap-2">
          <button onClick={runAll} disabled={running} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "var(--ink)", color: "var(--bone)" }}>
            <RefreshCw size={14} className={running ? "animate-spin" : ""} /> {running ? "Running…" : "Run again"}
          </button>
          {!running && Object.keys(results).length === TESTS.length && (
            <button onClick={copyToClipboard} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "var(--bone)", color: "var(--ink)", border: "1px solid var(--line)" }}>
              Copy results to clipboard
            </button>
          )}
        </div>

        {!running && Object.keys(results).length === TESTS.length && (
          <div className="mt-6 rounded-xl p-4" style={{ background: allPassed ? "#d1fae5" : anyFailed ? "#fef3c7" : "var(--bone)", color: allPassed ? "#065f46" : anyFailed ? "#92400e" : "var(--ink)" }}>
            <div className="flex items-center gap-2 font-semibold">
              {allPassed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {allPassed ? "All checks passed. xaepay.com should work normally on this device." : "One or more checks failed — see details below + share the copied results."}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {TESTS.map((t) => {
            const r = results[t.key];
            return (
              <div key={t.key} className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--line)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{t.detail}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {!r && <Loader2 size={16} className="animate-spin" style={{ color: "var(--muted)" }} />}
                    {r && r.pass && <CheckCircle2 size={18} style={{ color: "var(--emerald)" }} />}
                    {r && !r.pass && <AlertTriangle size={18} style={{ color: "#92400e" }} />}
                  </div>
                </div>
                {r && (
                  <div className="mt-2 font-mono text-[11px]" style={{ color: r.pass ? "var(--emerald)" : "#991b1b" }}>{r.info}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl p-4 text-xs" style={{ background: "var(--bone)", border: "1px solid var(--line)" }}>
          <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Environment</div>
          <div className="font-mono text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
            <div><strong style={{ color: "var(--ink)" }}>User-Agent:</strong> {ua}</div>
            <div><strong style={{ color: "var(--ink)" }}>Language:</strong> {lang}</div>
            <div><strong style={{ color: "var(--ink)" }}>Network:</strong> {conn}</div>
            <div><strong style={{ color: "var(--ink)" }}>Time:</strong> {new Date().toISOString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
