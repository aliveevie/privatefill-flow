import { useEffect, useState } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { type Address, type Log, parseAbiItem } from "viem";
import { useProtocolAddresses } from "./usePrivateFill";

export interface OrderSubmittedEvent {
  orderId: bigint;
  bookId: bigint;
  trader: Address;
  side: number;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface OrderMatchedEvent {
  matchId: bigint;
  buyOrderId: bigint;
  sellOrderId: bigint;
  fillAmountHandle: `0x${string}`;
  settlementPrice: bigint;
  matcher: Address;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface FillPublishedEvent {
  matchId: bigint;
  fillAmount: bigint;
  quoteAmount: bigint;
  revealer: Address;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

const ORDER_SUBMITTED_EVENT = parseAbiItem(
  "event OrderSubmitted(uint256 indexed orderId, uint256 indexed bookId, address indexed trader, uint8 side)"
);
const ORDER_MATCHED_EVENT = parseAbiItem(
  "event OrderMatched(uint256 indexed matchId, uint256 indexed buyOrderId, uint256 indexed sellOrderId, bytes32 fillAmountHandle, uint256 settlementPrice, address matcher)"
);
const FILL_PUBLISHED_EVENT = parseAbiItem(
  "event FillPublished(uint256 indexed matchId, uint64 fillAmount, uint256 quoteAmount, address indexed revealer)"
);

export function useMyOrderEvents() {
  const { address } = useAccount();
  const { addresses, deployed } = useProtocolAddresses();
  const publicClient = usePublicClient();
  const [orders, setOrders] = useState<OrderSubmittedEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deployed || !addresses || !publicClient || !address) {
      setOrders([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    publicClient
      .getLogs({
        address: addresses.privateFill,
        event: ORDER_SUBMITTED_EVENT,
        args: { trader: address },
        fromBlock: "earliest",
        toBlock: "latest",
      })
      .then((logs) => {
        if (cancelled) return;
        const parsed: OrderSubmittedEvent[] = logs.map((log) => ({
          orderId: log.args.orderId!,
          bookId: log.args.bookId!,
          trader: log.args.trader!,
          side: log.args.side!,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        }));
        setOrders(parsed.reverse());
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deployed, addresses, publicClient, address]);

  return { orders, loading };
}

export function useFillEvents() {
  const { addresses, deployed } = useProtocolAddresses();
  const publicClient = usePublicClient();
  const [fills, setFills] = useState<FillPublishedEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deployed || !addresses || !publicClient) {
      setFills([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    publicClient
      .getLogs({
        address: addresses.privateFill,
        event: FILL_PUBLISHED_EVENT,
        fromBlock: "earliest",
        toBlock: "latest",
      })
      .then((logs) => {
        if (cancelled) return;
        const parsed: FillPublishedEvent[] = logs.map((log) => ({
          matchId: log.args.matchId!,
          fillAmount: log.args.fillAmount!,
          quoteAmount: log.args.quoteAmount!,
          revealer: log.args.revealer!,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        }));
        setFills(parsed.reverse());
      })
      .catch(() => {
        if (!cancelled) setFills([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deployed, addresses, publicClient]);

  return { fills, loading };
}

export function useMatchEvents() {
  const { addresses, deployed } = useProtocolAddresses();
  const publicClient = usePublicClient();
  const [matches, setMatches] = useState<OrderMatchedEvent[]>([]);

  useEffect(() => {
    if (!deployed || !addresses || !publicClient) {
      setMatches([]);
      return;
    }

    let cancelled = false;

    publicClient
      .getLogs({
        address: addresses.privateFill,
        event: ORDER_MATCHED_EVENT,
        fromBlock: "earliest",
        toBlock: "latest",
      })
      .then((logs) => {
        if (cancelled) return;
        const parsed: OrderMatchedEvent[] = logs.map((log) => ({
          matchId: log.args.matchId!,
          buyOrderId: log.args.buyOrderId!,
          sellOrderId: log.args.sellOrderId!,
          fillAmountHandle: log.args.fillAmountHandle!,
          settlementPrice: log.args.settlementPrice!,
          matcher: log.args.matcher!,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        }));
        setMatches(parsed.reverse());
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      });

    return () => {
      cancelled = true;
    };
  }, [deployed, addresses, publicClient]);

  return { matches };
}
