import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { brandConfig } from "../src/config/site";
import { I18nProvider } from "../src/i18n/I18nProvider";
import { AuthProvider } from "../src/state/AuthContext";
import { IdentityVerificationPage } from "../src/features/profile/IdentityVerificationPage";
import type { KycStatusResponse } from "../src/api/kyc";

function renderKyc(style: "anon" | "apple" | "binance", overrides: Partial<KycStatusResponse> = {}) {
  const previousStyle = brandConfig.style;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData<KycStatusResponse>(["kyc-status"], {
    kyc_status: "unsubmitted", kyc_submitted_at: null, kyc_verified_at: null,
    kyc_reviewed_at: null, kyc_review_note: "", latest_submission: null, ...overrides,
  });
  try {
    brandConfig.style = style;
    return renderToStaticMarkup(
      <QueryClientProvider client={client}><I18nProvider><AuthProvider><MemoryRouter>
        <IdentityVerificationPage />
      </MemoryRouter></AuthProvider></I18nProvider></QueryClientProvider>,
    );
  } finally {
    brandConfig.style = previousStyle;
    client.clear();
  }
}

const fileInputs = (html: string) => (html.match(/type="file"/g) ?? []).length;

test("only Anon uses the stepped KYC layout; Apple and Binance retain the full form", () => {
  const anon = renderKyc("anon");
  assert.equal(fileInputs(anon), 1);
  assert.match(anon, /Step 1 of 4/);
  assert.equal((anon.match(/aria-current="step"/g) ?? []).length, 1);
  assert.doesNotMatch(anon, /type="submit"/);
  assert.match(anon, /class="anon-kyc-primary" disabled=""/);
  for (const style of ["apple", "binance"] as const) {
    const html = renderKyc(style);
    assert.equal(fileInputs(html), 3);
    assert.match(html, /type="submit"/);
    assert.doesNotMatch(html, /anon-kyc/);
  }
});

test("KYC status responses produce the correct pending and verified screens in every template", () => {
  for (const style of ["anon", "apple", "binance"] as const) {
    for (const status of ["pending", "verified"] as const) {
      const html = renderKyc(style, { kyc_status: status });
      assert.equal(fileInputs(html), 0);
      assert.match(html, status === "pending" ? /Under review/ : /Identity verified/);
    }
    const submitted = renderKyc(style, {
      latest_submission: { id: 1, status: "pending_review", created_at: "2026-11-15T00:00:00Z", uploaded_documents: ["id_front", "id_back", "selfie_with_id"] },
    });
    assert.equal(fileInputs(submitted), 0);
    assert.match(submitted, /Under review/);
  }
});

test("Anon shows rejection feedback and can continue past an already uploaded first document", () => {
  const rejected = renderKyc("anon", { kyc_status: "rejected", kyc_review_note: "The image is blurry." });
  assert.match(rejected, /The image is blurry\./);
  assert.equal(fileInputs(rejected), 1);
  const resumed = renderKyc("anon", {
    latest_submission: { id: 2, status: "uploading", created_at: "2026-11-15T00:00:00Z", uploaded_documents: ["id_front"] },
  });
  assert.match(resumed, /Already uploaded/);
  assert.doesNotMatch(resumed, /class="anon-kyc-primary" disabled=""/);
});
