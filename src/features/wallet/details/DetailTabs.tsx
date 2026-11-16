import { useId, useRef, type ReactNode } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

type Tab = { id: string; label: string; content: ReactNode };

/** Manual activation: arrows move focus, Enter/Space select without surprise fetches. */
export function DetailTabs({ tabs, selected, onSelect, label }: {
  tabs: Tab[]; selected: string; onSelect: (id: string) => void; label: string;
}) {
  const uid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const { language } = useI18n();
  return <div>
    <div role="tablist" aria-label={label} className="flex gap-4 overflow-x-auto">
      {tabs.map((tab, index) => <button key={tab.id} type="button" role="tab"
        id={`${uid}-${tab.id}-tab`} aria-controls={`${uid}-${tab.id}-panel`}
        aria-selected={selected === tab.id} tabIndex={selected === tab.id ? 0 : -1}
        ref={element => { refs.current[index] = element; }}
        onClick={() => onSelect(tab.id)}
        onKeyDown={event => {
          const direction = language === "ar" ? -1 : 1;
          let next: number | undefined;
          if (event.key === "ArrowRight") next = (index + direction + tabs.length) % tabs.length;
          if (event.key === "ArrowLeft") next = (index - direction + tabs.length) % tabs.length;
          if (event.key === "Home") next = 0;
          if (event.key === "End") next = tabs.length - 1;
          if (next !== undefined) { event.preventDefault(); refs.current[next]?.focus(); }
        }}
        className={cn("min-h-12 shrink-0 border-b-2 py-3 text-body font-semibold", selected === tab.id
          ? "border-[var(--app-accent)] text-app-primary" : "border-transparent text-app-secondary")}>
        {tab.label}
      </button>)}
    </div>
    {tabs.map(tab => <div key={tab.id} role="tabpanel" tabIndex={0} hidden={selected !== tab.id}
      id={`${uid}-${tab.id}-panel`} aria-labelledby={`${uid}-${tab.id}-tab`} className="pt-6">
      {tab.content}
    </div>)}
  </div>;
}
