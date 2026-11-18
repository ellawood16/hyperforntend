import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryProvider } from "@/state/QueryProvider";
import { ThemeProvider } from "@/state/ThemeContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AuthProvider } from "@/state/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppShell } from "@/routes/AppShell";
import { WalletHomePage } from "@/features/wallet/WalletHomePage";
import { MarketPage } from "@/features/wallet/MarketPage";
import { AssetDetailPage } from "@/features/wallet/AssetDetailPage";
import { TransactionHistoryPage } from "@/features/transactions/TransactionHistoryPage";
import { NotificationsPage } from "@/features/notifications/NotificationsPage";
import { BroadcastPage } from "@/features/broadcast/BroadcastPage";
import { ChatRoomPage, ChatsPage, NewChatPage } from "@/features/messaging/ChatsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { IdentityVerificationPage } from "@/features/profile/IdentityVerificationPage";
import { AppErrorBoundary } from "@/components/shared/AppErrorBoundary";

import { AssetDetailPrototypes } from "@/features/wallet/prototypes/AssetDetailPrototypes";

import { SendPage } from "@/features/wallet/transfers/SendPage";
import { ReceivePage } from "@/features/wallet/transfers/ReceivePage";
import { InviteLandingPage } from "@/features/referrals/InviteLandingPage";
import { TeamPage } from "@/features/referrals/TeamPage";
import { CopyTradePage } from "@/features/copy/CopyTradePage";

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <I18nProvider>
          <AppErrorBoundary>
            <AuthProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/r/:code" element={<InviteLandingPage />} />

                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                      <Route path="/" element={<WalletHomePage />} />
                      <Route path="/market" element={<MarketPage />} />
                      <Route path="/asset/:network/:symbol" element={<AssetDetailPage />} />
                      <Route path="/asset/:network/:symbol/prototypes" element={<AssetDetailPrototypes />} />
                      <Route path="/send" element={<SendPage />} />
                      <Route path="/receive" element={<ReceivePage />} />
                      <Route path="/activity" element={<TransactionHistoryPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/messages" element={<ChatsPage />} />
                      <Route path="/messages/new" element={<NewChatPage />} />
                      <Route path="/messages/updates" element={<BroadcastPage />} />
                      <Route path="/messages/:conversationId" element={<ChatRoomPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/profile/identity" element={<IdentityVerificationPage />} />
                      <Route path="/team" element={<TeamPage />} />
                      <Route path="/copy" element={<CopyTradePage />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </AppErrorBoundary>
        </I18nProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
