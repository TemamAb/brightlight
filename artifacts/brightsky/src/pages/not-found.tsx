import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-panel p-10 rounded border border-border text-center max-w-sm">
        <div className="text-electric text-5xl font-bold mb-2">404</div>
        <p className="text-muted-foreground text-sm mb-6 uppercase tracking-widest">Signal Lost</p>
        <Link href="/" className="text-primary text-xs underline underline-offset-4 hover:text-primary/80 transition-colors">
          Return to Terminal
        </Link>
      </div>
    </div>
  );
}
