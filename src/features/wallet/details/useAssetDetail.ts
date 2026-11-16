import { useQuery } from "@tanstack/react-query";
import { getCandleChart, getWallet } from "@/api/wallet";

/** Shared wallet and market state for asset details and design previews. */
export function useAssetDetail(network: string, symbol: string) {
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: getWallet });
  const chart = useQuery({
    queryKey: ["market-candles", network, symbol],
    queryFn: () => getCandleChart(network, symbol),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    staleTime: 3000,
  });
  const asset = wallet.data?.assets.find(item =>
    item.network.toLowerCase() === network.toLowerCase() && item.symbol.toLowerCase() === symbol.toLowerCase());
  return { wallet, chart, asset, network, symbol };
}
export type AssetDetailData = ReturnType<typeof useAssetDetail>;
