import { useState } from "react";
import { motion } from "framer-motion";
import { Vault, ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import { useVaultBalance, useVaultDeposit, useVaultWithdraw, useTokenBalance } from "@/hooks/useSettlementVault";
import { useProtocolAddresses } from "@/hooks/usePrivateFill";
import { toast } from "sonner";

const VaultPanel = () => {
  const { isConnected } = useAccount();
  const { addresses, deployed } = useProtocolAddresses();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<"base" | "quote">("base");

  const tokenAddress = selectedToken === "base" ? addresses?.baseToken : addresses?.quoteToken;
  const { balance: vaultBal } = useVaultBalance(tokenAddress);
  const walletBal = useTokenBalance(tokenAddress);
  const { deposit, isPending: isDepositing } = useVaultDeposit();
  const { withdraw, isPending: isWithdrawing } = useVaultWithdraw();

  const isPending = isDepositing || isWithdrawing;
  const decimals = selectedToken === "base" ? 18 : 6;
  const symbol = selectedToken === "base" ? "ETH" : "USDC";

  const handleAction = () => {
    if (!amount) return;
    if (!deployed || !tokenAddress) {
      toast.info(`Demo: ${activeTab === "deposit" ? "deposited" : "withdrew"} ${amount} ${symbol}`);
      setAmount("");
      return;
    }

    try {
      const parsed = parseUnits(amount, decimals);
      if (activeTab === "deposit") {
        deposit(tokenAddress, parsed);
        toast.success(`Depositing ${amount} ${symbol} to vault...`);
      } else {
        withdraw(tokenAddress, parsed);
        toast.success(`Withdrawing ${amount} ${symbol} from vault...`);
      }
      setAmount("");
    } catch {
      toast.error("Invalid amount");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Vault className="w-4 h-4 text-accent" />
          Settlement Vault
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground px-2 py-1 bg-secondary rounded">
          ESCROW
        </span>
      </div>

      {/* Token Selector */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setSelectedToken("base")}
          className={`flex-1 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
            selectedToken === "base" ? "bg-primary/20 text-primary border-glow" : "bg-secondary/50 text-muted-foreground"
          }`}
        >
          ETH
        </button>
        <button
          onClick={() => setSelectedToken("quote")}
          className={`flex-1 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
            selectedToken === "quote" ? "bg-primary/20 text-primary border-glow" : "bg-secondary/50 text-muted-foreground"
          }`}
        >
          USDC
        </button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-secondary/30 rounded-lg p-2.5">
          <div className="text-[10px] font-mono text-muted-foreground">Wallet</div>
          <div className="text-xs font-mono text-foreground font-semibold">
            {deployed && walletBal !== undefined
              ? `${Number(formatUnits(walletBal, decimals)).toFixed(4)} ${symbol}`
              : `— ${symbol}`}
          </div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2.5">
          <div className="text-[10px] font-mono text-muted-foreground">Vault</div>
          <div className="text-xs font-mono text-foreground font-semibold">
            {deployed && vaultBal !== undefined
              ? `${Number(formatUnits(vaultBal, decimals)).toFixed(4)} ${symbol}`
              : `— ${symbol}`}
          </div>
        </div>
      </div>

      {/* Deposit/Withdraw Tabs */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-mono transition-all ${
            activeTab === "deposit" ? "bg-accent/20 text-accent border border-accent/30" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowDownToLine className="w-3 h-3" /> Deposit
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-mono transition-all ${
            activeTab === "withdraw" ? "bg-accent/20 text-accent border border-accent/30" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowUpFromLine className="w-3 h-3" /> Withdraw
        </button>
      </div>

      {/* Amount Input */}
      <div className="bg-secondary/50 rounded-lg p-3 mb-3">
        <input
          type="text"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-transparent text-lg font-mono font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Action Button */}
      <button
        onClick={handleAction}
        disabled={isPending || !amount || !isConnected}
        className="w-full py-3 rounded-lg bg-accent/20 border border-accent/30 text-accent font-mono text-sm font-semibold hover:bg-accent/30 transition-all disabled:opacity-50"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </span>
        ) : !isConnected ? (
          "Connect Wallet"
        ) : (
          `${activeTab === "deposit" ? "Deposit" : "Withdraw"} ${symbol}`
        )}
      </button>
    </motion.div>
  );
};

export default VaultPanel;
