import { cn } from "@/lib/cn";

export function ApkIcon({ name, className }: { name: "send" | "qr"; className?: string }) {
  return <span className={cn("apk-icon", `apk-icon--${name}`, className)} aria-hidden="true" />;
}
