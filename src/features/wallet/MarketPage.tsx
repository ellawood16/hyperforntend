import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { getWallet } from "@/api/wallet";
import { TopBar } from "@/components/layout/TopBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/shared/Skeleton";
import { Button } from "@/components/shared/Button";
import { useT } from "@/i18n/I18nProvider";
import { AssetRow } from "./components/AssetRow";

export function MarketPage() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [visibleAssetCount, setVisibleAssetCount] = useState(10);
  const { data: wallet, isPending, isError, refetch } = useQuery({
    queryKey: ["wallet"], queryFn: getWallet, staleTime: 30_000, refetchInterval: 60_000,
  });
  const query = search.trim().toLocaleLowerCase();
  const assets = (wallet?.assets.filter((asset) =>
    asset.name.toLocaleLowerCase().includes(query) || asset.symbol.toLocaleLowerCase().includes(query) || asset.network_name.toLocaleLowerCase().includes(query),
  ) ?? []).sort((left, right) => Number(right.value_usd) - Number(left.value_usd));
  const visibleAssets = assets.slice(0, visibleAssetCount);

  return <main className="pb-8 pt-4">
    <TopBar title={t("market.title")} />
    <div className="px-4 sm:px-6 lg:px-8">
      <label className="mb-6 flex min-h-12 items-center gap-3 rounded-chip bg-app-input px-4 text-app-secondary focus-within:outline focus-within:outline-2 focus-within:outline-app-accent">
        <Search className="h-5 w-5 shrink-0" />
        <span className="sr-only">{t("market.search")}</span>
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("market.search")}
          className="min-w-0 flex-1 bg-transparent text-body text-app-primary outline-none placeholder:text-app-secondary" />
      </label>

      {isPending && <div className="grid gap-x-5 md:grid-cols-2">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-18 w-full rounded-card" />)}</div>}
      {isError && !wallet && <ErrorState onRetry={() => refetch()} />}
      {wallet && wallet.assets.length === 0 && <EmptyState message={t("wallet.noAssets")}
        action={<Button variant="secondary" onClick={() => refetch()}>{t("common.retry")}</Button>} />}
      {wallet && wallet.assets.length > 0 && assets.length === 0 && <EmptyState message={t("market.noResults")}
        action={<Button variant="secondary" onClick={() => setSearch("")}>{t("market.clearSearch")}</Button>} />}
      {wallet && assets.length > 0 && <div className="grid gap-x-5 md:grid-cols-2">
        {visibleAssets.map((asset) => <div key={`${asset.network}-${asset.symbol}`} className="border-b border-app"><AssetRow asset={asset} /></div>)}
      </div>}
      {wallet && assets.length > visibleAssets.length && <div className="flex justify-center pt-5">
        <Button variant="secondary" onClick={() => setVisibleAssetCount((count) => count + 10)}>{t("wallet.loadMore")}</Button>
      </div>}
    </div>
  </main>;
}
