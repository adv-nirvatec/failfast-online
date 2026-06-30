"use client";

import { useState } from "react";

const SECTION_META: Record<string, { color: string; icon: string }> = {
  frontend: { color: "#8b5cf6", icon: "🎨" },
  backend: { color: "#06b6d4", icon: "⚙️" },
  database: { color: "#f97316", icon: "🗄️" },
  infrastructure: { color: "#f59e0b", icon: "☁️" },
  integrations: { color: "#10b981", icon: "🔌" },
};

export function TechStackView({ techStack }: { techStack: any }) {
  if (!techStack) return null;
  const ts = techStack.techStack;
  if (!ts) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#c4c4d8] leading-relaxed">{ts.summarySentence}</p>
      {(["frontend", "backend", "database", "infrastructure", "integrations"] as const).map((section) => {
        const items = ts[section];
        if (!items || items.length === 0) return null;
        const meta = SECTION_META[section] || { color: "#9090a8", icon: "📦" };
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

      <div className="grid grid-cols-3 gap-4 rounded-xl bg-[#0a0a0f]/50 border border-[#1e1e2e] p-4">
        <div className="text-center">
          <p className="text-xs text-[#606080]">MVP Cost</p>
          <p className="text-lg font-bold text-[#10b981]">{ts.mvpCost || "N/A"}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[#606080]">At Scale</p>
          <p className="text-lg font-bold text-[#f59e0b]">{ts.scaleUpCost || "N/A"}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[#606080]">Time to MVP</p>
          <p className="text-lg font-bold text-[#6C63FF]">{ts.timeToMvp || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}

export function BlueprintDocsList({ docs, hasFull }: { docs: any[]; hasFull: boolean }) {
  if (!docs || docs.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">📄</span>
        <h4 className="text-sm font-semibold text-white">Blueprint Documents</h4>
        <StatusBadge hasFull={hasFull} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {docs.map((doc: any, i: number) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-[#1e1e2e] bg-[#0a0a0f]/60 px-4 py-3">
            <div className="w-7 h-7 rounded-md bg-[#1e1e2e] flex items-center justify-center shrink-0 mt-0.5">
              {hasFull ? (
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
  );
}

function StatusBadge({ hasFull }: { hasFull: boolean }) {
  if (hasFull) {
    return (
      <span className="ml-auto rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-medium text-[#10b981]">
        Complete
      </span>
    );
  }
  return (
    <span className="ml-auto rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-medium text-[#f59e0b]">
      Pending
    </span>
  );
}

export function FullBlueprintTabs({ blueprint }: { blueprint: any }) {
  const [tab, setTab] = useState<string>("architecture");

  const tabs = [
    { key: "architecture", label: "🏗️ Architecture", content: blueprint.architecture },
    { key: "schema", label: "🗄️ Database", content: blueprint.databaseSchema },
    { key: "api", label: "🔌 API", content: blueprint.apiDesign },
    { key: "phases", label: "📋 Build", content: blueprint.mvpPhases },
    { key: "scale", label: "📈 Scale", content: blueprint.scaleUpPhases },
    { key: "costs", label: "💰 Costs", content: blueprint.costBreakdown },
    { key: "security", label: "🔐 Security", content: blueprint.securityCompliance },
    { key: "gtm", label: "🚀 GTM", content: blueprint.goToMarket },
  ].filter((t) => t.content);

  if (tabs.length === 0) return null;

  const active = tabs.find((t) => t.key === tab) || tabs[0];

  return (
    <div className="rounded-xl border border-[#6C63FF]/20 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-[#1e1e2e] bg-[#0a0a0f]/50">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-3 sm:px-4 py-2.5 text-xs font-medium transition-all whitespace-nowrap ${
              tab === t.key
                ? "text-[#a5a0ff] border-b-2 border-[#6C63FF] bg-[#6C63FF]/5"
                : "text-[#606080] hover:text-[#9090a8]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
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
      <div className="text-[#c4c4d8] text-xs leading-relaxed">
        {content.overview?.split("\n").map((line: string, i: number) => (
          <p key={i} className="mb-2">{line}</p>
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
          <h5 className="text-xs font-semibold text-[#6C63FF] mb-2">📋 Compliance</h5>
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
