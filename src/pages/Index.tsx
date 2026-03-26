import Header from "@/components/Header";
import OrderForm from "@/components/OrderForm";
import MyOrders from "@/components/MyOrders";
import FillHistory from "@/components/FillHistory";
import StatsBar from "@/components/StatsBar";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import VaultPanel from "@/components/VaultPanel";
import { motion } from "framer-motion";
import { Shield, Lock, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scanline">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <section className="container px-4 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-mono text-primary">Fhenix WaveHack · Confidential DeFi</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3 leading-tight">
              Trade with <span className="text-gradient-neon">Zero MEV</span>
              <br />
              <span className="text-muted-foreground text-2xl md:text-3xl">Fully Encrypted Dark Pool</span>
            </h2>
            <p className="text-sm font-mono text-muted-foreground max-w-lg mx-auto">
              Orders encrypted on-chain via FHE. No mempool visibility.
              No front-running. No sandwich attacks. Ever.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <FeaturePill icon={<Lock className="w-3 h-3" />} text="FHE Encrypted" />
              <FeaturePill icon={<Zap className="w-3 h-3" />} text="Chainlink Guarded" />
              <FeaturePill icon={<Shield className="w-3 h-3" />} text="Zero Leakage" />
            </div>
          </motion.div>

          <StatsBar />
        </section>

        {/* Main Trading Interface */}
        <section className="container px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Order Form + Vault */}
            <div className="lg:col-span-4 space-y-6">
              <OrderForm />
              <VaultPanel />
            </div>

            {/* Center: My Orders */}
            <div className="lg:col-span-4">
              <MyOrders />
            </div>

            {/* Right: Fill History + Architecture */}
            <div className="lg:col-span-4 space-y-6">
              <FillHistory />
              <ArchitectureDiagram />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-6">
          <div className="container px-4 flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground">
              PrivateFill · Built by IBX Lab · Fhenix WaveHack
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              Arbitrum Sepolia · Base Sepolia · Testnet
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const FeaturePill = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
    <span className="text-primary">{icon}</span>
    {text}
  </div>
);

export default Index;
