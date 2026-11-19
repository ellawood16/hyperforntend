import { http } from "@/lib/http";

export type AppNotification = {
  id: number;
  type: "signal" | "kyc_approved" | "deposit" | "withdraw" | "security" | "system" | "message";
  level: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  amount: string | null;
  token: string | null;
  network: string | null;
  tx_hash: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  implemented: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type NotificationPage = {
  notifications: AppNotification[];
  next_cursor: string | null;
};

export type NotificationCategory = "all" | "signals" | "other";

export function registerWebPushSubscription(deviceId: string, subscription: PushSubscriptionJSON) {
  return http.post<{ detail: string }>("/api/notifications/web-push-subscription/", {
    device_id: deviceId,
    subscription,
  });
}

export function getNotifications(cursor?: string, limit = 20, category: NotificationCategory = "all") {
  return http.get<NotificationPage>("/api/notifications/", { limit, cursor, category });
}

export function getUnreadCount(category: NotificationCategory = "all") {
  return http.get<{ unread_count: number }>("/api/notifications/unread-count/", { category });
}

export function markNotificationRead(id: number) {
  return http.post<{ detail: string }>(`/api/notifications/${id}/read/`);
}

export function markAllNotificationsRead(category: NotificationCategory = "all") {
  return http.post<{ detail: string; updated: number }>("/api/notifications/read-all/", undefined, { query: { category } });
}

export function deleteNotification(id: number) {
  return http.delete<void>(`/api/notifications/${id}/`);
}
