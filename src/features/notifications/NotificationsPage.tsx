import { useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/shared/Button";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { TopBar } from "@/components/layout/TopBar";
import { Skeleton } from "@/components/shared/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { getNotifications, getUnreadCount, markAllNotificationsRead, type NotificationCategory } from "@/api/notifications";

import { NotificationRow } from "./components/NotificationRow";
import { NotificationPermissionCard } from "./components/NotificationPermissionCard";

export function NotificationsPage() {
  const t = useT();
  const { language } = useI18n();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<NotificationCategory>("signals");
  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["notifications", "inbox", category],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getNotifications(pageParam, 20, category),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });
  const notifications = data?.pages.flatMap((page) => page.notifications);
  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread-count", category],
    queryFn: () => getUnreadCount(category),
  });

  const { mutate: markAll, isPending: isMarkingAll, isError: markAllFailed } = useMutation({
    mutationFn: () => markAllNotificationsRead(category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="notification-inbox">
      <TopBar
        title={t("notif.title")}
        action={
          (unread?.unread_count ?? 0) > 0 ? (
            <button disabled={isMarkingAll} onClick={() => markAll()} className="min-h-10 text-label text-app-primary disabled:opacity-50">
              {t("notif.markAllRead")}
            </button>
          ) : undefined
        }
      />
      <div className="px-4">
        <div className="mb-4"><NotificationPermissionCard /></div>
        <div className="copy-tabs" role="group" aria-label={t("notif.filter")}>
          {(["signals", "other"] as const).map((value) => (
            <button key={value} onClick={() => setCategory(value)} aria-pressed={category === value}
              className="text-body">
              {t(`signal.${value}`)}
            </button>
          ))}
        </div>
        {markAllFailed && <p role="alert" className="py-3 text-body text-app-secondary">{t("notif.readError")}</p>}
        {isPending && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isError && notifications && notifications.length === 0 && <EmptyState message={t(category === "signals" ? "notif.signalsEmpty" : "notif.otherEmpty")} />}

        {notifications?.map((notification) => (
          <NotificationRow key={notification.id} notification={notification} language={language} />
        ))}
        {hasNextPage && (
          <Button variant="ghost" onClick={() => fetchNextPage()} loading={isFetchingNextPage} fullWidth>
            {t("tx.loadMore")}
          </Button>
        )}
      </div>
    </div>
  );
}
