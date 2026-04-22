import { useState, useEffect } from "react";
import {
  useGetSettings, useUpdateSettings,
  getGetSettingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";

const AVAILABLE_PROTOCOLS = ["uniswap_v3", "aave_v3", "balancer", "curve", "compound_v3", "1inch", "paraswap"];

export default function SettingsPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [local, setLocal] = useState({
    flashLoanSizeEth: 100,
    minMarginPct: 15,
    maxBribePct: 5,
    simulationMode: true,
    maxSlippagePct: 0.5,
    targetProtocols: ["uniswap_v3", "aave_v3", "balancer"],
    openaiApiKey: "",
    pimlicoApiKey: "",
  });

  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });

  useEffect(() => {
    if (settings) {
      setLocal({
        flashLoanSizeEth: settings.flashLoanSizeEth,
        minMarginPct: settings.minMarginPct,
        maxBribePct: settings.maxBribePct,
        simulationMode: settings.simulationMode,
        maxSlippagePct: settings.maxSlippagePct,
        targetProtocols: settings.targetProtocols ?? [],
        openaiApiKey: "",
        pimlicoApiKey: "",
      });
    }
  }, [settings]);

  const updateSettings = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    }
  });

  function handleSave() {
    const data: Record<string, unknown> = {
      flashLoanSizeEth: local.flashLoanSizeEth,
      minMarginPct: local.minMarginPct,
      maxBribePct: local.maxBribePct,
      simulationMode: local.simulationMode,
      maxSlippagePct: local.maxSlippagePct,
      targetProtocols: local.targetProtocols,
    };
    if (local.openaiApiKey) data.openaiApiKey = local.openaiApiKey;
    if (local.pimlicoApiKey) data.pimlicoApiKey = local.pimlicoApiKey;
    updateSettings.mutate({ data: data as Parameters<typeof updateSettings.mutate>[0]["data"] });
  }

  function toggleProtocol(p: string) {
    setLocal(prev => ({
      ...prev,
      targetProtocols: prev.targetProtocols.includes(p)
        ? prev.targetProtocols.filter(x => x !== p)
        : [...prev.targetProtocols, p]
    }));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings size={15} className="text-primary" />
        <h1 className="text-electric text-lg font-bold uppercase tracking-widest">System Settings</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-xs uppercase tracking-widest animate-pulse">Loading...</div>
      ) : (
        <>
          {/* Engine params */}
          <div className="glass-panel border border-border rounded p-5 space-y-5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Engine Parameters</div>

            <SliderField
              label="Flash Loan Size"
              value={local.flashLoanSizeEth}
              min={10} max={1000} step={10}
              unit="ETH"
              onChange={v => setLocal(p => ({ ...p, flashLoanSizeEth: v }))}
            />
            <SliderField
              label="Min Margin Gate"
              value={local.minMarginPct}
              min={1} max={50} step={0.5}
              unit="%"
              onChange={v => setLocal(p => ({ ...p, minMarginPct: v }))}
            />
            <SliderField
              label="Max Bribe"
              value={local.maxBribePct}
              min={1} max={30} step={0.5}
              unit="% of profit"
              onChange={v => setLocal(p => ({ ...p, maxBribePct: v }))}
            />
            <SliderField
              label="Max Slippage"
              value={local.maxSlippagePct}
              min={0.1} max={5} step={0.1}
              unit="%"
              onChange={v => setLocal(p => ({ ...p, maxSlippagePct: v }))}
            />

            {/* Simulation mode toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-foreground uppercase tracking-widest">Simulation Mode</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {local.simulationMode ? "Dry run — no real transactions" : "LIVE — real mainnet transactions"}
                </div>
              </div>
              <button
                data-testid="toggle-simulation-mode"
                onClick={() => setLocal(p => ({ ...p, simulationMode: !p.simulationMode }))}
                className={`relative w-10 h-5 rounded-full border transition-all ${
                  local.simulationMode ? "bg-primary/20 border-primary/30" : "bg-destructive/20 border-destructive/30"
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                  local.simulationMode
                    ? "left-0.5 bg-primary"
                    : "left-5 bg-destructive"
                }`} />
              </button>
            </div>
          </div>

          {/* Protocol targets */}
          <div className="glass-panel border border-border rounded p-5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Target Protocols</div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_PROTOCOLS.map(p => (
                <button
                  key={p}
                  data-testid={`protocol-${p}`}
                  onClick={() => toggleProtocol(p)}
                  className={`text-[10px] px-3 py-1.5 rounded border uppercase tracking-widest transition-all ${
                    local.targetProtocols.includes(p)
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* API Keys */}
          <div className="glass-panel border border-border rounded p-5 space-y-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">API Integrations</div>
            <InputField
              label="OpenAI API Key"
              placeholder={settings?.openaiApiKey ?? "sk-..."}
              value={local.openaiApiKey}
              onChange={v => setLocal(p => ({ ...p, openaiApiKey: v }))}
              testId="input-openai-key"
              masked
            />
            <InputField
              label="Pimlico API Key"
              placeholder={settings?.pimlicoApiKey ?? "pim_..."}
              value={local.pimlicoApiKey}
              onChange={v => setLocal(p => ({ ...p, pimlicoApiKey: v }))}
              testId="input-pimlico-key"
              masked
            />
          </div>

          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            data-testid="button-save-settings"
            className="w-full py-2.5 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-40"
          >
            {saved ? "Settings Saved" : updateSettings.isPending ? "Saving..." : "Save Settings"}
          </button>
        </>
      )}
    </div>
  );
}

function SliderField({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-foreground uppercase tracking-widest">{label}</span>
        <span className="text-[11px] text-primary font-bold">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary h-1 bg-border rounded cursor-pointer"
      />
      <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function InputField({ label, placeholder, value, onChange, testId, masked }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; testId: string; masked?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1.5">{label}</label>
      <input
        type={masked ? "password" : "text"}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        data-testid={testId}
        className="w-full bg-background border border-border rounded px-3 py-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
      />
    </div>
  );
}
