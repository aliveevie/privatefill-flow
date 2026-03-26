import { motion } from "framer-motion";
import { Eye, EyeOff, Clock, XCircle, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useMyOrderEvents } from "@/hooks/useContractEvents";
import { useCancelOrder, useProtocolAddresses } from "@/hooks/usePrivateFill";
import { toast } from "sonner";

interface Order {
  id: string;
  orderId?: bigint;
  direction: "BUY" | "SELL";
  pair: string;
  encryptedAmount: string;
  encryptedPrice: string;
  status: "active" | "partial" | "filled" | "cancelled";
  timestamp: string;
  revealed?: { amount: string; price: string };
}

const MOCK_ORDERS: Order[] = [
  {
    id: "0x7f3a",
    direction: "BUY",
    pair: "ETH/USDC",
    encryptedAmount: "0x8f4e...c2a1",
    encryptedPrice: "0x3b7d...9ef0",
    status: "active",
    timestamp: "2 min ago",
  },
  {
    id: "0xa1b2",
    direction: "SELL",
    pair: "ETH/USDC",
    encryptedAmount: "0x1c9f...d4b3",
    encryptedPrice: "0x6a2e...7f81",
    status: "partial",
    timestamp: "8 min ago",
    revealed: { amount: "1.5 ETH", price: "$3,420" },
  },
  {
    id: "0xd3e4",
    direction: "BUY",
    pair: "WBTC/USDC",
    encryptedAmount: "0x4f2a...e8c7",
    encryptedPrice: "0x9d1b...3a56",
    status: "filled",
    timestamp: "1h ago",
    revealed: { amount: "0.05 BTC", price: "$67,200" },
  },
];

const MyOrders = () => {
  const { isConnected } = useAccount();
  const { deployed } = useProtocolAddresses();
  const { orders: onChainOrders, loading } = useMyOrderEvents();

  // Map on-chain events to Order format if deployed, otherwise use mocks
  const displayOrders: Order[] = deployed && onChainOrders.length > 0
    ? onChainOrders.map((evt) => ({
        id: `0x${evt.orderId.toString(16).slice(0, 4)}`,
        orderId: evt.orderId,
        direction: evt.side === 0 ? "BUY" : "SELL",
        pair: "ETH/USDC",
        encryptedAmount: `0x${evt.transactionHash.slice(2, 6)}...${evt.transactionHash.slice(-4)}`,
        encryptedPrice: `0x${evt.transactionHash.slice(6, 10)}...${evt.transactionHash.slice(-4)}`,
        status: "active" as const,
        timestamp: `Block ${evt.blockNumber.toString()}`,
      }))
    : MOCK_ORDERS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-primary" />
          My Orders
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground px-2 py-1 bg-secondary rounded">
          {deployed ? "LIVE" : "DEMO"}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {displayOrders.map((order, i) => (
            <OrderRow key={order.id + i} order={order} index={i} />
          ))}
        </div>
      )}

      {!loading && displayOrders.length === 0 && (
        <div className="text-center py-8 text-muted-foreground font-mono text-sm">
          {isConnected ? "No active orders" : "Connect wallet to view orders"}
        </div>
      )}
    </motion.div>
  );
};

const OrderRow = ({ order, index }: { order: Order; index: number }) => {
  const { cancelOrder, isPending: isCancelling } = useCancelOrder();
  const { deployed } = useProtocolAddresses();

  const handleCancel = () => {
    if (order.orderId && deployed) {
      cancelOrder(order.orderId);
      toast.info("Cancelling order...");
    } else {
      toast.info("Demo: order cancelled");
    }
  };

  const statusConfig = {
    active: { color: "text-primary", bg: "bg-primary/10", label: "Active" },
    partial: { color: "text-accent", bg: "bg-accent/10", label: "Partial Fill" },
    filled: { color: "text-terminal", bg: "bg-terminal/10", label: "Filled" },
    cancelled: { color: "text-destructive", bg: "bg-destructive/10", label: "Cancelled" },
  };
  const cfg = statusConfig[order.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="bg-secondary/30 rounded-lg p-3 border border-border/30 hover:border-primary/20 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold ${order.direction === "BUY" ? "text-primary" : "text-destructive"}`}>
            {order.direction}
          </span>
          <span className="text-xs font-mono text-foreground">{order.pair}</span>
          <span className="text-[10px] font-mono text-muted-foreground">{order.id}</span>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground block">Amount</span>
          {order.revealed ? (
            <span className="text-xs font-mono text-foreground flex items-center gap-1">
              <Eye className="w-3 h-3 text-primary" />
              {order.revealed.amount}
            </span>
          ) : (
            <span className="text-xs font-mono text-muted-foreground/60">{order.encryptedAmount}</span>
          )}
        </div>
        <div>
          <span className="text-[10px] font-mono text-muted-foreground block">Price</span>
          {order.revealed ? (
            <span className="text-xs font-mono text-foreground flex items-center gap-1">
              <Eye className="w-3 h-3 text-primary" />
              {order.revealed.price}
            </span>
          ) : (
            <span className="text-xs font-mono text-muted-foreground/60">{order.encryptedPrice}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> {order.timestamp}
        </span>
        {order.status === "active" && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="text-[10px] font-mono text-destructive/60 hover:text-destructive flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default MyOrders;
