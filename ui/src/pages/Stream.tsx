import { useGetTradeStream, getGetTradeStreamQueryKey } from "@workspace/api-client-react";
import { Radio, Zap } from "lucide-react";
import { useEffect, useRef } from "react";

const EVENT_COLORS: Record<string, string> = {
  SCANNING: "text-muted-foreground",
  DETECTED: "text-yellow-400",
  BRIBED: "text-orange-400",
  EXECUTED: "text-primary",
  FAILED: "text-destructive",
  REVERTED: "text-destructive",
};

const EVENT_LABELS: Record<string, string> = {
  SCANNING: "SCAN",
  DETECTED: "DETECT",
  BRIBED: "BRIBE",
  EXECUTED: "EXEC",
  FAILED: "FAIL",
  REVERTED: "REVERT",
};

export default function Stream() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetTradeStream({
    query: { refetchInterval: 2000, queryKey: getGetTradeStreamQueryKey() }
  });

  const events = data?.events ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Radio size={15} className="text-primary animate-pulse" />
        <h1 className="text-electric text-lg font-bold uppercase tracking-widest">Blockchain Stream</h1>
        <span className="ml-2 text-[10px] px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary uppercase tracking-widest">
          Live
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        Real-time arbitrage scanner — SCANNING → DETECTED → BRIBED → EXECUTED
      </p>

      <div
        ref={scrollRef}
        className="glass-panel border border-border rounded h-[calc(100vh-240px)] overflow-y-auto"
        data-testid="stream-log"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs uppercase tracking-widest animate-pulse">
            Connecting to scanner...
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs uppercase tracking-widest">
            No events — start the engine to begin scanning
          </div>
        )}

        <div className="p-4 space-y-1 font-mono text-xs">
          {events.map((evt) => {
            const isProfit = evt.type === "EXECUTED";
            return (
              <div
                key={evt.id}
                data-testid={`event-${evt.id}`}
                className={`flex items-start gap-3 px-3 py-2 rounded transition-all ${
                  isProfit ? "bg-primary/10 border border-primary/20" : "hover:bg-white/3"
                }`}
              >
                <span className="text-[9px] text-muted-foreground shrink-0 w-16 text-right mt-0.5">
                  {new Date(evt.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                </span>
                <span className={`text-[9px] font-bold w-14 shrink-0 uppercase ${EVENT_COLORS[evt.type] ?? "text-muted-foreground"}`}>
                  [{EVENT_LABELS[evt.type] ?? evt.type}]
                </span>
                <span className={`flex-1 ${isProfit ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {isProfit && <Zap size={10} className="inline mr-1 text-primary" />}
                  {evt.message}
                </span>
                {evt.blockNumber && (
                  <span className="text-[9px] text-muted-foreground shrink-0">#{evt.blockNumber.toLocaleString()}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
