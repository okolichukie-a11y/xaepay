import React, { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, Loader2, FileText, ShieldCheck, Layers, Receipt, AlertTriangle, MoreHorizontal } from "lucide-react";

// =============================================================================
// PageVisuals — reusable code-driven visuals (SVG, CSS) for landing pages.
// No external image assets. Aesthetic consistent with the homepage redesign:
// ink + bone + lime + emerald, mono labels, premium tooling vibe.
// =============================================================================

// -----------------------------------------------------------------------------
// CorridorMap — abstract Nigeria-to-world network diagram for /?p=send-usd-ngn.
// Geometric, not literal. Big NGN hub on the right with currency endpoints on
// the left, connected by curved corridors with animated packets flowing both
// ways. Each packet completes one direction then loops.
// -----------------------------------------------------------------------------
export function CorridorMap() {
  const corridors = [
    { ccy: "USD", region: "United States", delay: 0,    color: "#0f5f3f" },
    { ccy: "GBP", region: "United Kingdom", delay: 0.4, color: "#0f5f3f" },
    { ccy: "EUR", region: "European Union", delay: 0.8, color: "#0f5f3f" },
    { ccy: "CNY", region: "China",          delay: 1.2, color: "#0f5f3f" },
    { ccy: "AED", region: "UAE",            delay: 1.6, color: "#0f5f3f" },
    { ccy: "INR", region: "India",          delay: 2.0, color: "#0f5f3f" },
  ];

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: "var(--ink)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: "var(--lime)", boxShadow: "0 0 8px var(--lime)" }} />
          <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--lime)" }}>Live corridor activity</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.4)" }}>NGN ↔ World · 6 routes</span>
      </div>

      <div className="relative px-4 py-8 sm:px-8 sm:py-10">
        <svg viewBox="0 0 600 320" className="w-full h-auto" style={{ maxHeight: "360px" }}>
          <defs>
            <radialGradient id="ngnGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#c5f24a" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#c5f24a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#c5f24a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="endpointGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#34d399" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* NGN hub (right) */}
          <g transform="translate(490 160)">
            <circle r="60" fill="url(#ngnGlow)" />
            <circle r="38" fill="rgba(197,242,74,0.08)" stroke="rgba(197,242,74,0.4)" strokeWidth="1" />
            <circle r="38" fill="none" stroke="#c5f24a" strokeWidth="2" strokeDasharray="4 4" opacity="0.5">
              <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite" />
            </circle>
            <text textAnchor="middle" y="-3" style={{ fontFamily: "ui-monospace, monospace", fontSize: "18px", fontWeight: 600, fill: "#c5f24a" }}>NGN</text>
            <text textAnchor="middle" y="14" style={{ fontFamily: "ui-monospace, monospace", fontSize: "9px", fill: "rgba(197,242,74,0.7)", letterSpacing: "0.1em" }}>NIGERIA</text>
          </g>

          {/* Currency endpoints (left, stacked vertically) */}
          {corridors.map((c, i) => {
            const y = 40 + i * 48;
            const x = 90;
            const pathId = `corridor-${i}`;
            // S-curve from endpoint to NGN hub
            const ctrlX1 = 230;
            const ctrlX2 = 380;
            const path = `M ${x + 24} ${y} C ${ctrlX1} ${y}, ${ctrlX2} 160, ${452} 160`;
            return (
              <g key={c.ccy}>
                {/* Connecting corridor line */}
                <path id={pathId} d={path} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                <path d={path} fill="none" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.6">
                  <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="3s" repeatCount="indefinite" />
                </path>

                {/* Outbound packet (NGN -> currency) */}
                <circle r="3" fill="#c5f24a">
                  <animateMotion dur="4s" repeatCount="indefinite" begin={`${c.delay}s`} keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                    <mpath href={`#${pathId}`} />
                  </animateMotion>
                </circle>

                {/* Inbound packet (currency -> NGN) */}
                <circle r="3" fill="#34d399">
                  <animateMotion dur="4s" repeatCount="indefinite" begin={`${c.delay + 2}s`}>
                    <mpath href={`#${pathId}`} />
                  </animateMotion>
                </circle>

                {/* Endpoint node */}
                <circle cx={x} cy={y} r="20" fill="url(#endpointGlow)" />
                <circle cx={x} cy={y} r="14" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.4)" strokeWidth="1" />
                <text x={x} y={y + 3} textAnchor="middle" style={{ fontFamily: "ui-monospace, monospace", fontSize: "9.5px", fontWeight: 600, fill: "#34d399" }}>{c.ccy}</text>

                {/* Region label */}
                <text x={x - 30} y={y + 3} textAnchor="end" style={{ fontFamily: "ui-monospace, monospace", fontSize: "9px", fill: "rgba(247,245,240,0.45)" }}>{c.region}</text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[10px] flex-wrap" style={{ color: "rgba(247,245,240,0.5)" }}>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#c5f24a" }} />
            <span className="font-mono uppercase tracking-wider">Outbound · NGN → world</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#34d399" }} />
            <span className="font-mono uppercase tracking-wider">Inbound · world → NGN</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.4)" }}>Routed through licensed BDC + provider</span>
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--lime)" }}>Locked rate · same-day settlement</span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// BrowserMockup — generic wrapper that renders fake browser chrome around any
// child content. Used to give marketing pages a "here's the product" feel
// without screenshots (which would be locale-specific and rot).
// -----------------------------------------------------------------------------
export function BrowserMockup({ url = "xaepay.com/dashboard", title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "white", border: "1px solid var(--line)" }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "#f4f1ea", borderBottom: "1px solid var(--line)" }}>
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#fc625d" }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#fdbc40" }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#35cd4b" }} />
        </div>
        <div className="flex-1 mx-3 rounded-md px-2.5 py-0.5 text-[11px] font-mono text-center" style={{ background: "white", border: "1px solid var(--line)", color: "var(--muted)" }}>
          {url}
        </div>
        {title && <div className="font-mono text-[10px] uppercase tracking-wider hidden sm:inline" style={{ color: "var(--muted)" }}>{title}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// OperatorDashboardMockup — fake operator dashboard view. Shows what an
// operator sees when they sign in: stats strip, recent quotes, compliance
// reminders. Realistic but generic — no real customer data.
// -----------------------------------------------------------------------------
export function OperatorDashboardMockup() {
  return (
    <BrowserMockup url="xaepay.com/dashboard" title="Operator dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr]" style={{ background: "var(--paper)" }}>
        {/* Sidebar */}
        <div className="hidden lg:block px-3 py-4 space-y-1" style={{ background: "var(--bone)", borderRight: "1px solid var(--line)" }}>
          <div className="font-mono text-[10px] uppercase tracking-wider px-2 mb-3" style={{ color: "var(--muted)" }}>Operator · Adaeze</div>
          {[
            { label: "Quotes", count: 12, active: true },
            { label: "Transactions", count: 84 },
            { label: "Customers", count: 31 },
            { label: "Recipients", count: 47 },
            { label: "Reports", count: null },
            { label: "Brand", count: null },
          ].map((m) => (
            <div key={m.label} className="flex items-center justify-between px-2 py-1.5 rounded-md text-xs" style={{ background: m.active ? "var(--ink)" : "transparent", color: m.active ? "var(--bone)" : "var(--ink)" }}>
              <span className="font-medium">{m.label}</span>
              {m.count !== null && <span className="font-mono text-[10px] opacity-70">{m.count}</span>}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "This month", value: "₦142M", sub: "+18% vs last" },
              { label: "Active customers", value: "31", sub: "5 onboarded this week" },
              { label: "Your share", value: "$1,847", sub: "biweekly payout · Fri" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-3" style={{ background: "white", border: "1px solid var(--line)" }}>
                <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{s.label}</div>
                <div className="font-display text-lg sm:text-xl font-semibold mt-0.5">{s.value}</div>
                <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--emerald)" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Quotes table */}
          <div className="rounded-lg overflow-hidden" style={{ background: "white", border: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid var(--line)", background: "var(--bone)" }}>
              <span className="font-display text-xs font-semibold">Pending quotes</span>
              <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>3 awaiting action</span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--line)" }}>
              {[
                { ref: "QU-A4F7", customer: "Lagos Imports Co.", amount: "$25,000", status: "review", tier: "Documented" },
                { ref: "QU-B12C", customer: "Adekunle Foods", amount: "£8,400", status: "quoted", tier: "Verified" },
                { ref: "QU-D8E1", customer: "TechHaven NG", amount: "€12,500", status: "settled", tier: "Pro" },
              ].map((q) => (
                <div key={q.ref} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                  <div className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{q.ref}</div>
                  <div className="flex-1 truncate">{q.customer}</div>
                  <div className="font-mono text-[11px] font-semibold">{q.amount}</div>
                  <span className="rounded-md px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider hidden sm:inline" style={{ background: "var(--bone)", color: "var(--muted)", border: "1px solid var(--line)" }}>{q.tier}</span>
                  <span className="rounded-md px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider" style={{
                    background: q.status === "settled" ? "rgba(15,95,63,0.1)" : q.status === "review" ? "#fef3c7" : "var(--bone)",
                    color: q.status === "settled" ? "var(--emerald)" : q.status === "review" ? "#92400e" : "var(--ink)",
                  }}>{q.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance reminders */}
          <div className="rounded-lg p-3" style={{ background: "white", border: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "#fef3c7" }}>
                <AlertTriangle size={11} style={{ color: "#92400e" }} />
              </div>
              <span className="font-display text-xs font-semibold">Compliance reminders</span>
              <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>· 2 open · agent-detected</span>
            </div>
            <div className="space-y-1.5 ml-8">
              <div className="text-[11px]" style={{ color: "var(--ink)" }}>Adekunle Foods · ID expires in 21 days</div>
              <div className="text-[11px]" style={{ color: "var(--ink)" }}>QU-B12C · invoice flagged for review · Risk: medium</div>
            </div>
          </div>
        </div>
      </div>
    </BrowserMockup>
  );
}

// -----------------------------------------------------------------------------
// FlowPipeline — horizontal version of the AgentPipeline aesthetic. Used as a
// drop-in replacement for the "Step 01/02/03" cards on landing pages. Renders
// connected nodes that animate in sequence, with optional captions.
// -----------------------------------------------------------------------------
export function FlowPipeline({ steps }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setActive((s) => (s + 1) % (steps.length + 1)), 2500);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  return (
    <div className="rounded-2xl p-4 sm:p-6" style={{ background: "var(--ink)", border: "1px solid var(--line)" }}>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
        {steps.map((s, i) => {
          const isActive = i === active;
          const isDone = i < active;
          const isPending = i > active;
          return (
            <div key={s.n} className="relative">
              <div className="rounded-xl p-3 sm:p-4 transition-all duration-500" style={{
                background: isActive ? "rgba(197,242,74,0.06)" : "transparent",
                border: `1px solid ${isActive ? "rgba(197,242,74,0.4)" : "rgba(255,255,255,0.06)"}`,
                boxShadow: isActive ? "0 0 24px rgba(197,242,74,0.12)" : "none",
                minHeight: "140px",
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{
                    background: isActive ? "var(--lime)" : isDone ? "rgba(197,242,74,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isActive ? "var(--lime)" : isDone ? "rgba(197,242,74,0.3)" : "rgba(255,255,255,0.1)"}`,
                  }}>
                    {isDone ? <CheckCircle2 size={11} style={{ color: "var(--lime)" }} strokeWidth={2.5} /> : <span className="font-mono text-[9px] font-bold" style={{ color: isActive ? "var(--ink)" : "rgba(255,255,255,0.4)" }}>{s.n}</span>}
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: isActive ? "var(--lime)" : isPending ? "rgba(247,245,240,0.25)" : "rgba(247,245,240,0.5)" }}>
                    {isActive ? "Active" : isDone ? "Done" : "Next"}
                  </span>
                </div>
                <div className="font-display text-sm font-semibold mb-1" style={{ color: isPending ? "rgba(247,245,240,0.4)" : "var(--bone)" }}>{s.title}</div>
                <div className="text-[11px] leading-relaxed" style={{ color: isPending ? "rgba(247,245,240,0.25)" : "rgba(247,245,240,0.6)" }}>{s.body}</div>
                {s.footer && <div className="mt-2 pt-2 font-mono text-[9px] uppercase tracking-wider" style={{ color: "rgba(247,245,240,0.3)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>{s.footer}</div>}
              </div>
              {/* Connector arrow to next step */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-1/2 -right-2 z-10" style={{ transform: "translateY(-50%)" }}>
                  <ArrowRight size={14} style={{ color: isDone ? "var(--lime)" : "rgba(255,255,255,0.15)" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
