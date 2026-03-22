import { motion } from "framer-motion";

const ArchitectureDiagram = () => {
  const layers = [
    {
      label: "CLIENT",
      items: ["React UI", "@cofhe/sdk encrypt", "wagmi tx"],
      color: "border-primary/40",
      glow: "bg-primary/5",
    },
    {
      label: "CONTRACTS",
      items: ["OrderBook.sol", "MatchingEngine.sol", "OracleGuard.sol"],
      color: "border-accent/40",
      glow: "bg-accent/5",
    },
    {
      label: "CoFHE",
      items: ["FHE Coprocessor", "Threshold Decrypt"],
      color: "border-neon-purple/40",
      glow: "bg-neon-purple/5",
    },
    {
      label: "ORACLE",
      items: ["Chainlink ETH/USD", "Price Band Guard"],
      color: "border-terminal/40",
      glow: "bg-terminal/5",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card rounded-xl p-5"
    >
      <h3 className="font-display font-semibold text-foreground mb-4 text-sm">
        System Architecture
      </h3>
      <div className="space-y-3">
        {layers.map((layer, i) => (
          <motion.div
            key={layer.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i + 0.5 }}
          >
            <div className={`rounded-lg border ${layer.color} ${layer.glow} p-3`}>
              <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">
                {layer.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {layer.items.map((item) => (
                  <span
                    key={item}
                    className="text-[11px] font-mono text-foreground/80 bg-secondary/50 px-2 py-1 rounded"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {i < layers.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="w-px h-4 bg-border/50" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ArchitectureDiagram;
