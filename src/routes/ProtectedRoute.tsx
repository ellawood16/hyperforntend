import { Navigate, Outlet } from "react-router-dom";
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

  if (status === "unauthenticated") {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

/** Inverse guard for the auth flow — an already-signed-in visitor hitting
 * /auth goes straight to the wallet instead of re-doing login. */
export function GuestRoute() {
  const { status } = useAuth();

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
