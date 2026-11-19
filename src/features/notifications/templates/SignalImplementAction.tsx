import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { brandConfig } from "@/config/site";
import { useT } from "@/i18n/I18nProvider";
import "./anon-signal-implement.css";
import "./apple-signal-implement.css";
import "./binance-signal-implement.css";

type Props = {
  to: string;
  implemented: boolean;
  onActivate?: () => void;
};

export function SignalImplementAction({ to, implemented, onActivate }: Props) {
  const t = useT();
  const style = brandConfig.style === "apple" || brandConfig.style === "binance" ? brandConfig.style : "anon";

  if (implemented) {
    return (
      <span className={`signal-implement signal-implement--${style} is-done`}>
        <Check aria-hidden="true" className="signal-implement-check" />
        {t("notif.implemented")}
      </span>
    );
  }

  return (
    <Link
      to={to}
      className={`signal-implement signal-implement--${style}`}
      onClick={onActivate}
    >
      {t("notif.implement")}
    </Link>
  );
}
