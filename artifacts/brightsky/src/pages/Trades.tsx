import { useState } from "react";
import {
  useListTrades, useGetTradeSummary,
  getListTradesQueryKey, getGetTradeSummaryQueryKey
} from "@workspace/api-client-react";
import { BarChart2, ExternalLink } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  EXECUTED: "text-primary bg-primary/10 border-primary/20",
  PENDING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  FAILED: "text-destructive bg-destructive/10 border-destructive/20",
  REVERTED: "text-destructive bg-destructive/10 border-destructive/20",
};

const STATUS_OPTIONS = ["ALL", "EXECUTED", "PENDING", "FAILED", "REVERTED"];

export default function Trades() {
  const [filterStatus, setFilterStatus] = useState("ALL");

  const params = filterStatus === "ALL" ? { limit: 100 } : { limit: 100, status: filterStatus };

  const { data: tradesData, isLoading } = useListTrades(params, {
    query: { refetchInterval: 5000, queryKey: getListTradesQueryKey(params) }
  });
  const { data: summary } = useGetTradeSummary({
    query: { refetchInterval: 5000, queryKey: getGetTradeSummaryQueryKey() }
  });

  const trades = tradesData?.trades ?? [];
  const total = tradesData?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 size={15} className="text-primary" />
        <h1 className="text-electric text-lg font-bold uppercase tracking-widest">Trade History</h1>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Profit", value: `${(summary?.totalProfitEth ?? 0).toFixed(4)} ETH`, sub: `$${(summary?.totalProfitUsd ?? 0).toFixed(2)}` },
          { label: "Total Trades", value: String(summary?.totalTrades ?? 0) },
          { label: "Win Rate", value: `${(summary?.successRate ?? 0).toFixed(1)}%` },
          { label: "Bribes Paid", value: `${(summary?.totalBribesPaid ?? 0).toFixed(4)} ETH` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="glass-panel border border-border rounded px-3 py-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
            <div className="text-sm font-bold text-foreground">{value}</div>
            {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            data-testid={`filter-${s.toLowerCase()}`}
            onClick={() => setFilterStatus(s)}
            className={`text-[10px] px-3 py-1.5 rounded border uppercase tracking-widest transition-all ${
              filterStatus === s
                ? "bg-primary/10 text-primary border-primary/30"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">{total} records</span>
      </div>

      {/* Table */}
      <div className="glass-panel border border-border rounded overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {["Time", "Status", "Pair", "Profit", "Bribe", "Latency", "Protocol", "Tx"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-normal whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-[10px] uppercase tracking-widest animate-pulse">Loading...</td></tr>
            )}
            {!isLoading && trades.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-[10px] uppercase tracking-widest">No trades yet — start the engine to begin</td></tr>
            )}
            {trades.map((t) => (
              <tr
                key={t.id}
                data-testid={`row-trade-${t.id}`}
                className="border-b border-border/50 hover:bg-white/3 transition-colors"
              >
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {new Date(t.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                </td>
                <td className="px-3 py-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded border uppercase tracking-widest ${STATUS_COLORS[t.status] ?? "text-muted-foreground border-border"}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {t.tokenIn && t.tokenOut ? `${t.tokenIn}→${t.tokenOut}` : "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {parseFloat(t.profit ?? "0") > 0 ? (
                    <span className="text-primary">{parseFloat(t.profit!).toFixed(5)} ETH</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {t.bribePaid && parseFloat(t.bribePaid) > 0 ? `${parseFloat(t.bribePaid).toFixed(5)}` : "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {t.latencyMs ? `${parseFloat(t.latencyMs as string).toFixed(1)}ms` : "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{t.protocol ?? "—"}</td>
                <td className="px-3 py-2">
                  {t.txHash ? (
                    <a
                      href={`https://etherscan.io/tx/${t.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-tx-${t.id}`}
                      className="text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      {t.txHash.slice(0, 8)}...
                      <ExternalLink size={10} />
                    </a>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
