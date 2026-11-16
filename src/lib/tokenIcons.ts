import { brandConfig } from "@/config/site";

const apkTokenIcons: Record<string, string> = {
  BTC: "/icons/apk/btc.svg",
  BTCB: "/icons/apk/btc.svg",
  BNB: "/icons/apk/bnb.svg",
  USDT: "/icons/apk/usdt.svg",
  USDC: "/icons/apk/usdc.svg",
};

export function tokenIconUrl(symbol: string, fallback?: string | null): string | null {
  return (brandConfig.style === "apple" ? apkTokenIcons[symbol.toUpperCase()] : null) ?? fallback ?? null;
}
