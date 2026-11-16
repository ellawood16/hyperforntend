import test from "node:test";
import assert from "node:assert/strict";
import { units, inputAmount, spendable, normalizeAmount, withdrawQuote, isWalletAddress } from "../src/features/wallet/transfers/amounts";
import { displayAmount } from "../src/lib/amounts";
import { formatDecimal2, formatCompactAmount } from "../src/lib/format";

const config = { fee: "1.000000", threshold: "5.000000", below_threshold_fee: "0.000000", min_withdraw: "0.000000" };
test("copy amounts omit trailing zeros and round exact API decimals to at most two places", () => {
  for (const [input, output] of [
    ["100.000000", "100"], ["100.230000", "100.23"], ["100.200000", "100.2"],
    ["99.995000", "100"], ["0.000001", "0"], ["-12.345000", "-12.35"],
    ["999999999999.995000000000000000", "1000000000000"],
  ]) assert.equal(formatCompactAmount(input), output);
});
test("fee threshold equality matches the backend and fee is deducted from the amount", () => {
  assert.deepEqual(withdrawQuote("5", config), { fee: "0", net: "5", valid: true });
  assert.deepEqual(withdrawQuote("5.000001", config), { fee: "1", net: "4.000001", valid: true });
});
test("zero threshold and minimum/fee guards", () => {
  const fixed = { ...config, threshold: "0", min_withdraw: "2" };
  assert.equal(withdrawQuote("1", fixed).valid, false);
  assert.equal(withdrawQuote("1.999999", fixed).valid, false);
  assert.deepEqual(withdrawQuote("2", fixed), { fee: "1", net: "1", valid: true });
});
test("six-decimal send precision and exact balance comparisons", () => {
  for (const input of ["0", "-1", "NaN", "1e3", "1.0000001", "100000000000000", ".", ""]) assert.equal(inputAmount(input), false, input);
  assert.equal(inputAmount("0.000001"), true);
  assert.equal(inputAmount("1.001", 2), false);
  assert.equal(units("90071992547409.000001") > units("90071992547409.000000"), true);
});
test("Max rounds down rather than overspending a high-precision balance", () => {
  assert.equal(spendable("12.999999999999999999"), "12.999999");
  assert.equal(spendable("0.000000999999999999"), "0");
});
test("locale entry and exact history rounding", () => {
  assert.equal(normalizeAmount("١٢٫٣٤"), "12.34");
  assert.equal(normalizeAmount("۱۲.۳۴"), "12.34");
  assert.equal(formatDecimal2("999999999999.995000000000000000"), "1000000000000.00");
  assert.equal(formatDecimal2("0.004999999999999999"), "0.00");
});
test("destination rejects malformed and zero addresses", () => {
  assert.equal(isWalletAddress("0x1111111111111111111111111111111111111111"), true);
  assert.equal(isWalletAddress("0x" + "0".repeat(40)), false);
  assert.equal(isWalletAddress("0x1234"), false);
  assert.equal(isWalletAddress("https://example.com"), false);
});

test("send review preserves small fees while trimming trailing zeros", () => {
  assert.equal(displayAmount("10.000000"), "10.00");
  assert.equal(displayAmount("0.000001"), "0.000001");
});
