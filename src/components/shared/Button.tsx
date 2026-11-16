import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "accent" | "secondary" | "destructive" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-app-action text-app-on-action hover:opacity-90",
  accent: "bg-app-accent text-white hover:opacity-90",
  secondary: "bg-app-surface-soft text-app-primary hover:bg-app-surface-muted",
  destructive: "bg-app-danger text-white hover:opacity-90",
  ghost: "bg-transparent text-app-primary hover:bg-app-surface-soft",
};

export function Button({ variant = "primary", loading, fullWidth, className, children, disabled, ...rest }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-chip px-6 py-3 text-body font-semibold",
        "transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
