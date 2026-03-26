import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { useFillEvents } from "@/hooks/useContractEvents";
import { useMatchRecord, useProtocolAddresses } from "@/hooks/usePrivateFill";
import { useChainId } from "wagmi";
import { formatUnits } from "viem";

interface Fill {
  id: string;
  buyTrader: string;
  sellTrader: string;
  pair: string;
  amount: string;
  price: string;
  timestamp: string;
  txHash: string;
}

const MOCK_FILLS: Fill[] = [
  {
    id: "1",
    buyTrader: "0x7f3a...c2a1",
    sellTrader: "0xa1b2...d4b3",
    pair: "ETH/USDC",
    amount: "2.5 ETH",
    price: "$3,418.50",
    timestamp: "12s ago",
    txHash: "0xabc...123",
  },
  {
    id: "2",
    buyTrader: "0xd3e4...e8c7",
    sellTrader: "0x9f1b...3a56",
    pair: "WBTC/USDC",
    amount: "0.12 BTC",
    price: "$67,185.00",
    timestamp: "1m ago",
    txHash: "0xdef...456",
  },
  {
    id: "3",
    buyTrader: "0x5c2d...f7e9",
    sellTrader: "0x8a3f...b1c4",
    pair: "ETH/USDC",
    amount: "10.0 ETH",
    price: "$3,421.20",
    timestamp: "3m ago",
    txHash: "0xghi...789",
  },
  {
    id: "4",
    buyTrader: "0x2b7e...a9d1",
    sellTrader: "0xe4f6...c8a2",
    pair: "ETH/USDC",
    amount: "0.8 ETH",
    price: "$3,415.00",
    timestamp: "7m ago",
    txHash: "0xjkl...012",
  },
];

const FillHistory = () => {
  const { deployed } = useProtocolAddresses();
  const { fills: onChainFills, loading } = useFillEvents();
  const chainId = useChainId();

  const explorerBase = chainId === 421614
    ? "https://sepolia.arbiscan.io/tx/"
    : "https://sepolia.basescan.org/tx/";

  // Map on-chain fills to display format if deployed
  const displayFills: Fill[] = deployed && onChainFills.length > 0
    ? onChainFills.map((evt) => ({
        id: evt.matchId.toString(),
        buyTrader: `0x${evt.transactionHash.slice(2, 6)}...${evt.transactionHash.slice(-4)}`,
        sellTrader: `0x${evt.revealer.slice(2, 6)}...${evt.revealer.slice(-4)}`,
        pair: "ETH/USDC",
        amount: `${formatUnits(evt.fillAmount, 18)} ETH`,
        price: `$${Number(formatUnits(evt.quoteAmount, 6)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        timestamp: `Block ${evt.blockNumber.toString()}`,
        txHash: evt.transactionHash,
      }))
    : MOCK_FILLS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-accent" />
          Settlement Feed
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground px-2 py-1 bg-secondary rounded">
          {deployed ? "LIVE" : "DEMO"}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {displayFills.map((fill, i) => (
            <FillRow
              key={fill.id}
              fill={fill}
              index={i}
              explorerBase={deployed ? explorerBase : undefined}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const FillRow = ({ fill, index, explorerBase }: { fill: Fill; index: number; explorerBase?: string }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.05 * index }}
    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-secondary/30 transition-colors group"
  >
    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow shrink-0" />

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground truncate">{fill.buyTrader}</span>
        <ArrowRight className="w-3 h-3 text-primary shrink-0" />
        <span className="text-xs font-mono text-muted-foreground truncate">{fill.sellTrader}</span>
      </div>
    </div>

    <div className="text-right shrink-0">
      <div className="text-xs font-mono text-foreground font-semibold">{fill.amount}</div>
      <div className="text-[10px] font-mono text-accent">{fill.price}</div>
    </div>

    <div className="text-right shrink-0 hidden sm:block">
      <div className="text-[10px] font-mono text-muted-foreground">{fill.timestamp}</div>
    </div>

    {explorerBase ? (
      <a
        href={`${explorerBase}${fill.txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
      </a>
    ) : (
      <button className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
      </button>
    )}
  </motion.div>
);

export default FillHistory;
