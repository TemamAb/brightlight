import React, { useState } from "react";
import { 
  Plus, Trash2, Edit2, CheckCircle, XCircle, ChevronDown, ChevronUp, RefreshCw, ArrowUpRight, History, Save
} from "lucide-react";

interface WalletEntry {
  id: number;
  address: string;
  privateKey: string;
  chains: string[];
  balance: string;
  isValid: boolean;
  isActive: boolean;
}

interface TransferRecord {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: string;
  txHash: string;
  timestamp: string;
  status: "CONFIRMED" | "PENDING";
}

export default function Vault() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [withdrawalMode, setWithdrawalMode] = useState<"AUTO" | "MANUAL">("MANUAL");
  const [wallets, setWallets] = useState<WalletEntry[]>([
    {
      id: 1,
      address: "0x748Aa8ee067585F5bd02f0988eF6E71f2d662751",
      privateKey: "0x****************************************************************",
      chains: ["Base", "Ethereum", "Arbitrum"],
      balance: "0.00 ETH",
      isValid: true,
      isActive: true,
    }
  ]);
  
  const [transfers] = useState<TransferRecord[]>([
    {
      id: "tx_1",
      type: "WITHDRAWAL",
      amount: "0.05 ETH",
      txHash: "0x3a2f...e4d1",
      timestamp: new Date().toISOString(),
      status: "CONFIRMED"
    }
  ]);

  const totalBalance = wallets.reduce((acc, w) => acc + parseFloat(w.balance.split(' ')[0]), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bright-blue-text uppercase tracking-tighter">Vault Management</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-bright-blue text-white rounded hover:bg-bright-blue/90 transition-colors uppercase text-xs font-bold tracking-widest">
          <Plus size={16} /> Add Wallet
        </button>
      </div>

      {/* Wallet Table Panel */}
      <div className="glass-panel overflow-hidden border border-border transition-all duration-300">
        <div 
          className="flex items-center justify-between px-4 py-3 bg-black/20 border-b border-border cursor-pointer hover:bg-black/30 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
             {isCollapsed ? <ChevronDown size={16} className="bright-blue-text" /> : <ChevronUp size={16} className="bright-blue-text" />}
             <span className="text-xs uppercase tracking-widest text-foreground font-bold">Vault Integrity Audit</span>
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {wallets.length} Wallets Detected | Total: <span className="neon-glow-green font-bold">{totalBalance.toFixed(2)} ETH</span>
          </div>
        </div>

        <div className={`transition-all duration-500 ease-in-out ${isCollapsed ? "max-h-20" : "max-h-[2000px]"}`}>
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-border bg-black/10">
                  <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium w-12">ID</th>
                  <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Wallet Address</th>
                  <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Private Key</th>
                  <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Chains</th>
                  <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Balance</th>
                  <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Validation</th>
                  <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                  <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {!isCollapsed && wallets.map((w, idx) => (
                <tr key={w.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4 text-xs font-mono text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-4 text-xs font-mono bright-blue-text">{w.address}</td>
                  <td className="px-4 py-4 text-xs font-mono text-muted-foreground tracking-widest opacity-30 select-none">****************</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {w.chains.map(c => (
                        <span key={c} className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-white/5">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold neon-glow-green">{w.balance}</td>
                  <td className="px-4 py-4">
                    <div className={`flex items-center gap-1 text-[10px] uppercase font-bold ${w.isValid ? "text-neon-green" : "text-destructive"}`}>
                      {w.isValid ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {w.isValid ? "Valid" : "Invalid"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${w.isActive ? "bg-neon-green/10 text-neon-green" : "bg-muted text-muted-foreground"}`}>
                      {w.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button className="p-1.5 text-muted-foreground hover:text-bright-blue transition-colors" title="Save"><Save size={14} /></button>
                      <button className="p-1.5 text-muted-foreground hover:text-bright-blue transition-colors" title="Edit"><Edit2 size={14} /></button>
                      <button className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Total Summary Row (Sticky Logic) */}
              <tr className="bg-bright-blue/5 border-t-2 border-bright-blue/20">
                <td className="px-4 py-5 text-[10px] uppercase font-bold bright-blue-text" colSpan={3}>
                   Aggregated Vault Liquidity
                </td>
                <td className="px-4 py-5" colSpan={1}>
                   <span className="text-[9px] bg-bright-blue/10 px-2 py-1 rounded text-bright-blue border border-bright-blue/20 uppercase tracking-widest">11 Chains Linked</span>
                </td>
                <td className="px-4 py-5 text-lg font-bold neon-glow-green" colSpan={4}>
                  {totalBalance.toFixed(2)} ETH
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Functional Controls: Withdrawal & History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Profit Withdrawal Section */}
        <div className="glass-panel p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Profit Withdrawal Control</h3>
            <div className="flex bg-black/40 p-1 rounded border border-border">
              <button 
                onClick={() => setWithdrawalMode("AUTO")}
                className={`px-3 py-1 text-[9px] uppercase font-bold rounded transition-all ${withdrawalMode === "AUTO" ? "bg-bright-blue text-white shadow-lg shadow-bright-blue/20" : "text-muted-foreground"}`}
              >Auto</button>
              <button 
                onClick={() => setWithdrawalMode("MANUAL")}
                className={`px-3 py-1 text-[9px] uppercase font-bold rounded transition-all ${withdrawalMode === "MANUAL" ? "bg-bright-blue text-white shadow-lg shadow-bright-blue/20" : "text-muted-foreground"}`}
              >Manual</button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-border">
              <div>
                <div className="text-[9px] uppercase text-muted-foreground">Available to Withdraw</div>
                <div className="text-xl font-bold bright-blue-text">0.42 ETH</div>
              </div>
              <button className="px-6 py-2 bg-bright-blue text-white rounded text-[10px] uppercase font-bold hover:scale-105 transition-transform disabled:opacity-50" disabled={withdrawalMode === "AUTO"}>
                Withdraw Now
              </button>
            </div>
            <div className="text-[9px] text-muted-foreground italic">
              {withdrawalMode === "AUTO" ? "Automated system will sweep profits to Aave V3 every 24 hours." : "Manual withdrawals require Commander authorization."}
            </div>
          </div>
        </div>

        {/* Transfer History Ledger */}
        <div className="glass-panel p-6 border border-border">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <History size={12} /> Transfer History Ledger
          </h3>
          <div className="space-y-3">
            {transfers.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full ${tx.type === "WITHDRAWAL" ? "bg-red-500/10 text-red-400" : "bg-neon-green/10 text-neon-green"}`}>
                    <ArrowUpRight size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{tx.type}</div>
                    <div className="text-[9px] text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-mono font-bold ${tx.type === "WITHDRAWAL" ? "text-red-400" : "text-neon-green"}`}>{tx.amount}</div>
                  <div className="text-[9px] bright-blue-text font-mono underline cursor-pointer">{tx.txHash}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="glass-panel p-6 border border-border">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Total Combined Value</h3>
          <div className="text-3xl font-bold neon-glow-green">{totalBalance.toFixed(2)} ETH</div>
          <div className="text-xs text-muted-foreground mt-1 tracking-tighter">~${(totalBalance * 2350).toLocaleString()} USD</div>
        </div>
        <div className="glass-panel p-6 border border-border">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Chain Coverage</h3>
          <div className="text-3xl font-bold bright-blue-text">11 / 11</div>
          <div className="text-xs text-muted-foreground mt-1 tracking-tighter">MULTI-CHAIN SYNC ACTIVE</div>
        </div>
        <div className="glass-panel p-6 border border-border">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Execution Protocol</h3>
          <div className="text-3xl font-bold text-foreground">ERC-4337</div>
          <div className="text-xs text-neon-green mt-1 font-bold tracking-widest">GASLESS ENABLED</div>
        </div>
      </div>
    </div>
  )
}