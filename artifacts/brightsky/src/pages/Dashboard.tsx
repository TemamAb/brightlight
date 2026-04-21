import { useState } from "react";
import {
  useGetEngineStatus, useGetTelemetry, useGetTradeSummary,
  useStartEngine, useStopEngine, getGetEngineStatusQueryKey,
  getGetTelemetryQueryKey, getGetTradeSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Zap, Activity, Clock, TrendingUp, Shield, Power } from "lucide-react";

function MetricCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`glass-panel rounded border p-4 ${accent ? "border-primary/30 bg-primary/5" : "border-border"}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-electric" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"SHADOW" | "LIVE">("SHADOW");

  const { data: status, isLoading: statusLoading } = useGetEngineStatus({
    query: { refetchInterval: 2000, queryKey: getGetEngineStatusQueryKey() }
  });
  const { data: telemetry } = useGetTelemetry({
    query: { refetchInterval: 3000, queryKey: getGetTelemetryQueryKey() }
  });
  const { data: summary } = useGetTradeSummary({
    query: { refetchInterval: 5000, queryKey: getGetTradeSummaryQueryKey() }
  });

  const startEngine = useStartEngine({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetEngineStatusQueryKey() });
        qc.invalidateQueries({ queryKey: getGetTelemetryQueryKey() });
      }
    }
  });
  const stopEngine = useStopEngine({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetEngineStatusQueryKey() });
      }
    }
  });

  const isRunning = status?.running ?? false;
  const engineMode = status?.mode ?? "STOPPED";

  function handleEngineToggle() {
    if (isRunning) {
      stopEngine.mutate({});
    } else {
      startEngine.mutate({ data: { mode } });
    }
  }

  const sessionEth = telemetry?.sessionProfitEth?.toFixed(4) ?? "0.0000";
  const sessionUsd = telemetry?.sessionProfitUsd?.toFixed(2) ?? "0.00";
  const tph = telemetry?.tradesPerHour ?? 0;
  // Latency is now honest: real ms from actual DB query round-trips
  const p99Raw = telemetry?.p99LatencyMs;
  const avgRaw = telemetry?.avgLatencyMs;
  const p99 = p99Raw != null ? p99Raw.toFixed(1) : "—";
  const avgLatency = avgRaw != null ? avgRaw.toFixed(1) : "—";
  const latencyUnit = "ms"; // real unit — previous µs claim was fabricated
  const successRate = summary?.successRate?.toFixed(1) ?? "—";
  const totalProfitEth = summary?.totalProfitEth?.toFixed(4) ?? "0.0000";
  const totalProfitUsd = summary?.totalProfitUsd?.toFixed(2) ?? "0.00";

  const profitHistory = telemetry?.profitHistory ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-electric text-lg font-bold uppercase tracking-widest flex items-center gap-2">
            <Zap size={16} />
            Telemetry Center
          </h1>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
            Real-time arbitrage intelligence — Gasless via Pimlico Paymaster
          </p>
        </div>

        {/* Engine control */}
        <div className="flex items-center gap-3 glass-panel border border-border rounded px-4 py-3">
          {!isRunning && (
            <div className="flex items-center gap-2">
              {(["SHADOW", "LIVE"] as const).map(m => (
                <button
                  key={m}
                  data-testid={`button-mode-${m.toLowerCase()}`}
                  onClick={() => setMode(m)}
                  className={`text-[10px] px-3 py-1.5 rounded uppercase tracking-widest border transition-all ${
                    mode === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
          <button
            data-testid="button-engine-toggle"
            onClick={handleEngineToggle}
            disabled={startEngine.isPending || stopEngine.isPending}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-all border ${
              isRunning
                ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
            }`}
          >
            <Power size={11} />
            {isRunning ? "Stop Engine" : "Start Engine"}
          </button>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
            <span className="text-[10px] text-muted-foreground uppercase">{engineMode}</span>
          </div>
        </div>
      </div>

      {/* Gasless notice */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded border border-primary/20 bg-primary/5 glass-panel">
        <Shield size={13} className="text-primary shrink-0" />
        <span className="text-[11px] text-primary/80">
          Gasless mode active — Start trading with $0 pre-funded wallet. Transaction fees sponsored by Pimlico Paymaster.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Session Profit"
          value={`${sessionEth} ETH`}
          sub={`$${sessionUsd} USD`}
          accent
        />
        <MetricCard
          label="Trades / Hour"
          value={String(tph)}
          sub={`${summary?.totalTrades ?? 0} total`}
        />
        <MetricCard
          label="P99 Latency"
          value={p99 !== "—" ? `${p99}ms` : "—"}
          sub={avgLatency !== "—" ? `avg ${avgLatency}ms` : "real measured"}
        />
        <MetricCard
          label="Win Rate"
          value={successRate === "—" ? "—" : `${successRate}%`}
          sub={summary?.topProtocol ?? "—"}
        />
      </div>

      {/* Profit chart */}
      <div className="glass-panel border border-border rounded p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={13} className="text-primary" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Profit History (1h)</span>
          <span className="ml-auto text-electric text-sm font-bold">{totalProfitEth} ETH</span>
          <span className="text-[11px] text-muted-foreground">${totalProfitUsd}</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={profitHistory}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(148 87% 57%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(148 87% 57%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(220 15% 60%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(220 15% 60%)" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: "hsl(220 20% 8%)", border: "1px solid hsl(220 15% 15%)", borderRadius: 4, fontSize: 10 }}
              labelStyle={{ color: "hsl(220 15% 60%)" }}
              itemStyle={{ color: "hsl(148 87% 57%)" }}
              formatter={(v: number) => [`${v.toFixed(6)} ETH`, "Profit"]}
            />
            <Area type="monotone" dataKey="eth" stroke="hsl(148 87% 57%)" strokeWidth={2} fill="url(#profitGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* System metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Blocks Scanned" value={(telemetry?.blocksScanned ?? 0).toLocaleString()} />
        <MetricCard label="Opportunities" value={(telemetry?.opportunitiesDetected ?? 0).toLocaleString()} sub="detected" />
        <MetricCard label="Executed" value={(telemetry?.opportunitiesExecuted ?? 0).toLocaleString()} sub="profitable" />
        <MetricCard label="Uptime" value={formatUptime(telemetry?.uptimeSeconds ?? 0)} />
      </div>
    </div>
  );
}

function formatUptime(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}
