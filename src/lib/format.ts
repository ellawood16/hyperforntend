export function formatUsd(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "$0.00";
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso: string, language: "en" | "ar"): string {
  return new Date(iso).toLocaleString(language === "ar" ? "ar" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Round API decimal strings to two places for display without floating-point loss. */
export function formatDecimal2(value: string): string {
  const match = /^([+-]?)(\d+)(?:\.(\d*))?$/.exec(value);
  if (!match) return "0.00";
  const fraction = (match[3] ?? "").padEnd(3, "0");
  const cents = BigInt(match[2]) * 100n + BigInt(fraction.slice(0, 2)) + (fraction[2] >= "5" ? 1n : 0n);
  return `${match[1] === "-" && cents !== 0n ? "-" : ""}${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

/** At most two decimals, omitting insignificant trailing zeros for display. */
export function formatCompactAmount(value: string): string {
  return formatDecimal2(value).replace(/\.?0+$/, "");
}
