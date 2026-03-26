import { motion } from "framer-motion";
import { Shield, TrendingUp, Activity, Users } from "lucide-react";
import { useProtocolStats } from "@/hooks/usePrivateFill";
import { formatUnits } from "viem";

const StatsBar = () => {
  const { orderCount, matchCount, oraclePrice, oracleDecimals, deployed } = useProtocolStats();

  const formattedPrice = oraclePrice && oracleDecimals
    ? `$${Number(formatUnits(oraclePrice, oracleDecimals)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$3,418.52";

  const activeOrders = deployed && orderCount !== undefined
    ? orderCount.toString()
    : "47";

  const totalMatches = deployed && matchCount !== undefined
    ? matchCount.toString()
    : "12";

  const stats = [
    { label: "MEV Extracted", value: "$0.00", sublabel: deployed ? "dark pool active" : "vs $12.4K on public DEX", icon: Shield, color: "text-primary" },
    { label: "Oracle Price", value: formattedPrice, sublabel: "ETH/USD · Chainlink", icon: TrendingUp, color: "text-accent" },
    { label: "Active Orders", value: activeOrders, sublabel: deployed ? "on-chain" : "encrypted on-chain", icon: Activity, color: "text-terminal" },
    { label: "Settlements", value: totalMatches, sublabel: deployed ? "fills published" : "last 24h", icon: Users, color: "text-neon-purple" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * i }}
          className="glass-card rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-foreground">{stat.value}</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">{stat.sublabel}</div>
        </motion.div>
      ))}
      {!deployed && (
        <div className="col-span-full">
          <div className="text-center text-[10px] font-mono text-muted-foreground/50 mt-1">
            Demo mode — deploy contracts to see live data
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsBar;
