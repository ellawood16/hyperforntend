import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, Props>(({ label, error, className, id, type, ...rest }, ref) => {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const isPassword = type === "password";
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-label text-app-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          type={inputType}
          className={cn(
            "w-full rounded-chip bg-app-input px-4 py-3 text-body-lg text-app-primary outline-none",
            "border border-transparent focus:border-app-accent",
            isPassword && "pe-12",
            error && "border-app-danger",
            className,
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute end-3 top-1/2 -translate-y-1/2 text-app-secondary"
            aria-label={t(visible ? "auth.hidePassword" : "auth.showPassword")}
            aria-pressed={visible}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && <p className="text-label text-app-danger">{error}</p>}
    </div>
  );
});
TextField.displayName = "TextField";
