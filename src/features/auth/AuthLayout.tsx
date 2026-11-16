import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

export function AuthLayout({
  children,
  onBack,
  title,
  subtitle,
}: {
  children: ReactNode;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="brand-auth mx-auto flex min-h-dvh max-w-md flex-col px-6 py-6 sm:py-8">
      <div className="mb-6 h-6 shrink-0 sm:mb-8">
        {onBack && (
          <button onClick={onBack} aria-label="Back" className="text-app-primary">
            <ChevronLeft className="h-6 w-6 rtl:rotate-180" />
          </button>
        )}
      </div>
      <div className="brand-auth-content flex flex-1 flex-col justify-center">
        {title && <h1 className="mb-2 text-headline text-app-primary">{title}</h1>}
        {subtitle && <p className="mb-6 text-body text-app-secondary">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
