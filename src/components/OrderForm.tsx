import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownUp, Lock, ChevronDown, Info, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { useSubmitOrder, useProtocolAddresses } from "@/hooks/usePrivateFill";
import { useVaultBalance } from "@/hooks/useSettlementVault";
import { toast } from "sonner";

const TOKENS = [
  { symbol: "ETH", name: "Ethereum", icon: "\u039E", decimals: 18 },
  { symbol: "USDC", name: "USD Coin", icon: "$", decimals: 6 },
  { symbol: "WBTC", name: "Wrapped BTC", icon: "\u20BF", decimals: 8 },
];

const OrderForm = () => {
  const [isBuy, setIsBuy] = useState(true);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [fromToken, setFromToken] = useState(TOKENS[1]);
  const [toToken, setToToken] = useState(TOKENS[0]);

  const { isConnected } = useAccount();
  const { deployed, addresses } = useProtocolAddresses();
  const { submitOrder, isPending, isSuccess, isError, error } = useSubmitOrder();

  const baseBalance = useVaultBalance(addresses?.baseToken);
  const quoteBalance = useVaultBalance(addresses?.quoteToken);

  const handleSwapDirection = () => {
    setIsBuy(!isBuy);
    setFromToken(isBuy ? TOKENS[0] : TOKENS[1]);
    setToToken(isBuy ? TOKENS[1] : TOKENS[0]);
  };

  const handleSubmit = () => {
    if (!amount || !price) {
      toast.error("Enter amount and price");
      return;
    }
    if (!isConnected) {
      toast.error("Connect wallet first");
      return;
    }
    if (!deployed) {
      toast.info("Demo mode: contracts not deployed yet. Order simulated!", {
        description: `${isBuy ? "BUY" : "SELL"} ${amount} ${toToken.symbol} @ $${price}`,
      });
      setAmount("");
      setPrice("");
      return;
    }

    try {
      const parsedAmount = parseUnits(amount, toToken.decimals);
      const parsedPrice = parseUnits(price, 8); // oracle decimals = 8
      submitOrder(isBuy ? 0 : 1, parsedAmount, parsedPrice);
      toast.success("Encrypting & submitting order...", {
        description: "Your order parameters are encrypted via CoFHE before on-chain submission.",
      });
      setAmount("");
      setPrice("");
    } catch {
      toast.error("Invalid input values");
    }
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
          <span className="text-xs font-mono text-muted-foreground">
            Vault: {deployed && (isBuy ? quoteBalance.balance : baseBalance.balance) !== undefined
              ? Number((isBuy ? quoteBalance.balance : baseBalance.balance)! / BigInt(10 ** (isBuy ? 6 : 18))).toLocaleString()
              : "\u2014"}
          </span>
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
            value={amount && price ? (isBuy ? (Number(amount) / Number(price) * 1).toFixed(6) : (Number(amount) * Number(price)).toFixed(2)) : ""}
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
          placeholder="Market price \u00B1 slippage"
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
        onClick={handleSubmit}
        disabled={isPending || !amount || !price}
        className={`w-full py-4 rounded-lg font-display font-semibold text-sm tracking-wide transition-all disabled:opacity-50 ${
          isBuy
            ? "bg-primary text-primary-foreground glow-neon hover:glow-neon-strong"
            : "bg-destructive text-destructive-foreground hover:brightness-110"
        }`}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </span>
        ) : !isConnected ? (
          "Connect Wallet to Trade"
        ) : (
          isBuy ? "Encrypt & Submit Buy Order" : "Encrypt & Submit Sell Order"
        )}
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
