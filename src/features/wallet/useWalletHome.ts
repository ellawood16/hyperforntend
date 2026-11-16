import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWallet } from "@/api/wallet";
import { formatUsd } from "@/lib/format";

export function useWalletHome() {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [visibleAssetCount, setVisibleAssetCount] = useState(10);
  const { data: wallet, isPending, isError, refetch } = useQuery({
    queryKey: ["wallet"], queryFn: getWallet, staleTime: 30_000, refetchInterval: 60_000,
  });
  const displayMoney = (value: string | undefined) => balanceHidden ? "••••••" : formatUsd(value ?? "0");
  const assets = [...(wallet?.assets ?? [])].sort((left, right) =>
    Number(right.value_usd) - Number(left.value_usd),
  );
  const visibleAssets = assets.slice(0, visibleAssetCount);

  return { wallet, isPending, isError, refetch, balanceHidden, setBalanceHidden, visibleAssetCount, setVisibleAssetCount, displayMoney, assets, visibleAssets };
}

export type WalletHomeModel = ReturnType<typeof useWalletHome>;
