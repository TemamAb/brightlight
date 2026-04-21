import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Stream from "@/pages/Stream";
import Trades from "@/pages/Trades";
import Vault from "@/pages/Vault";
import SettingsPage from "@/pages/SettingsPage";
import AuditReport from "@/pages/AuditReport";
import Layout from "@/components/Layout";
import { setBaseUrl } from "@workspace/api-client-react";
import { useEffect, createContext, useContext, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

// Configure API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
if (API_BASE_URL) {
  setBaseUrl(API_BASE_URL);
  console.log("[App] API Base URL configured:", API_BASE_URL);
}

// ─── Socket Context for High-Speed Telemetry ────────────────────────────────
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = io(API_BASE_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    s.on("connect", () => setIsConnected(true));
    s.on("disconnect", () => setIsConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/stream" component={Stream} />
        <Route path="/trades" component={Trades} />
        <Route path="/vault" component={Vault} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/audit" component={AuditReport} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    // Elite Requirement: Ensure the metallic Predator aesthetic is applied to the body
    document.body.style.backgroundColor = "#0A0A0B"; // Deep Matte Onyx
    console.log("[BrightSky] Predator Visage Initialized. Monitoring Mission...");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="dark min-h-[100dvh] bg-background text-foreground font-mono selection:bg-blue-500/30">
              <Router />
            </div>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
