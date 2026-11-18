import { Outlet } from "react-router-dom";
import { AuthPage } from "@/features/auth/AuthPage";
import { useAuth } from "@/state/AuthContext";
import { Spinner } from "@/components/shared/Spinner";

export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-background">
        <Spinner className="h-8 w-8 text-app-primary" />
      </div>
    );
  }

  // No /auth route — show onboarding/login in place so the URL never becomes /auth.
  if (status === "unauthenticated") {
    return <AuthPage />;
  }

  return <Outlet />;
}
