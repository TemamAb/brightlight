import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Activity, Radio, Wallet, Settings, BarChart2, Zap, Menu, X, ShieldCheck
} from "lucide-react";
import { useGetEngineStatus } from "@workspace/api-client-react";

const navItems = [
  { path: "/", label: "Telemetry", icon: Activity },
  { path: "/stream", label: "Stream", icon: Radio },
  { path: "/trades", label: "Trade History", icon: BarChart2 },
  { path: "/vault", label: "Vault", icon: Wallet },
  { path: "/audit", label: "Audit Report", icon: ShieldCheck },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: status } = useGetEngineStatus({ query: { refetchInterval: 2000 } });

  const isRunning = status?.running;
  const mode = status?.mode ?? "STOPPED";

  return (
    <div className="min-h-screen flex bg-background text-foreground font-mono">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 flex flex-col glass-panel border-r border-border
        transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:inset-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <img src="/logo.png" className="w-6 h-6 object-contain" alt="BrightSky Logo" />
          <span className="text-metallic-blue text-sm font-bold tracking-widest uppercase">BrightSky Elite</span>
        </div>

        {/* Engine status badge */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded border border-border glass-panel flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{mode}</span>
          {status?.running && (
            <span className="ml-auto text-[9px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded uppercase">Sim: OK</span>
          )}
          {status?.gaslessMode && !status?.running && (
            <span className="ml-auto text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wide">Gasless</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location === path;
            return (
              <Link
                key={path}
                href={path}
                data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded text-xs uppercase tracking-widest transition-all
                  ${active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }
                `}
              >
                <Icon size={13} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border text-[10px] text-muted-foreground uppercase tracking-wider">
          <div className={mode === "LIVE" ? "text-primary font-bold" : ""}>
            {mode} MODE ACTIVE
          </div>
          <div className="text-primary/70 mt-0.5">
            {status?.liveCapable ? "LIVE: PIMLICO READY" : "LIVE: KEY REQUIRED"}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border glass-panel">

          <div className="flex-1" />
          <div className="text-[10px] text-metallic-blue uppercase tracking-widest opacity-80">
            MEV Arbitrage Terminal v2.6
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="text-[10px] text-muted-foreground">
            {new Date().toLocaleTimeString("en-US", { hour12: false })}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
