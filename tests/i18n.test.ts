import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider, interpolateTranslation, useT } from "../src/i18n/I18nProvider";

function VerificationSubtitle() {
  const t = useT();
  return createElement("p", null, t("auth.verifyEmailSubtitle", { email: "user@example.com" }));
}

test("translation interpolation works when String.replaceAll is unavailable", () => {
  const descriptor = Object.getOwnPropertyDescriptor(String.prototype, "replaceAll");

  try {
    Object.defineProperty(String.prototype, "replaceAll", {
      configurable: true,
      value: undefined,
    });

    assert.equal(
      interpolateTranslation("We sent a code to {email}. Use {email} to sign in.", {
        email: "user@example.com",
      }),
      "We sent a code to user@example.com. Use user@example.com to sign in.",
    );

    const html = renderToStaticMarkup(
      createElement(I18nProvider, null, createElement(VerificationSubtitle)),
    );
    assert.match(html, /We sent a 6-digit code to user@example\.com\./);
  } finally {
    if (descriptor) Object.defineProperty(String.prototype, "replaceAll", descriptor);
    else delete (String.prototype as { replaceAll?: unknown }).replaceAll;
  }
});
