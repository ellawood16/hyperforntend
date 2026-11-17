import { http } from "@/lib/http";
import { getDeviceMetadata, getMarketingAttribution, type DeviceMetadata } from "@/lib/device";

type WithDevice<T> = T & DeviceMetadata;

export type UserProfile = {
  id: number;
  email: string;
  username: string | null;
  avatar_id: string | null;
  first_name: string;
  last_name: string;
  phone_number: string;
  country: string;
  country_code: string;
  state: string;
  memo: string;
  email_verified: boolean;
  is_vip: boolean;
  invited_vip_count: number;
  two_factor_enabled: boolean;
  new_device_challenge_enabled: boolean;
  account_closed: boolean;
  account_frozen: boolean;
  freeze_reason: string;
  kyc_status: string;
  kyc_submitted_at: string | null;
  kyc_verified_at: string | null;
  kyc_reviewed_at: string | null;
  kyc_review_note: string;
};

export function getProfile() {
  return http.get<UserProfile>("/api/auth/user/");
}

export type EmailNextStep = "register" | "verify_email" | "login";

export function checkAvailability(email: string) {
  return http.post<{ email_available: boolean | null; username_available: boolean | null; next_step: EmailNextStep | null }>(
    "/api/auth/check-availability/",
    { email },
    { skipAuthRetry: true },
  );
}

export type RegisterPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  referrer_memo?: string;
};

export function register(payload: RegisterPayload, language: "en" | "ar") {
  const body: WithDevice<RegisterPayload> = {
    ...payload,
    ...getDeviceMetadata(language),
    ...getMarketingAttribution(),
  };
  return http.post<{ email: string; first_name: string; last_name: string; memo: string }>(
    "/api/auth/register/",
    body,
    { skipAuthRetry: true },
  );
}

export function requestEmailVerification(email: string, language: "en" | "ar") {
  return http.post<{ detail: string }>("/api/auth/email-verification/request/", {
    email,
    ...getDeviceMetadata(language),
  }, { skipAuthRetry: true });
}

export function confirmEmailVerification(email: string, code: string) {
  return http.post<{ detail: string }>("/api/auth/email-verification/confirm/", { email, code }, { skipAuthRetry: true });
}

export type LoginChallenge = {
  requires_challenge: true;
  challenge_type: string;
  challenge_id: string;
  detail: string;
  retry_after?: number;
};

/** A non-challenge response is an empty object — tokens went into cookies,
 * see accounts/web_views.py::_cookieify on the backend. */
export type LoginResult = LoginChallenge | Record<string, never>;

export function isLoginChallenge(result: LoginResult): result is LoginChallenge {
  return "requires_challenge" in result && result.requires_challenge === true;
}

export function login(email: string, password: string, language: "en" | "ar") {
  const body: WithDevice<{ email: string; password: string }> = {
    email,
    password,
    ...getDeviceMetadata(language),
  };
  return http.post<LoginResult>("/api/auth/web/login/", body, { skipAuthRetry: true });
}

export function confirmLoginChallenge(
  email: string,
  challengeId: string,
  code: string,
  language: "en" | "ar",
) {
  const body = {
    email,
    challenge_id: challengeId,
    code,
    ...getDeviceMetadata(language),
  };
  return http.post<Record<string, never>>("/api/auth/web/login/challenge/confirm/", body, {
    skipAuthRetry: true,
  });
}

export function requestPasswordReset(email: string) {
  return http.post<{ detail: string }>("/api/auth/password-reset/request/", { email }, { skipAuthRetry: true });
}

export function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string,
) {
  return http.post<{ detail: string }>("/api/auth/password-reset/confirm/", {
    email,
    code,
    new_password: newPassword,
    confirm_password: confirmPassword,
  }, { skipAuthRetry: true });
}

export function logout() {
  return http.post<{ detail: string }>(
    "/api/auth/web/logout/",
    { device_id: getDeviceMetadata("en").device_id },
    { skipAuthRetry: true },
  );
}

export function logoutOtherDevices() {
  return http.post<{ message: string }>("/api/auth/logout-other-devices/");
}

export function updateLoginSecurity(settings: { two_factor_enabled?: boolean; new_device_challenge_enabled?: boolean }) {
  return http.patch<{ two_factor_enabled: boolean; new_device_challenge_enabled: boolean }>("/api/auth/user/security/", settings);
}

export type ProfileUpdate = Pick<UserProfile, "first_name" | "last_name" | "phone_number" | "country" | "country_code" | "state">;

export function updateProfile(profile: Partial<ProfileUpdate>) {
  return http.patch<{ message: string; user: UserProfile }>("/api/auth/user/update/", profile);
}

export function changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  return http.post<{ message: string }>("/api/auth/change-password/", {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
}

export function deleteAccount(password: string, reason = "") {
  return http.post<{ message: string }>("/api/auth/user/delete/", {
    password,
    reason,
  }, { skipAuthRetry: true });
}
