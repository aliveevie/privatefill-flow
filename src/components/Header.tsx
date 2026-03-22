import { Shield, Lock, Zap } from "lucide-react";
import { motion } from "framer-motion";

const Header = () => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16 px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <Shield className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 w-8 h-8 bg-primary/20 rounded-full blur-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground tracking-tight">
              Private<span className="text-gradient-neon">Fill</span>
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
              Encrypted Dark Pool
            </p>
          </div>
        </motion.div>

        <div className="hidden md:flex items-center gap-6">
          <StatusPill icon={<Lock className="w-3 h-3" />} label="FHE Active" status="active" />
          <StatusPill icon={<Zap className="w-3 h-3" />} label="Arb Sepolia" status="connected" />
        </div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-sm font-semibold glow-neon hover:glow-neon-strong transition-shadow"
        >
          Connect Wallet
        </motion.button>
      </div>
    </header>
  );
};

const StatusPill = ({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  status: "active" | "connected";
}) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/50">
    <span className={status === "active" ? "text-primary" : "text-accent"}>{icon}</span>
    <span className="text-xs font-mono text-secondary-foreground">{label}</span>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse-glow ${status === "active" ? "bg-primary" : "bg-accent"}`} />
  </div>
);

export default Header;
