"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Blueprint {
  id: string;
  app_name: string;
  app_description: string;
  industry: string | null;
  status: string;
  tech_stack: any;
  full_blueprint: any;
  created_at: string;
}

const SECTION_META: Record<string, { color: string; icon: string }> = {
  frontend: { color: "#8b5cf6", icon: "🎨" },
  backend: { color: "#06b6d4", icon: "⚙️" },
  database: { color: "#f97316", icon: "🗄️" },
  infrastructure: { color: "#f59e0b", icon: "☁️" },
  integrations: { color: "#10b981", icon: "🔌" },
};

export default function ClientDashboard() {
  const router = useRouter();
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/client/blueprints");
        if (res.status === 401) {
          router.push("/portal/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load blueprints");
        setBlueprints(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#6C63FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-[#1e1e2e] bg-[#111118]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧬</span>
            <div>
              <h1 className="text-lg font-bold text-white">My Blueprints</h1>
              <p className="text-xs text-[#9090a8]">Client Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#9090a8] hover:text-white transition-colors">
              Generator
            </Link>
            <button onClick={handleLogout} className="text-sm text-[#606080] hover:text-[#ef4444] transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/5 px-4 py-3 text-sm text-[#ef4444] mb-6">
            {error}
          </div>
        )}

        {blueprints.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#1e1e2e] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#606080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Blueprints Assigned Yet</h2>
            <p className="text-[#9090a8] max-w-md mx-auto">
              Your blueprints will appear here once a Nirvatec team member assigns them to your account.
              This usually happens after your consult.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #6C63FF, #7b73ff)" }}
            >
              Generate a Blueprint
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {blueprints.map((bp) => {
              const ts = bp.tech_stack?.techStack;
              const docs = bp.tech_stack?.blueprintDocuments;
              const fullBp = bp.full_blueprint;
              const isExpanded = expanded === bp.id;

              return (
                <div
                  key={bp.id}
                  className="rounded-2xl border border-[#1e1e2e] bg-[#111118] overflow-hidden"
                >
                  {/* Summary Row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : bp.id)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#161622] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white">{bp.app_name}</h3>
                        <StatusBadge status={bp.status} fullBlueprint={!!fullBp} />
                      </div>
                      <p className="text-sm text-[#9090a8] line-clamp-1">{bp.app_description}</p>
                      {ts && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-[#606080]">
                          <span>💰 {ts.mvpCost}</span>
                          <span>⏱ {ts.timeToMvp}</span>
                          <span>🕐 {new Date(bp.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-[#606080] transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && ts && (
                    <div className="border-t border-[#1e1e2e] px-6 py-6 space-y-6">
                      {/* Summary */}
                      <p className="text-sm text-[#c4c4d8] leading-relaxed">{ts.summarySentence}</p>

                      {/* Tech Stack Layers */}
                      {(["frontend", "backend", "database", "infrastructure", "integrations"] as const).map((section) => {
                        const items = ts[section];
                        if (!items || items.length === 0) return null;
                        const meta = SECTION_META[section];
                        return (
                          <div key={section}>
                            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: meta.color }}>
                              {meta.icon} {section}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {items.map((item: any, i: number) => (
                                <div key={i} className="rounded-lg border border-[#1e1e2e] bg-[#0a0a0f]/60 px-4 py-3">
                                  <p className="text-xs text-[#9090a8]">{item.layer}</p>
                                  <p className="text-sm font-semibold text-white">{item.tech}</p>
                                  <p className="text-xs text-[#606080] mt-0.5">{item.reason}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Stats Bar */}
                      <div className="grid grid-cols-3 gap-4 rounded-xl bg-[#0a0a0f]/50 border border-[#1e1e2e] p-4">
                        <div className="text-center">
                          <p className="text-xs text-[#606080]">MVP Cost</p>
                          <p className="text-lg font-bold text-[#10b981]">{ts.mvpCost}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[#606080]">At Scale</p>
                          <p className="text-lg font-bold text-[#f59e0b]">{ts.scaleUpCost}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[#606080]">Time to MVP</p>
                          <p className="text-lg font-bold text-[#6C63FF]">{ts.timeToMvp}</p>
                        </div>
                      </div>

                      {/* Blueprint Documents (Locked) */}
                      {docs && docs.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-base">📄</span>
                            <h4 className="text-sm font-semibold text-white">Blueprint Documents</h4>
                            {!fullBp && (
                              <span className="ml-auto rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-medium text-[#f59e0b]">
                                Pending
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {docs.map((doc: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-3 rounded-lg border border-[#1e1e2e] bg-[#0a0a0f]/60 px-4 py-3"
                              >
                                <div className="w-7 h-7 rounded-md bg-[#1e1e2e] flex items-center justify-center shrink-0 mt-0.5">
                                  {fullBp ? (
                                    <svg className="w-3.5 h-3.5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5 text-[#606080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-white">{doc.title}</p>
                                  <p className="text-[10px] text-[#606080] mt-0.5">{doc.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full Blueprint Content (when generated) */}
                      {fullBp && (
                        <FullBlueprintContent blueprint={fullBp} />
                      )}

                      {/* Build CTA */}
                      {fullBp && (
                        <div className="rounded-xl border border-[#10b981]/20 bg-gradient-to-br from-[#10b981]/5 to-[#6C63FF]/5 p-5 text-center">
                          <h4 className="text-base font-bold text-white mb-2">🚀 Ready to Build?</h4>
                          <p className="text-sm text-[#9090a8] mb-4 max-w-md mx-auto">
                            Our AI agent Katsu can take this blueprint and build the MVP.
                            The Nirvatec team will configure the Lighthouse server and deploy your app.
                          </p>
                          <a
                            href={`mailto:adv@nirvatec.com?subject=Build My MVP: ${encodeURIComponent(bp.app_name)}&body=I'd like to proceed with building the MVP for ${bp.app_name} (Blueprint ID: ${bp.id}). Please reach out to discuss timeline and pricing.`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200"
                            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                          >
                            🔨 Request MVP Build
                          </a>
                        </div>
                      )}
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

/* ─── Status Badge ─── */

function StatusBadge({ status, fullBlueprint }: { status: string; fullBlueprint: boolean }) {
  if (status === "full" || fullBlueprint) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#6C63FF]/10 text-[#a5a0ff] border border-[#6C63FF]/20">
        Complete
      </span>
    );
  }
  if (status === "assigned") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
        Assigned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
      Partial
    </span>
  );
}

/* ─── Full Blueprint Content ─── */

function FullBlueprintContent({ blueprint }: { blueprint: any }) {
  const [tab, setTab] = useState<string>("architecture");

  const tabs = [
    { key: "architecture", label: "🏗️ Architecture", content: blueprint.architecture },
    { key: "schema", label: "🗄️ Database", content: blueprint.databaseSchema },
    { key: "api", label: "🔌 API Design", content: blueprint.apiDesign },
    { key: "phases", label: "📋 Build Phases", content: blueprint.mvpPhases },
    { key: "scale", label: "📈 Scale-Up", content: blueprint.scaleUpPhases },
    { key: "costs", label: "💰 Costs", content: blueprint.costBreakdown },
    { key: "security", label: "🔐 Security", content: blueprint.securityCompliance },
    { key: "gtm", label: "🚀 Go to Market", content: blueprint.goToMarket },
  ].filter((t) => t.content);

  if (tabs.length === 0) return null;

  const active = tabs.find((t) => t.key === tab) || tabs[0];

  return (
    <div className="rounded-xl border border-[#6C63FF]/20 overflow-hidden">
      {/* Tab Bar */}
      <div className="flex overflow-x-auto border-b border-[#1e1e2e] bg-[#0a0a0f]/50">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2.5 text-xs font-medium transition-all whitespace-nowrap ${
              tab === t.key
                ? "text-[#a5a0ff] border-b-2 border-[#6C63FF] bg-[#6C63FF]/5"
                : "text-[#606080] hover:text-[#9090a8]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5 max-h-[500px] overflow-y-auto">
        {active.key === "architecture" && <ArchitectureTab content={active.content} />}
        {active.key === "schema" && <SchemaTab content={active.content} />}
        {active.key === "api" && <ApiTab content={active.content} />}
        {active.key === "phases" && <PhasesTab content={active.content} />}
        {active.key === "scale" && <ScaleTab content={active.content} />}
        {active.key === "costs" && <CostsTab content={active.content} />}
        {active.key === "security" && <SecurityTab content={active.content} />}
        {active.key === "gtm" && <GtmTab content={active.content} />}
      </div>
    </div>
  );
}

/* ─── Tab Renderers ─── */

function ArchitectureTab({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      <div className="prose prose-invert prose-sm max-w-none text-[#c4c4d8] leading-relaxed">
        {content.overview?.split("\n").map((line: string, i: number) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      {content.diagram && (
        <pre className="rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] p-4 text-[10px] sm:text-xs font-mono text-[#10b981] overflow-x-auto leading-tight">
          {content.diagram}
        </pre>
      )}
    </div>
  );
}

function SchemaTab({ content }: { content: any }) {
  const tables = content.tables || [];
  return (
    <div className="space-y-4">
      {tables.map((table: any, i: number) => (
        <div key={i} className="rounded-lg border border-[#1e1e2e] overflow-hidden">
          <div className="bg-[#0a0a0f]/80 px-4 py-2 border-b border-[#1e1e2e] flex items-center justify-between">
            <span className="text-sm font-semibold text-white">{table.name}</span>
            <span className="text-[10px] text-[#9090a8]">{table.purpose}</span>
          </div>
          <pre className="p-4 text-[10px] sm:text-xs font-mono text-[#10b981] overflow-x-auto bg-[#0a0a0f]/40">
            {table.sql}
          </pre>
        </div>
      ))}
    </div>
  );
}

function ApiTab({ content }: { content: any }) {
  const endpoints = content.endpoints || [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#1e1e2e]">
            <th className="text-left py-2 px-3 text-[#9090a8] font-medium">Method</th>
            <th className="text-left py-2 px-3 text-[#9090a8] font-medium">Path</th>
            <th className="text-left py-2 px-3 text-[#9090a8] font-medium">Purpose</th>
            <th className="text-left py-2 px-3 text-[#9090a8] font-medium">Auth</th>
          </tr>
        </thead>
        <tbody>
          {endpoints.map((ep: any, i: number) => (
            <tr key={i} className="border-b border-[#1e1e2e]/50 hover:bg-[#0a0a0f]/30">
              <td className="py-2 px-3">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                  ep.method === "GET" ? "bg-[#10b981]/10 text-[#10b981]" :
                  ep.method === "POST" ? "bg-[#6C63FF]/10 text-[#a5a0ff]" :
                  ep.method === "PUT" || ep.method === "PATCH" ? "bg-[#f59e0b]/10 text-[#f59e0b]" :
                  "bg-[#ef4444]/10 text-[#ef4444]"
                }`}>
                  {ep.method}
                </span>
              </td>
              <td className="py-2 px-3 font-mono text-[10px] text-[#c4c4d8]">{ep.path}</td>
              <td className="py-2 px-3 text-[#9090a8]">{ep.purpose}</td>
              <td className="py-2 px-3 text-[#606080]">{ep.auth}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PhasesTab({ content }: { content: any }) {
  const phases = Array.isArray(content) ? content : [];
  return (
    <div className="space-y-4">
      {phases.map((phase: any, i: number) => (
        <div key={i} className="rounded-lg border border-[#1e1e2e] bg-[#0a0a0f]/60 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-lg bg-[#6C63FF] flex items-center justify-center text-xs font-bold text-white">
              {phase.phase || i + 1}
            </span>
            <div>
              <h5 className="text-sm font-semibold text-white">{phase.name}</h5>
              <p className="text-[10px] text-[#9090a8]">{phase.weeks} — {phase.goal}</p>
            </div>
          </div>
          <ul className="space-y-1 ml-10">
            {(phase.items || []).map((item: string, j: number) => (
              <li key={j} className="text-xs text-[#9090a8] flex items-start gap-2">
                <span className="text-[#10b981] mt-0.5">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ScaleTab({ content }: { content: any }) {
  const phases = Array.isArray(content) ? content : [];
  return (
    <div className="space-y-4">
      {phases.map((phase: any, i: number) => (
        <div key={i} className="rounded-lg border border-[#1e1e2e] bg-[#0a0a0f]/60 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">{i === 0 ? "📈" : "🚀"}</span>
            <div>
              <h5 className="text-sm font-semibold text-white">{phase.name}</h5>
              <p className="text-[10px] text-[#f59e0b]">Trigger: {phase.trigger}</p>
            </div>
          </div>
          <ul className="space-y-1 ml-9">
            {(phase.changes || []).map((change: string, j: number) => (
              <li key={j} className="text-xs text-[#9090a8] flex items-start gap-2">
                <span className="text-[#f59e0b] mt-0.5">→</span> {change}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function CostsTab({ content }: { content: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <h5 className="text-xs font-semibold text-[#10b981] mb-3">💚 MVP Costs</h5>
        <div className="space-y-2">
          {(content.mvp || []).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-[#0a0a0f]/60 px-3 py-2">
              <span className="text-xs text-[#9090a8]">{item.item}</span>
              <span className="text-xs font-mono font-bold text-[#10b981]">{item.monthly}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h5 className="text-xs font-semibold text-[#f59e0b] mb-3">⚡ At Scale</h5>
        <div className="space-y-2">
          {(content.scaleUp || []).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-[#0a0a0f]/60 px-3 py-2">
              <span className="text-xs text-[#9090a8]">{item.item}</span>
              <span className="text-xs font-mono font-bold text-[#f59e0b]">{item.monthly}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecurityTab({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      <div>
        <h5 className="text-xs font-semibold text-[#6C63FF] mb-2">🛡️ Security Measures</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(content.measures || []).map((m: string, i: number) => (
            <div key={i} className="rounded-lg bg-[#0a0a0f]/60 px-3 py-2 text-xs text-[#9090a8] flex items-start gap-2">
              <span className="text-[#10b981] shrink-0">✓</span> {m}
            </div>
          ))}
        </div>
      </div>
      {content.complianceFrameworks?.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-[#6C63FF] mb-2">📋 Compliance Frameworks</h5>
          <div className="flex flex-wrap gap-2">
            {content.complianceFrameworks.map((f: string, i: number) => (
              <span key={i} className="rounded-full bg-[#6C63FF]/10 border border-[#6C63FF]/20 px-3 py-1 text-[11px] text-[#a5a0ff]">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GtmTab({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-[#0a0a0f]/60 p-4">
        <h5 className="text-xs font-semibold text-[#6C63FF] mb-2">Strategy</h5>
        <p className="text-sm text-[#c4c4d8] leading-relaxed">{content.launchStrategy}</p>
      </div>
      {content.targetChannels?.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-[#6C63FF] mb-2">Target Channels</h5>
          <div className="flex flex-wrap gap-2">
            {content.targetChannels.map((ch: string, i: number) => (
              <span key={i} className="rounded-lg bg-[#0a0a0f]/60 border border-[#1e1e2e] px-3 py-1.5 text-xs text-[#9090a8]">
                {ch}
              </span>
            ))}
          </div>
        </div>
      )}
      {content.monetization && (
        <div className="rounded-lg bg-[#0a0a0f]/60 p-4">
          <h5 className="text-xs font-semibold text-[#6C63FF] mb-2">Monetization</h5>
          <p className="text-sm text-[#c4c4d8]">{content.monetization}</p>
        </div>
      )}
    </div>
  );
}
