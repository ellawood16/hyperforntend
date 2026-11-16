import type { ReactNode } from "react";

export function EmptyState({ icon, message, action }: { icon?: ReactNode; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon ?? <span className="empty-state-art" aria-hidden="true">◇</span>}
      <p className="text-body text-app-secondary">{message}</p>
      {action}
    </div>
  );
}
