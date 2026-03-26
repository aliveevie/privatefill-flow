import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { type Address } from "viem";
import { useCallback } from "react";
import { SETTLEMENT_VAULT_ABI, ERC20_ABI } from "@/lib/contracts/config";
import { useProtocolAddresses } from "./usePrivateFill";

export function useVaultBalance(token: Address | undefined) {
  const { address } = useAccount();
  const { addresses, deployed } = useProtocolAddresses();

  const { data: balance, refetch } = useReadContract({
    address: addresses?.settlementVault as Address | undefined,
    abi: SETTLEMENT_VAULT_ABI,
    functionName: "deposits",
    args: address && token ? [address, token] : undefined,
    query: { enabled: deployed && !!address && !!token },
  });

  return { balance: balance as bigint | undefined, refetch };
}

export function useTokenBalance(token: Address | undefined) {
  const { address } = useAccount();

  const { data: balance } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!token },
  });

  return balance as bigint | undefined;
}

export function useTokenDecimals(token: Address | undefined) {
  const { data } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!token },
  });
  return data as number | undefined;
}

export function useTokenSymbol(token: Address | undefined) {
  const { data } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: !!token },
  });
  return data as string | undefined;
}

export function useVaultDeposit() {
  const { addresses, deployed } = useProtocolAddresses();
  const { writeContract: writeApprove, isPending: isApproving } = useWriteContract();
  const { writeContract: writeDeposit, isPending: isDepositing, isSuccess, error } = useWriteContract();

  const deposit = useCallback(
    async (token: Address, amount: bigint) => {
      if (!deployed || !addresses) return;

      // First approve the vault to spend tokens
      writeApprove({
        address: token,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [addresses.settlementVault, amount],
      });

      // Then deposit (user triggers this after approve confirms)
      writeDeposit({
        address: addresses.settlementVault,
        abi: SETTLEMENT_VAULT_ABI,
        functionName: "deposit",
        args: [token, amount],
      });
    },
    [deployed, addresses, writeApprove, writeDeposit]
  );

  return { deposit, isPending: isApproving || isDepositing, isSuccess, error };
}

export function useVaultWithdraw() {
  const { addresses, deployed } = useProtocolAddresses();
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  const withdraw = useCallback(
    (token: Address, amount: bigint) => {
      if (!deployed || !addresses) return;
      writeContract({
        address: addresses.settlementVault,
        abi: SETTLEMENT_VAULT_ABI,
        functionName: "withdraw",
        args: [token, amount],
      });
    },
    [deployed, addresses, writeContract]
  );

  return { withdraw, isPending, isSuccess, error };
}
