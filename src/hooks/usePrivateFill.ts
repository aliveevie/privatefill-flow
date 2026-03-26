import { useReadContract, useReadContracts, useWriteContract, useWatchContractEvent, useAccount, useChainId } from "wagmi";
import { type Address, parseAbiItem } from "viem";
import { useState, useCallback, useEffect } from "react";
import { PRIVATE_FILL_ABI } from "@/lib/contracts/config";
import { getAddresses, isDeployed } from "@/lib/contracts/addresses";

export interface OrderMeta {
  orderId: bigint;
  side: number; // 0 = Buy, 1 = Sell
  bookId: bigint;
  trader: Address;
  submittedAt: bigint;
  cancelled: boolean;
}

export interface MatchRecordData {
  matchId: bigint;
  buyOrderId: bigint;
  sellOrderId: bigint;
  fillAmountHandle: `0x${string}`;
  settlementPrice: bigint;
  matchedAt: bigint;
  published: boolean;
  revealedFillAmount: bigint;
  revealedQuoteAmount: bigint;
}

export function useProtocolAddresses() {
  const chainId = useChainId();
  const addresses = getAddresses(chainId);
  const deployed = addresses ? isDeployed(addresses) : false;
  return { addresses, deployed, chainId };
}

export function useProtocolStats() {
  const { addresses, deployed } = useProtocolAddresses();

  const privateFillAddress = addresses?.privateFill as Address | undefined;

  const { data: orderCount } = useReadContract({
    address: privateFillAddress,
    abi: PRIVATE_FILL_ABI,
    functionName: "orderCount",
    query: { enabled: deployed },
  });

  const { data: buyCount } = useReadContract({
    address: privateFillAddress,
    abi: PRIVATE_FILL_ABI,
    functionName: "buyCount",
    query: { enabled: deployed },
  });

  const { data: sellCount } = useReadContract({
    address: privateFillAddress,
    abi: PRIVATE_FILL_ABI,
    functionName: "sellCount",
    query: { enabled: deployed },
  });

  const { data: matchCount } = useReadContract({
    address: privateFillAddress,
    abi: PRIVATE_FILL_ABI,
    functionName: "matchCount",
    query: { enabled: deployed },
  });

  const { data: oraclePrice } = useReadContract({
    address: privateFillAddress,
    abi: PRIVATE_FILL_ABI,
    functionName: "lastOraclePrice",
    query: { enabled: deployed },
  });

  const { data: oracleDecimals } = useReadContract({
    address: privateFillAddress,
    abi: PRIVATE_FILL_ABI,
    functionName: "oracleDecimals",
    query: { enabled: deployed },
  });

  const { data: isOracleFresh } = useReadContract({
    address: privateFillAddress,
    abi: PRIVATE_FILL_ABI,
    functionName: "isOracleFresh",
    query: { enabled: deployed },
  });

  return {
    orderCount: orderCount as bigint | undefined,
    buyCount: buyCount as bigint | undefined,
    sellCount: sellCount as bigint | undefined,
    matchCount: matchCount as bigint | undefined,
    oraclePrice: oraclePrice as bigint | undefined,
    oracleDecimals: oracleDecimals as number | undefined,
    isOracleFresh: isOracleFresh as boolean | undefined,
    deployed,
  };
}

export function useSubmitOrder() {
  const { addresses, deployed } = useProtocolAddresses();
  const { writeContract, isPending, isSuccess, isError, error, data: hash } = useWriteContract();

  const submitOrder = useCallback(
    (side: 0 | 1, amount: bigint, price: bigint) => {
      if (!deployed || !addresses) return;

      // CoFHE encrypted input structure.
      // In production, use @cofhe/sdk to encrypt before sending.
      // For demo/testnet, we pass a placeholder structure.
      const encInput = (value: bigint, utype: number) => ({
        ctHash: value,
        securityZone: 0,
        utype,
        signature: "0x" as `0x${string}`,
      });

      writeContract({
        address: addresses.privateFill,
        abi: PRIVATE_FILL_ABI,
        functionName: "submitOrder",
        args: [
          side,
          encInput(amount, 4), // euint64 = utype 4
          encInput(price, 4),
          encInput(BigInt(side === 0 ? 1 : 0), 0), // ebool = utype 0, Buy=true, Sell=false
        ],
      });
    },
    [deployed, addresses, writeContract]
  );

  return { submitOrder, isPending, isSuccess, isError, error, hash };
}

export function useCancelOrder() {
  const { addresses, deployed } = useProtocolAddresses();
  const { writeContract, isPending, isSuccess, isError, error } = useWriteContract();

  const cancelOrder = useCallback(
    (orderId: bigint) => {
      if (!deployed || !addresses) return;
      writeContract({
        address: addresses.privateFill,
        abi: PRIVATE_FILL_ABI,
        functionName: "cancelOrder",
        args: [orderId],
      });
    },
    [deployed, addresses, writeContract]
  );

  return { cancelOrder, isPending, isSuccess, isError, error };
}

export function useOrderMeta(orderId: bigint | undefined) {
  const { addresses, deployed } = useProtocolAddresses();

  const { data, isLoading } = useReadContract({
    address: addresses?.privateFill as Address | undefined,
    abi: PRIVATE_FILL_ABI,
    functionName: "getOrderMeta",
    args: orderId !== undefined ? [orderId] : undefined,
    query: { enabled: deployed && orderId !== undefined },
  });

  if (!data) return { order: undefined, isLoading };

  const [side, bookId, trader, submittedAt, cancelled] = data as [number, bigint, Address, bigint, boolean];
  return {
    order: { orderId: orderId!, side, bookId, trader, submittedAt, cancelled } as OrderMeta,
    isLoading,
  };
}

export function useMatchRecord(matchId: bigint | undefined) {
  const { addresses, deployed } = useProtocolAddresses();

  const { data, isLoading } = useReadContract({
    address: addresses?.privateFill as Address | undefined,
    abi: PRIVATE_FILL_ABI,
    functionName: "getMatchRecord",
    args: matchId !== undefined ? [matchId] : undefined,
    query: { enabled: deployed && matchId !== undefined },
  });

  if (!data) return { record: undefined, isLoading };

  const [buyOrderId, sellOrderId, fillAmountHandle, settlementPrice, matchedAt, published, revealedFillAmount, revealedQuoteAmount] =
    data as [bigint, bigint, `0x${string}`, bigint, bigint, boolean, bigint, bigint];

  return {
    record: {
      matchId: matchId!,
      buyOrderId,
      sellOrderId,
      fillAmountHandle,
      settlementPrice,
      matchedAt,
      published,
      revealedFillAmount,
      revealedQuoteAmount,
    } as MatchRecordData,
    isLoading,
  };
}
