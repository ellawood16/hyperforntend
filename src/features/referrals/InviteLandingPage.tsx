import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { checkInvite } from "@/api/referrals";
import { ApiError } from "@/api/types";
import { Button } from "@/components/shared/Button";
import { useT } from "@/i18n/I18nProvider";
import { useAuth } from "@/state/AuthContext";
import { clearInvite, rememberInvite } from "./inviteStorage";

export function InviteLandingPage() {
  const t = useT();
  const { status } = useAuth();
  const { code = "" } = useParams();
  const validShape = /^(?:[A-HJ-NP-Z2-9]{10}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(code);
  const invite = useQuery({
    queryKey: ["invite", code],
    queryFn: () => checkInvite(code),
    enabled: validShape,
    retry: false,
  });
  const invalid = !validShape || (invite.error instanceof ApiError && invite.error.status === 404);

  useEffect(() => {
    if (status === "authenticated") clearInvite();
    if (status === "unauthenticated" && invite.data?.valid) rememberInvite(code);
  }, [invite.data, code, status]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 px-6 bg-app-background">
      <div className="text-headline text-app-accent">Δ</div>
      <h1 className="text-title text-app-primary">{t("referral.invitedTitle")}</h1>
      {status === "authenticated" ? <>
        <p className="text-body text-app-secondary">{t("referral.existingAccount")}</p>
        <Link to="/"><Button fullWidth>{t("referral.continueWeb")}</Button></Link>
      </> : invite.isPending && validShape ? <p className="text-app-secondary">{t("common.loading")}</p> :
        invite.data?.valid ? <>
          <p className="text-body text-app-secondary">{t("referral.invitedBody")}</p>
          <Link to="/" onClick={() => rememberInvite(code)}><Button fullWidth>{t("referral.createAccount")}</Button></Link>
          <p className="text-label text-app-secondary">{t("referral.inviteRemembered")}</p>
        </> : invalid ? <>
          <p className="text-body text-app-secondary">{t("referral.invalidInvite")}</p>
          <Link to="/" onClick={clearInvite}><Button fullWidth>{t("referral.continueWithoutInvite")}</Button></Link>
        </> : <>
          <p role="alert" className="text-body text-app-secondary">{t("referral.checkError")}</p>
          <Button fullWidth onClick={() => invite.refetch()}>{t("common.retry")}</Button>
        </>}
    </main>
  );
}
