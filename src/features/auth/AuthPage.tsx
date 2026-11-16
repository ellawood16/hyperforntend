import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT, useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/state/AuthContext";
import { AuthLayout } from "./AuthLayout";
import { WelcomeStep } from "./steps/WelcomeStep";
import { EmailStep } from "./steps/EmailStep";
import { LoginPasswordStep } from "./steps/LoginPasswordStep";
import { RegisterNameStep } from "./steps/RegisterNameStep";
import { RegisterPasswordStep } from "./steps/RegisterPasswordStep";
import { CodeStep } from "./steps/CodeStep";
import { ForgotPasswordRequestStep } from "./steps/ForgotPasswordRequestStep";
import { ForgotPasswordConfirmStep } from "./steps/ForgotPasswordConfirmStep";
import {
  login,
  register,
  confirmEmailVerification,
  requestEmailVerification,
  confirmLoginChallenge,
  requestPasswordReset,
  confirmPasswordReset,
  isLoginChallenge,
} from "@/api/auth";
import { ApiError } from "@/api/types";
import { clearInvite, pendingInvite } from "@/features/referrals/inviteStorage";
import { RegistrationChoice } from "@/features/referrals/RegistrationChoice";

type Step =
  | { kind: "welcome" }
  | { kind: "email" }
  | { kind: "loginPassword"; email: string }
  | { kind: "registerName"; email: string }
  | { kind: "registerPassword"; email: string; firstName: string; lastName: string }
  | { kind: "verifyEmail"; email: string }
  | { kind: "registrationChoice"; email: string }
  | { kind: "loginChallenge"; email: string; challengeId: string }
  | { kind: "forgotRequest"; email: string }
  | { kind: "forgotConfirm"; email: string };

export function AuthPage() {
  const t = useT();
  const { language } = useI18n();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const verificationLink = (() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#verify-email?")) return undefined;
    const params = new URLSearchParams(hash.slice("#verify-email?".length));
    const email = params.get("email")?.trim();
    const code = params.get("code")?.replace(/\D/g, "").slice(0, 6) ?? "";
    return email ? { email, code } : undefined;
  })();
  const [step, setStep] = useState<Step>(verificationLink ? { kind: "verifyEmail", email: verificationLink.email } : { kind: "welcome" });
  const [initialVerificationCode] = useState(verificationLink?.code ?? "");
  useEffect(() => {
    if (verificationLink) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [resendLoading, setResendLoading] = useState(false);

  const goto = (next: Step) => {
    setError(undefined);
    setStep(next);
  };

  const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : t("common.somethingWrong"));

  const enterApp = async () => {
    await refreshUser();
    clearInvite();
    navigate("/", { replace: true });
  };

  const handleLogin = async (password: string) => {
    if (step.kind !== "loginPassword") return;
    setLoading(true);
    setError(undefined);
    try {
      const result = await login(step.email, password, language);
      if (isLoginChallenge(result)) {
        goto({ kind: "loginChallenge", email: step.email, challengeId: result.challenge_id });
      } else {
        await enterApp();
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPassword = async (password: string) => {
    if (step.kind !== "registerPassword") return;
    setLoading(true);
    setError(undefined);
    try {
      await register(
        { email: step.email, password, first_name: step.firstName, last_name: step.lastName,
          referrer_memo: pendingInvite() ?? undefined },
        language,
      );
      clearInvite();
      goto({ kind: "verifyEmail", email: step.email });
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors && typeof err.fieldErrors === "object" && "referrer_memo" in err.fieldErrors) {
        clearInvite();
        setError(t("referral.inviteExpired"));
      } else setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (code: string) => {
    if (step.kind !== "verifyEmail") return;
    setLoading(true);
    setError(undefined);
    try {
      await confirmEmailVerification(step.email, code);
      goto({ kind: "registrationChoice", email: step.email });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (step.kind !== "verifyEmail") return;
    setResendLoading(true);
    setError(undefined);
    try {
      await requestEmailVerification(step.email, language);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  const handleLoginChallenge = async (code: string) => {
    if (step.kind !== "loginChallenge") return;
    setLoading(true);
    setError(undefined);
    try {
      await confirmLoginChallenge(step.email, step.challengeId, code, language);
      await enterApp();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (email: string) => {
    setLoading(true);
    setError(undefined);
    try {
      await requestPasswordReset(email);
      goto({ kind: "forgotConfirm", email });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotConfirm = async (code: string, newPassword: string, confirmPassword: string) => {
    if (step.kind !== "forgotConfirm") return;
    setLoading(true);
    setError(undefined);
    try {
      await confirmPasswordReset(step.email, code, newPassword, confirmPassword);
      goto({ kind: "loginPassword", email: step.email });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  switch (step.kind) {
    case "welcome":
      return <WelcomeStep onContinue={() => goto({ kind: "email" })} />;

    case "email":
      return (
        <AuthLayout onBack={() => goto({ kind: "welcome" })}>
          <EmailStep
            onResolved={(email, nextStep) =>
              goto({
                kind: nextStep === "register" ? "registerName"
                  : nextStep === "verify_email" ? "verifyEmail" : "loginPassword",
                email,
              })
            }
          />
        </AuthLayout>
      );

    case "loginPassword":
      return (
        <AuthLayout onBack={() => goto({ kind: "email" })} title={t("auth.loginTitle")} subtitle={step.email}>
          <LoginPasswordStep
            loading={loading}
            error={error}
            onSubmit={handleLogin}
            onForgotPassword={() => goto({ kind: "forgotRequest", email: step.email })}
          />
        </AuthLayout>
      );

    case "registerName":
      return (
        <AuthLayout onBack={() => goto({ kind: "email" })} title={t("auth.registerTitle")}>
          <RegisterNameStep
            onSubmit={(firstName, lastName) => goto({ kind: "registerPassword", email: step.email, firstName, lastName })}
          />
        </AuthLayout>
      );

    case "registerPassword":
      return (
        <AuthLayout
          onBack={() => goto({ kind: "registerName", email: step.email })}
          title={t("auth.registerTitle")}
          subtitle={step.email}
        >
          <RegisterPasswordStep loading={loading} error={error} onSubmit={handleRegisterPassword} />
        </AuthLayout>
      );

    case "verifyEmail":
      return (
        <AuthLayout onBack={() => goto({ kind: "email" })} title={t("auth.verifyEmailTitle")} subtitle={t("auth.verifyEmailSubtitle", { email: step.email })}>
          <CodeStep
            initialCode={initialVerificationCode}
            submitLabel={t("auth.verifyEmailButton")}
            loading={loading}
            error={error}
            resendLoading={resendLoading}
            onSubmit={handleVerifyEmail}
            onResend={handleResendVerification}
          />
        </AuthLayout>
      );

    case "registrationChoice":
      return <AuthLayout><RegistrationChoice onWeb={() => goto({ kind: "loginPassword", email: step.email })} /></AuthLayout>;

    case "loginChallenge":
      return (
        <AuthLayout
          onBack={() => goto({ kind: "loginPassword", email: step.email })}
          title={t("auth.challengeTitle")}
          subtitle={t("auth.challengeSubtitle", { email: step.email })}
        >
          <CodeStep loading={loading} error={error} onSubmit={handleLoginChallenge} />
        </AuthLayout>
      );

    case "forgotRequest":
      return (
        <AuthLayout
          onBack={() => goto({ kind: "loginPassword", email: step.email })}
          title={t("auth.forgotTitle")}
          subtitle={t("auth.forgotSubtitle")}
        >
          <ForgotPasswordRequestStep initialEmail={step.email} loading={loading} error={error} onSubmit={handleForgotRequest} />
        </AuthLayout>
      );

    case "forgotConfirm":
      return (
        <AuthLayout onBack={() => goto({ kind: "forgotRequest", email: step.email })} title={t("auth.forgotTitle")}>
          <ForgotPasswordConfirmStep loading={loading} error={error} onSubmit={handleForgotConfirm} />
        </AuthLayout>
      );
  }
}
