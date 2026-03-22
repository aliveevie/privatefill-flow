import { Shield, Lock, Zap, LogOut, Copy, Check, ChevronDown, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { useState } from "react";

const Header = () => {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const chainName = chainId === 421614 ? "Arb Sepolia" : chainId === 84532 ? "Base Sepolia" : `Chain ${chainId}`;

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          <StatusPill
            icon={<Zap className="w-3 h-3" />}
            label={isConnected ? chainName : "Not Connected"}
            status={isConnected ? "connected" : "active"}
          />
        </div>

        {isConnected ? (
          <div className="relative">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary border border-border hover:border-primary/30 transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-sm font-mono text-foreground">{truncatedAddress}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </motion.button>

            <AnimatePresence>
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-lg glass-card border border-border p-2 z-50"
                  >
                    <div className="px-3 py-2 mb-1">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Connected</div>
                      <div className="text-xs font-mono text-foreground">{truncatedAddress}</div>
                      <div className="text-[10px] font-mono text-accent mt-0.5">{chainName}</div>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono text-secondary-foreground hover:bg-secondary/50 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy Address"}
                    </button>

                    {chainId !== 421614 && (
                      <button
                        onClick={() => { switchChain({ chainId: 421614 }); setShowDropdown(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono text-secondary-foreground hover:bg-secondary/50 transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        Switch to Arb Sepolia
                      </button>
                    )}

                    <div className="border-t border-border/50 my-1" />

                    <button
                      onClick={() => { disconnect(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      Disconnect
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="relative">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowConnectModal(!showConnectModal)}
              disabled={isPending}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-sm font-semibold glow-neon hover:glow-neon-strong transition-shadow disabled:opacity-50"
            >
              {isPending ? "Connecting..." : "Connect Wallet"}
            </motion.button>

            <AnimatePresence>
              {showConnectModal && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowConnectModal(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 rounded-lg glass-card border border-border p-3 z-50"
                  >
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 px-1">
                      Select Wallet
                    </div>
                    <div className="space-y-1">
                      {connectors.map((connector) => (
                        <button
                          key={connector.uid}
                          onClick={() => {
                            connect({ connector });
                            setShowConnectModal(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-secondary/50 border border-transparent hover:border-primary/20 transition-all"
                        >
                          <Wallet className="w-4 h-4 text-primary" />
                          <span className="text-sm font-mono text-foreground">{connector.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
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
