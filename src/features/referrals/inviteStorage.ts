const KEY = "hyperapp_pending_invite";
const TTL = 30 * 24 * 60 * 60 * 1000;
const CODE = /^(?:[A-HJ-NP-Z2-9]{10}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
let volatileInvite: { code: string; time: number } | null = null;

export function pendingInvite(): string | null {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null") as { code?: string; time?: number } | null;
    if (stored?.code && CODE.test(stored.code) && stored.time && Date.now() - stored.time < TTL) {
      return stored.code;
    }
    localStorage.removeItem(KEY);
  } catch { /* Private storage can be unavailable. */ }
  if (volatileInvite && Date.now() - volatileInvite.time < TTL) return volatileInvite.code;
  volatileInvite = null;
  return null;
}

export function rememberInvite(code: string): string | null {
  const existing = pendingInvite();
  if (existing) return existing;
  if (!CODE.test(code)) return null;
  volatileInvite = { code, time: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify({ code, time: Date.now() })); } catch { /* optional storage */ }
  return code;
}

export function clearInvite() {
  volatileInvite = null;
  try { localStorage.removeItem(KEY); } catch { /* optional storage */ }
}
