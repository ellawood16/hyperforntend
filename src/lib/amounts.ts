const SCALE = 10n ** 18n;
/** Exact token arithmetic. Never route a balance or fee through a JS Number. */
export function units(value: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,18}))?$/.exec(value);
  if (!match) throw new Error("Invalid decimal");
  return BigInt(match[1]) * SCALE + BigInt((match[2] ?? "").padEnd(18, "0"));
}
export function decimal(value: bigint): string {
  const fraction = (value % SCALE).toString().padStart(18, "0").replace(/0+$/, "");
  return `${value / SCALE}${fraction ? `.${fraction}` : ""}`;
}
export function inputAmount(value: string, decimals = 6): boolean {
  return /^\d+(?:\.\d+)?$/.test(value) && (value.split(".")[1]?.length ?? 0) <= Math.min(6, decimals)
    && value.split(".")[0].replace(/^0+/, "").length <= 14 && units(value) > 0n;
}
export function spendable(value: string, decimals = 6): string {
  const step = 10n ** BigInt(18 - Math.min(6, decimals));
  return decimal(units(value) / step * step);
}
export function normalizeAmount(value: string): string {
  return value.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776)).replace(/٫/g, ".");
}

/** Two places for whole amounts, retaining meaningful precision for fees/dust. */
export function displayAmount(value: string): string {
  const [whole, fraction = ""] = decimal(units(value)).split(".");
  return `${whole}.${fraction.padEnd(2, "0")}`;
}
