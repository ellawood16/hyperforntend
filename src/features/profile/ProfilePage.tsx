import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Bell, Check, ChevronRight, Languages, LogOut, Palette, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { changePassword, deleteAccount, updateLoginSecurity, updateProfile, type ProfileUpdate, type UserProfile } from "@/api/auth";
import { ApiError } from "@/api/types";
import { getKycStatus, type KycStatusResponse } from "@/api/kyc";
import { Button } from "@/components/shared/Button";
import { TextField } from "@/components/shared/TextField";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { brandConfig } from "@/config/site";
import { useAuth } from "@/state/AuthContext";
import { useTheme } from "@/state/ThemeContext";

type View = "home" | "personal" | "security" | "password" | "delete" | "identity" | "preferences";
type Translate = ReturnType<typeof useT>;
type HomeProps = {
  user: UserProfile;
  name: string;
  kyc: KycStatusResponse | undefined;
  t: Translate;
  open: (view: View) => void;
  theme: string;
  language: string;
  onLogout: () => void;
};

function fullName(user: UserProfile) {
  return [user.first_name, user.last_name].map(part => part?.trim()).filter(Boolean).join(" ") || user.email;
}

function statusKey(status: string | undefined) {
  if (status === "verified") return "profile.verified";
  if (status === "pending") return "profile.kycPending";
  if (status === "rejected") return "profile.kycRejected";
  return "profile.kycUnsubmitted";
}

function statusBody(status: string | undefined) {
  if (status === "verified") return "profile.kycVerifiedBody";
  if (status === "pending") return "profile.kycPendingBody";
  if (status === "rejected") return "profile.kycRejectedBody";
  return "profile.kycUnsubmittedBody";
}

function AppleProfileIcon({ kind }: { kind: "personal" | "security" | "password" }) {
  return <svg className={`apple-profile-icon apple-profile-icon--${kind}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === "personal" ? <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></> : kind === "security" ? <><path d="M12 2 20 5v6c0 5-3 8-8 11-5-3-8-6-8-11V5z"/><path d="m9 12 2 2 4-4"/></> : <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>}</svg>;
}

function ProfileOverview({ user, name, kyc, t, open, theme, language, onLogout }: HomeProps) {
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const rows: Array<{ label: string; hint: string; action: () => void; icon: typeof UserRound }> = [
    { label: t("profile.personal"), hint: t("profile.personalHint"), action: () => open("personal"), icon: UserRound },
    { label: t("profile.security"), hint: t("profile.securityHint"), action: () => open("security"), icon: ShieldCheck },
  ];
  if (brandConfig.style !== "apple") return <div className={`profile-layout profile-layout--${brandConfig.style}`}>
    <header className="profile-card"><span className="profile-avatar">{initials}</span><div><small>{t("profile.account")}</small><h1>{name}</h1><p>{user.email}</p>{user.username && <p>@{user.username}</p>}</div></header>
    {brandConfig.style !== "anon" && <button className="profile-status-card" type="button" onClick={() => open("identity")}><ShieldCheck /><span><strong>{t("profile.identity")}</strong><small>{t(statusBody(kyc?.kyc_status ?? user.kyc_status))}</small></span><b>{t(statusKey(kyc?.kyc_status ?? user.kyc_status))}</b><ChevronRight /></button>}
    <section className="profile-menu"><h2>{t("profile.accountSecurity")}</h2><div>{rows.map(({label, hint, action, icon: Icon}) => <button key={label} type="button" onClick={action}><Icon /><span><strong>{label}</strong><small>{hint}</small></span><ChevronRight /></button>)}</div></section>
    <section className="profile-menu"><h2>{t("profile.preferences")}</h2><div><button type="button" onClick={() => open("preferences")}><Palette/><span><strong>{t("profile.theme")}</strong><small>{t(theme === "dark" ? "profile.themeDark" : "profile.themeLight")}</small></span><ChevronRight/></button><button type="button" onClick={() => open("preferences")}><Languages/><span><strong>{t("profile.language")}</strong><small>{t(language === "ar" ? "profile.languageArabic" : "profile.languageEnglish")}</small></span><ChevronRight/></button><Link to="/team"><Users/><span><strong>{t("referral.team")}</strong></span><ChevronRight/></Link><Link to="/notifications"><Bell/><span><strong>{t("profile.notifications")}</strong></span><ChevronRight/></Link></div></section>
    <FooterActions t={t} onLogout={onLogout}/>
  </div>;
  return <div className="brand-profile mx-auto max-w-3xl">
    <header className="brand-profile-identity space-y-4 pt-2">
      <span className="text-label font-semibold uppercase tracking-wider text-app-accent">{t("profile.account")}</span>
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-app-icon-container text-title-md text-app-on-icon-container">{initials}</span>
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-headline text-app-primary">{name}</h1>
          <p className="break-all text-body text-app-secondary">{user.email}</p>
          {user.username && <p className="text-label text-app-secondary">@{user.username}</p>}
        </div>
      </div>
    </header>
    <button type="button" onClick={() => open("identity")} className="brand-profile-verification flex w-full items-start gap-4 py-4 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent">
      <ShieldCheck className="h-6 w-6 shrink-0 text-app-accent" aria-hidden="true" />
      <span className="flex-1"><span className="block text-title-md text-app-primary">{t("profile.identity")}</span>
        <span className="block text-body text-app-secondary">{t(statusBody(kyc?.kyc_status ?? user.kyc_status))}</span>
        <span className="mt-2 block text-label text-app-accent">{t(statusKey(kyc?.kyc_status ?? user.kyc_status))}</span>
      </span>
      <ChevronRight className="h-5 w-5 text-app-secondary rtl:rotate-180" aria-hidden="true" />
    </button>
    <section className="profile-security-section">
      <h2 className="mb-3 text-title-md text-app-primary">{t("profile.accountSecurity")}</h2>
      <div className="profile-security-tiles">{rows.map(({ label, hint, action, icon: Icon }, index) => <button key={label} type="button" onClick={action}
        className="profile-security-tile text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent">
        {brandConfig.style === "apple" ? <AppleProfileIcon kind={(["personal", "security", "password"] as const)[index]} /> : <Icon className="h-5 w-5 shrink-0 text-app-secondary" aria-hidden="true" />}
        <span className="flex-1"><span className="block text-body-lg text-app-primary">{label}</span><span className="block text-label text-app-secondary">{hint}</span></span>
      </button>)}</div>
    </section>
    <section className="profile-preferences-section">
      <div className="profile-preference-rows" role="group" aria-label={t("profile.preferences")}>
        <button type="button" onClick={() => open("preferences")} className="flex min-h-14 w-full items-center gap-3 py-3 text-start"><Palette className="h-5 w-5 text-app-secondary" /><span className="flex-1 text-body-lg text-app-primary">{t("profile.theme")}</span><span className="text-body text-app-secondary">{t(theme === "dark" ? "profile.themeDark" : "profile.themeLight")}</span></button>
        <button type="button" onClick={() => open("preferences")} className="flex min-h-14 w-full items-center gap-3 py-3 text-start"><Languages className="h-5 w-5 text-app-secondary" /><span className="flex-1 text-body-lg text-app-primary">{t("profile.language")}</span><span className="text-body text-app-secondary">{t(language === "ar" ? "profile.languageArabic" : "profile.languageEnglish")}</span></button>
        <Link to="/team" className="flex min-h-14 items-center gap-3 py-3"><Users className="h-5 w-5 text-app-secondary" /><span className="text-body-lg text-app-primary">{t("referral.team")}</span></Link>
        <Link to="/notifications" className="flex min-h-14 items-center gap-3 py-3"><Bell className="h-5 w-5 text-app-secondary" /><span className="text-body-lg text-app-primary">{t("profile.notifications")}</span></Link>
      </div>
    </section>
    <FooterActions t={t} onLogout={onLogout} />
  </div>;
}

function FooterActions({ t, onLogout }: { t: Translate; onLogout: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return <div className="profile-footer">
    {confirming ? <div className="space-y-3 py-4 text-center"><p className="text-body text-app-primary">{t("profile.confirmLogout")}</p>
      <div className="flex justify-center gap-2"><Button variant="secondary" onClick={() => setConfirming(false)}>{t("common.cancel")}</Button><Button variant="destructive" onClick={onLogout}>{t("common.logout")}</Button></div>
    </div> : <div className="flex justify-center py-2"><Button type="button" variant="secondary" onClick={() => setConfirming(true)} className="min-w-48 text-app-danger"><LogOut className="h-5 w-5" />{t("common.logout")}</Button></div>}
  </div>;
}

function DetailFrame({ title, back, children, t }: { title: string; back: () => void; children: React.ReactNode; t: Translate }) {
  return <div className="mx-auto max-w-2xl">
    <button type="button" onClick={back} className="mb-6 inline-flex min-h-11 items-center gap-2 text-body text-app-secondary"><ArrowLeft className="h-5 w-5 rtl:rotate-180" />{t("common.back")}</button>
    <h1 className="mb-6 text-headline text-app-primary">{title}</h1>
    {children}
  </div>;
}

function PersonalDetails({ user, onSaved, t }: { user: UserProfile; onSaved: (user: UserProfile) => void; t: Translate }) {
  const [form, setForm] = useState<ProfileUpdate>({
    first_name: user.first_name, last_name: user.last_name, phone_number: user.phone_number,
    country: user.country, country_code: user.country_code, state: user.state,
  });
  const save = useMutation({ mutationFn: updateProfile, onSuccess: result => onSaved(result.user) });
  const edit = (key: keyof ProfileUpdate) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(current => ({ ...current, [key]: event.target.value }));
  const firstError = form.first_name !== user.first_name && form.first_name.trim().length < 2 ? t("profile.nameRequired") : undefined;
  const countryError = form.country !== user.country && !form.country.trim() ? t("profile.countryRequired") : undefined;
  const phoneError = form.phone_number !== user.phone_number && form.phone_number.trim() && !/^\+?[0-9\s\-()]{7,20}$/.test(form.phone_number.trim()) ? t("profile.phoneInvalid") : undefined;
  const valid = !firstError && !countryError && !phoneError && form.last_name.length <= 40 && form.state.length <= 80;
  const changedFields = (Object.keys(form) as Array<keyof ProfileUpdate>).filter(key => form[key].trim() !== (user[key] ?? "").trim());
  const dirty = changedFields.length > 0;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || !dirty || save.isPending) return;
    save.mutate(Object.fromEntries(changedFields.map(key => [key, form[key].trim()])) as Partial<ProfileUpdate>);
  };
  const nameFields = <div className="grid gap-4 sm:grid-cols-2">
    <TextField id="profile-first" label={t("profile.firstName")} value={form.first_name} onChange={edit("first_name")} maxLength={40} autoComplete="given-name" error={firstError} />
    <TextField id="profile-last" label={t("profile.lastName")} value={form.last_name} onChange={edit("last_name")} maxLength={40} autoComplete="family-name" />
  </div>;
  const locationFields = <div className="grid gap-4 sm:grid-cols-2">
    <TextField id="profile-country" label={t("profile.country")} value={form.country} onChange={edit("country")} maxLength={80} autoComplete="country-name" error={countryError} />
    <TextField id="profile-code" label={t("profile.countryCode")} value={form.country_code} onChange={edit("country_code")} maxLength={8} />
    <TextField id="profile-region" label={t("profile.region")} value={form.state} onChange={edit("state")} maxLength={80} autoComplete="address-level1" />
    <TextField id="profile-phone" label={t("profile.phone")} value={form.phone_number} onChange={edit("phone_number")} maxLength={20} type="tel" autoComplete="tel" error={phoneError} />
  </div>;
  return <form onSubmit={submit} className="space-y-6">
    <p className="break-all text-body text-app-secondary">{user.email} · {t("profile.emailLocked")}</p>
    <section className="space-y-6 border-b border-app pb-6"><h2 className="text-title-md text-app-primary">{t("profile.nameSection")}</h2>{nameFields}</section>
    <section className="space-y-4"><h2 className="text-title-md text-app-primary">{t("profile.locationSection")}</h2>{locationFields}</section>
    {!valid && <p role="status" className="text-label text-app-danger">{firstError || countryError || phoneError || t("profile.checkFields")}</p>}
    {!dirty && <p className="text-label text-app-secondary">{t("profile.noChanges")}</p>}
    {save.isError && <p role="alert" className="text-body text-app-danger">{t("profile.saveError")}</p>}
    <Button type="submit" loading={save.isPending} disabled={!valid || !dirty} fullWidth>{t("profile.saveProfile")}</Button>
  </form>;
}

function PasswordDetails({ t, onSignOut }: { t: Translate; onSignOut: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const change = useMutation({ mutationFn: () => changePassword(current, next, confirm), onSuccess: () => setDone(true) });
  if (done) return <div role="status" className="space-y-4 py-6">
    <BadgeCheck className="h-8 w-8 text-app-success" />
    <h2 className="text-title-md text-app-primary">{t("profile.passwordChanged")}</h2>
    <p className="text-body text-app-secondary">{t("profile.passwordChangedBody")}</p>
    <Button onClick={onSignOut}>{t("profile.signInAgain")}</Button>
  </div>;
  const canSubmit = current.length > 0 && next.length >= 8 && next !== current && confirm === next;
  const fields = <div className="space-y-4">
    <TextField id="current-password" type="password" autoComplete="current-password" label={t("profile.currentPassword")} value={current} onChange={event => setCurrent(event.target.value)} />
    <TextField id="new-password" type="password" autoComplete="new-password" label={t("profile.newPassword")} value={next} onChange={event => setNext(event.target.value)} error={next && next.length < 8 ? t("profile.passwordLength") : undefined} />
    <TextField id="confirm-password" type="password" autoComplete="new-password" label={t("profile.confirmPassword")} value={confirm} onChange={event => setConfirm(event.target.value)} error={confirm && confirm !== next ? t("profile.passwordMismatch") : undefined} />
  </div>;
  return <form onSubmit={event => { event.preventDefault(); if (canSubmit) change.mutate(); }} className="space-y-6">
    <p className="text-body text-app-secondary">{t("profile.passwordIntro")}</p>
    {fields}
    {next && next === current && <p role="status" className="text-label text-app-danger">{t("profile.passwordDifferent")}</p>}
    {change.isError && <p role="alert" className="text-body text-app-danger">{t("profile.passwordError")}</p>}
    <Button type="submit" loading={change.isPending} disabled={!canSubmit} fullWidth>{t("profile.updatePassword")}</Button>
  </form>;
}

function IdentityDetails({ user, kyc, loading, error, retry, t, language }: {
  user: UserProfile; kyc: KycStatusResponse | undefined; loading: boolean; error: boolean; retry: () => void; t: Translate; language: string;
}) {
  const status = kyc?.kyc_status ?? user.kyc_status;
  const date = (value: string | null | undefined) => value ? new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(new Date(value)) : null;
  const submitted = date(kyc?.kyc_submitted_at ?? user.kyc_submitted_at);
  const reviewed = date(kyc?.kyc_reviewed_at ?? user.kyc_reviewed_at);
  const verified = date(kyc?.kyc_verified_at ?? user.kyc_verified_at);
  const note = kyc?.kyc_review_note || user.kyc_review_note;
  const details = <div className="space-y-4">
    <div><p className="text-label text-app-secondary">{t("profile.currentStatus")}</p><p className="text-title-md text-app-primary">{t(statusKey(status))}</p></div>
    <p className="text-body text-app-secondary">{t(statusBody(status))}</p>
    {submitted && <p className="text-body text-app-primary">{t("profile.submittedOn", { date: submitted })}</p>}
    {reviewed && <p className="text-body text-app-primary">{t("profile.reviewedOn", { date: reviewed })}</p>}
    {verified && <p className="text-body text-app-primary">{t("profile.verifiedOn", { date: verified })}</p>}
    {status === "rejected" && note && <p className="border-s-2 border-app ps-4 text-body text-app-primary">{t("profile.reviewNote", { note })}</p>}
  </div>;
  return <div className="space-y-6">
    {loading && <p role="status" className="text-body text-app-secondary">{t("profile.loadingKyc")}</p>}
    {error && <div role="alert" className="space-y-3"><p className="text-body text-app-danger">{t("profile.kycLoadError")}</p><Button variant="secondary" onClick={retry}>{t("common.retry")}</Button></div>}
    <div className="border-b border-app pb-6">{details}</div>
    {(status === "unsubmitted" || status === "rejected") && <div className="space-y-3">
      <h2 className="text-title-md text-app-primary">{t("profile.nextStep")}</h2>
      <p className="text-body text-app-secondary">{t("kyc.intro")}</p>
      <Link to="/profile/identity" className="inline-flex min-h-12 items-center rounded-chip bg-app-action px-6 py-3 text-body font-semibold text-app-on-action">{t(status === "rejected" ? "profile.tryVerificationAgain" : "profile.startVerification")}</Link>
    </div>}
    {(status === "pending" || status === "verified") && <Link to="/profile/identity" className="inline-flex min-h-12 items-center text-body text-app-primary underline underline-offset-4">{t("profile.viewVerification")}</Link>}
  </div>;
}

function SecurityDetails({ user, t, onPassword, onDelete, onRefresh }: {
  user: UserProfile; t: Translate; onPassword: () => void; onDelete: () => void; onRefresh: () => Promise<void>;
}) {
  const security = useMutation({ mutationFn: updateLoginSecurity, onSuccess: onRefresh });
  const rows = [
    { key: "two_factor_enabled" as const, label: t("signal.twoFactor"), hint: t("profile.everyLoginHint") },
    { key: "new_device_challenge_enabled" as const, label: t("signal.newDevice"), hint: t("profile.newDeviceHint") },
  ];
  return <div className="space-y-6">
    <div className="border-b border-app pb-5">
      <p className="text-label text-app-secondary">{t("profile.emailVerification")}</p>
      <p className="break-all text-body-lg text-app-primary">{user.email}</p>
      <p className="text-body text-app-secondary">{t(user.email_verified ? "profile.verified" : "profile.notVerified")}</p>
    </div>
    <section className="space-y-2">
      <h2 className="mb-3 text-title-md text-app-primary">{t("profile.loginProtection")}</h2>
      {rows.map(({ key, label, hint }) => <label key={key} className="flex min-h-20 items-center gap-4 border-b border-app py-3">
        <span className="min-w-0 flex-1"><span className="block text-body-lg text-app-primary">{label}</span><span className="block text-label text-app-secondary">{hint}</span></span>
        <input type="checkbox" className="h-5 w-5 accent-[var(--app-accent)]" checked={user[key]} disabled={security.isPending}
          onChange={event => security.mutate({ [key]: event.target.checked })} />
      </label>)}
      {security.isPending && <p role="status" className="text-label text-app-secondary">{t("profile.savingSecurity")}</p>}
      {security.isError && <p role="alert" className="text-label text-app-danger">{t("profile.securityError")}</p>}
    </section>
    <button type="button" onClick={onPassword} className="flex min-h-14 w-full items-center justify-between rounded-card bg-app-surface-soft px-4 text-start text-body-lg text-app-primary">
      {t("profile.password")}<ChevronRight className="h-5 w-5 rtl:rotate-180" />
    </button>
    <button type="button" onClick={onDelete} className="flex min-h-14 w-full items-center justify-between rounded-card bg-app-surface-soft px-4 text-start text-body-lg text-app-danger">
      <span className="inline-flex items-center gap-2"><Trash2 className="h-5 w-5" aria-hidden="true" />{t("profile.deleteAccount")}</span>
      <ChevronRight className="h-5 w-5 rtl:rotate-180" />
    </button>
    <p className="text-label text-app-secondary">{t("profile.securityFootnote")}</p>
  </div>;
}

function DeleteAccountDetails({ t, onClosed }: { t: Translate; onClosed: () => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const close = useMutation({
    mutationFn: () => deleteAccount(password, reason.trim()),
    onSuccess: () => { void onClosed(); },
  });
  const fieldPasswordError = (() => {
    if (!(close.error instanceof ApiError) || !close.error.fieldErrors || typeof close.error.fieldErrors !== "object") return undefined;
    const errors = (close.error.fieldErrors as Record<string, unknown>).password;
    if (Array.isArray(errors) && typeof errors[0] === "string") return errors[0];
    return undefined;
  })();
  const canSubmit = password.length > 0 && !close.isPending;
  return <form
    onSubmit={event => {
      event.preventDefault();
      if (!password.trim()) {
        setPasswordError(t("profile.deleteAccountPasswordRequired"));
        return;
      }
      setPasswordError(undefined);
      close.mutate();
    }}
    className="space-y-6"
  >
    <p className="text-body text-app-secondary">{t("profile.deleteAccountIntro")}</p>
    <p className="text-body text-app-danger">{t("profile.deleteAccountWarning")}</p>
    <TextField
      id="delete-account-password"
      type="password"
      autoComplete="current-password"
      label={t("profile.deleteAccountPassword")}
      value={password}
      onChange={event => {
        setPassword(event.target.value);
        setPasswordError(undefined);
      }}
      error={passwordError || fieldPasswordError}
    />
    <TextField
      id="delete-account-reason"
      label={t("profile.deleteAccountReason")}
      value={reason}
      onChange={event => setReason(event.target.value)}
      maxLength={255}
      placeholder={t("profile.deleteAccountReasonPlaceholder")}
    />
    {close.isError && !fieldPasswordError && <p role="alert" className="text-body text-app-danger">{t("profile.deleteAccountError")}</p>}
    <Button type="submit" variant="destructive" loading={close.isPending} disabled={!canSubmit} fullWidth>
      {t("profile.deleteAccountConfirm")}
    </Button>
  </form>;
}

function PreferencesDetails({ t }: { t: Translate }) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useI18n();
  const themeOptions = [
    { key: "dark" as const, label: t("profile.themeDark") },
    { key: "light" as const, label: t("profile.themeLight") },
  ];
  const languageOptions = [
    { key: "en" as const, label: t("profile.languageEnglish") },
    { key: "ar" as const, label: t("profile.languageArabic") },
  ];
  return <div className="space-y-6">
    <section className="border-t border-app pt-5">
      <h2 className="mb-3 text-title-md text-app-primary">{t("profile.theme")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {themeOptions.map(option => <button key={option.key} type="button" aria-pressed={theme === option.key} onClick={() => setTheme(option.key)}
          className={"flex min-h-14 items-center justify-between gap-2 rounded-chip bg-app-surface-soft px-4 text-start text-body " + (theme === option.key ? "text-app-primary" : "text-app-secondary")}>
          {option.label}{theme === option.key && <Check className="h-5 w-5 text-app-accent" />}
        </button>)}
      </div>
    </section>
    <section className="border-t border-app pt-5">
      <h2 className="mb-3 text-title-md text-app-primary">{t("profile.language")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {languageOptions.map(option => <button key={option.key} type="button" aria-pressed={language === option.key} onClick={() => setLanguage(option.key)}
          className={"flex min-h-14 items-center justify-between gap-2 rounded-chip bg-app-surface-soft px-4 text-start text-body " + (language === option.key ? "text-app-primary" : "text-app-secondary")}>
          {option.label}{language === option.key && <Check className="h-5 w-5 text-app-accent" />}
        </button>)}
      </div>
    </section>
  </div>;
}

export function ProfilePage() {
  const t = useT();
  const { language } = useI18n();
  const { theme } = useTheme();
  const { user, setUser, refreshUser, signOut } = useAuth();
  const [view, setView] = useState<View>("home");
  const [feedback, setFeedback] = useState("");
  const kyc = useQuery({ queryKey: ["kyc-status"], queryFn: getKycStatus, staleTime: 30_000 });
  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  if (!user) return null;
  const open = (next: View) => { setFeedback(""); setView(next); };
  const onSaved = (updated: UserProfile) => { setUser(updated); setView("home"); setFeedback("profile.saved"); };
  const title = t(
    view === "personal" ? "profile.personal"
      : view === "security" ? "profile.security"
      : view === "password" ? "profile.password"
      : view === "delete" ? "profile.deleteAccountTitle"
      : view === "identity" ? "profile.identity"
      : "profile.preferences",
  );
  const props: HomeProps = { user, name: fullName(user), kyc: kyc.data, t, open, theme, language, onLogout: () => void signOut() };
  return <>
    <main className="px-4 pb-8 pt-6">
    {feedback && <p role="status" className="mb-4 text-body text-app-success">{t(feedback)}</p>}
    {view === "home" ? <ProfileOverview {...props} /> :
      <DetailFrame title={title} back={() => setView(view === "delete" || view === "password" ? "security" : "home")} t={t}>
        {view === "personal" && <PersonalDetails user={user} onSaved={onSaved} t={t} />}
        {view === "password" && <PasswordDetails t={t} onSignOut={() => void signOut()} />}
        {view === "delete" && <DeleteAccountDetails t={t} onClosed={signOut} />}
        {view === "security" && <SecurityDetails user={user} t={t} onPassword={() => open("password")} onDelete={() => open("delete")} onRefresh={refreshUser} />}
        {view === "identity" && <IdentityDetails user={user} kyc={kyc.data} loading={kyc.isPending} error={kyc.isError} retry={() => { void kyc.refetch(); }} t={t} language={language} />}
        {view === "preferences" && <PreferencesDetails t={t} />}
      </DetailFrame>}
    </main>
  </>;
}
