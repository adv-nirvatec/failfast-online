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
  created_at: string;
}

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
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          bp.status === "assigned" 
                            ? "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20"
                            : "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20"
                        }`}>
                          {bp.status}
                        </span>
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
                    <div className="border-t border-[#1e1e2e] px-6 py-6 space-y-5">
                      <p className="text-sm text-[#c4c4d8] leading-relaxed">{ts.summarySentence}</p>

                      {/* Tech Layers */}
                      <div className="space-y-4">
                        {(["frontend", "backend", "database", "infrastructure", "integrations"] as const).map((section) => {
                          const items = ts[section];
                          if (!items || items.length === 0) return null;
                          const colors: Record<string, string> = {
                            frontend: "#8b5cf6", backend: "#06b6d4", database: "#f97316",
                            infrastructure: "#f59e0b", integrations: "#10b981",
                          };
                          return (
                            <div key={section}>
                              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors[section] }}>
                                {section}
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
                      </div>

                      {/* Stats */}
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
