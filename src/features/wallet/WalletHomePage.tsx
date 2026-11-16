import { brandConfig } from "@/config/site";
import { useWalletHome } from "./useWalletHome";
import { AnonWalletHome } from "./templates/AnonWalletHome";
import { AppleWalletHome } from "./templates/AppleWalletHome";
import { BinanceWalletHome } from "./templates/BinanceWalletHome";
import { DefaultWalletHome } from "./templates/DefaultWalletHome";

export function WalletHomePage() {
  const model = useWalletHome();
  switch (brandConfig.style) {
    case "anon": return <AnonWalletHome model={model} />;
    case "apple": return <AppleWalletHome model={model} />;
    case "binance": return <BinanceWalletHome model={model} />;
    default: return <DefaultWalletHome model={model} />;
  }
}
