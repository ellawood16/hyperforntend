import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, Props>(({ label, error, className, id, ...rest }, ref) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-label text-app-secondary">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        className={cn(
          "rounded-chip bg-app-input px-4 py-3 text-body-lg text-app-primary outline-none",
          "border border-transparent focus:border-app-accent",
          error && "border-app-danger",
          className,
        )}
        {...rest}
      />
      {error && <p className="text-label text-app-danger">{error}</p>}
    </div>
  );
});
TextField.displayName = "TextField";
