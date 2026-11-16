import test from "node:test";
import assert from "node:assert/strict";
import {
  register, checkAvailability, requestEmailVerification, confirmEmailVerification,
  requestPasswordReset, confirmPasswordReset, getProfile,
} from "../src/api/auth";
import { ApiError } from "../src/api/types";
import { setUnauthenticatedHandler } from "../src/lib/http";

test("public signup and recovery failures do not refresh or end an unrelated session", async (context) => {
  const paths: string[] = [];
  let sessionEnded = false;
  setUnauthenticatedHandler(() => { sessionEnded = true; });
  context.after(() => setUnauthenticatedHandler(() => {}));
  context.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const path = new URL(String(input)).pathname;
    paths.push(path);
    assert.equal(init?.credentials, "include");
    if (path.endsWith("/csrf/")) return Response.json({ csrf_token: "test-csrf" });
    assert.equal((init?.headers as Record<string, string>)["X-CSRF-Token"], "test-csrf");
    return Response.json({ detail: "Validation failed.", code: "validation_error" }, { status: 401 });
  });
  const calls = [
    () => register({ email: "signup@example.com", password: "Strong!Phrase42", first_name: "New", last_name: "User" }, "en"),
    () => checkAvailability("signup@example.com"),
    () => requestEmailVerification("signup@example.com", "en"),
    () => confirmEmailVerification("signup@example.com", "123456"),
    () => requestPasswordReset("signup@example.com"),
    () => confirmPasswordReset("signup@example.com", "123456", "Strong!Phrase42", "Strong!Phrase42"),
  ];
  for (const call of calls) {
    await assert.rejects(call, (error: unknown) => error instanceof ApiError && error.message === "Validation failed.");
  }
  assert.equal(paths.filter((path) => !path.endsWith("/csrf/")).length, calls.length);
  assert.equal(paths.some((path) => path.endsWith("/token/refresh/")), false);
  assert.equal(sessionEnded, false);
});

test("protected requests still refresh expired sessions and retry", async (context) => {
  const paths: string[] = [];
  let profileCalls = 0;
  context.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const path = new URL(String(input)).pathname;
    paths.push(path);
    if (path.endsWith("/csrf/")) return Response.json({ csrf_token: "test-csrf" });
    if (path.endsWith("/token/refresh/")) return Response.json({ refreshed: true });
    if (++profileCalls === 1) return Response.json({ code: "token_not_valid" }, { status: 401 });
    return Response.json({ email: "signup@example.com" });
  });
  assert.equal((await getProfile()).email, "signup@example.com");
  assert.deepEqual(paths, ["/api/auth/user/", "/api/auth/web/csrf/", "/api/auth/web/token/refresh/", "/api/auth/user/"]);
});
