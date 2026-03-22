import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownUp, Lock, ChevronDown, Info } from "lucide-react";

const TOKENS = [
  { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
  { symbol: "USDC", name: "USD Coin", icon: "$" },
  { symbol: "WBTC", name: "Wrapped BTC", icon: "₿" },
];

const OrderForm = () => {
  const [isBuy, setIsBuy] = useState(true);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [fromToken, setFromToken] = useState(TOKENS[1]);
  const [toToken, setToToken] = useState(TOKENS[0]);

  const handleSwapDirection = () => {
    setIsBuy(!isBuy);
    setFromToken(isBuy ? TOKENS[0] : TOKENS[1]);
    setToToken(isBuy ? TOKENS[1] : TOKENS[0]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-xl p-6 w-full max-w-md mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Encrypted Order</h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsBuy(true)}
            className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
              isBuy ? "bg-primary/20 text-primary border-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setIsBuy(false)}
            className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
              !isBuy ? "bg-destructive/20 text-destructive border border-destructive/30" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            SELL
          </button>
        </div>
      </div>

      {/* From Token */}
      <div className="bg-secondary/50 rounded-lg p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-muted-foreground">You Pay</span>
          <span className="text-xs font-mono text-muted-foreground">Balance: —</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-mono font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
          />
          <TokenSelector token={fromToken} />
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-3 relative z-10">
        <motion.button
          whileHover={{ rotate: 180, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300 }}
          onClick={handleSwapDirection}
          className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-primary hover:glow-neon transition-shadow"
        >
          <ArrowDownUp className="w-4 h-4" />
        </motion.button>
      </div>

      {/* To Token */}
      <div className="bg-secondary/50 rounded-lg p-4 mt-2 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-muted-foreground">You Receive</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="0.00"
            readOnly
            className="flex-1 bg-transparent text-2xl font-mono font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
          />
          <TokenSelector token={toToken} />
        </div>
      </div>

      {/* Limit Price */}
      <div className="bg-secondary/30 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" /> Limit Price (encrypted)
          </span>
        </div>
        <input
          type="text"
          placeholder="Market price ± slippage"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full mt-2 bg-transparent text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Encryption Info */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/10 mb-4">
        <Lock className="w-3 h-3 text-primary animate-pulse-glow" />
        <span className="text-[11px] font-mono text-primary/80">
          Amount, price & direction encrypted via CoFHE before submission
        </span>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`w-full py-4 rounded-lg font-display font-semibold text-sm tracking-wide transition-all ${
          isBuy
            ? "bg-primary text-primary-foreground glow-neon hover:glow-neon-strong"
            : "bg-destructive text-destructive-foreground hover:brightness-110"
        }`}
      >
        {isBuy ? "Encrypt & Submit Buy Order" : "Encrypt & Submit Sell Order"}
      </motion.button>
    </motion.div>
  );
};

const TokenSelector = ({ token }: { token: { symbol: string; icon: string } }) => (
  <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
      {token.icon}
    </span>
    <span className="text-sm font-mono font-semibold text-foreground">{token.symbol}</span>
    <ChevronDown className="w-3 h-3 text-muted-foreground" />
  </button>
);

export default OrderForm;
