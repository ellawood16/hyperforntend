import test from "node:test";
import assert from "node:assert/strict";
import { clearInvite, pendingInvite, rememberInvite } from "../src/features/referrals/inviteStorage";

test("invite attribution keeps the first valid code for 30 days and can be cleared", () => {
  const originalStorage = globalThis.localStorage;
  const originalNow = Date.now;
  const items = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => { items.set(key, value); },
    removeItem: (key: string) => { items.delete(key); },
  } as Storage;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    assert.equal(rememberInvite("AAAAAAAAAA"), "AAAAAAAAAA");
    assert.equal(rememberInvite("BBBBBBBBBB"), "AAAAAAAAAA");
    assert.equal(pendingInvite(), "AAAAAAAAAA");
    now += 31 * 24 * 60 * 60 * 1000;
    assert.equal(pendingInvite(), null);
    assert.equal(rememberInvite("12345678-1234-1234-1234-123456789abc"), "12345678-1234-1234-1234-123456789abc");
    clearInvite();
    assert.equal(pendingInvite(), null);
    globalThis.localStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    } as unknown as Storage;
    assert.equal(rememberInvite("CCCCCCCCCC"), "CCCCCCCCCC");
    assert.equal(pendingInvite(), "CCCCCCCCCC");
  } finally {
    Date.now = originalNow;
    globalThis.localStorage = originalStorage;
  }
});
