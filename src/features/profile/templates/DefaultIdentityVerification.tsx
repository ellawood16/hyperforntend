import { Link } from "react-router-dom";
import { BadgeCheck, Check, Clock3, Upload } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/shared/Skeleton";
import { useT } from "@/i18n/I18nProvider";
import { DOCUMENTS, type IdentityVerificationModel } from "../useIdentityVerification";

export function DefaultIdentityVerification({ model }: { model: IdentityVerificationModel }) {
  const t = useT();
  const { status, kyc, documents, error, setError, uploading, slowUpload, uploadingDocument, submitted, uncertain, setUncertain, submissionPending, canShowForm, alreadyUploaded, complete, selectFile, submit } = model;
  return <main className="asset-detail-view">
    <TopBar back title={t("kyc.title")} />
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
      {status.isPending && <Skeleton className="h-48 w-full rounded-card" />}
      {status.isError && !kyc && <ErrorState message={t("kyc.statusError")} onRetry={() => status.refetch()} />}
      {kyc?.kyc_status === "verified" && <StatusMessage verified title={t("kyc.verifiedTitle")} body={t("kyc.verifiedBody")} />}
      {(kyc?.kyc_status === "pending" || submissionPending || submitted) && kyc?.kyc_status !== "verified" && <StatusMessage title={t("kyc.pendingTitle")} body={t("kyc.pendingBody")} />}
      {canShowForm && <>
        <div>
          <h2 className="text-headline text-app-primary">{t("kyc.heading")}</h2>
          <p className="mt-2 text-body text-app-secondary">{t("kyc.intro")}</p>
          {kyc?.kyc_status === "rejected" && <p role="status" className="mt-4 text-body text-app-danger">{t("kyc.rejected")}{kyc.kyc_review_note && <> {kyc.kyc_review_note}</>}</p>}
        </div>
        <form onSubmit={event => void submit(event)} className="space-y-6">
          <div className="divide-app divide-y">
            {DOCUMENTS.map(({ key, apiType, label }) => <DocumentPicker key={key} label={t(label)}
              hint={t(key === "idFront" ? "kyc.frontHint" : key === "idBack" ? "kyc.backHint" : "kyc.selfieHint")}
              file={documents[key]} uploaded={alreadyUploaded(apiType)}
              disabled={uploading} onSelect={file => selectFile(key, file)} />)}
          </div>
          <p className="text-label text-app-secondary">{t("kyc.fileRules")}</p>
          {error && <p role="alert" className="text-body text-app-danger">{error.startsWith("kyc.") ? t(error) : error}</p>}
          {uncertain && <Button type="button" variant="secondary" onClick={async () => {
            const latest = await status.refetch();
            if (!latest.isError) { setUncertain(false); setError(""); }
          }}>{t("kyc.refreshStatus")}</Button>}
          {uploading && <p role="status" className="text-body text-app-secondary">{slowUpload ? t("kyc.uploadingSlow") : uploadingDocument
            ? t("kyc.uploadingDocument", { document: t(DOCUMENTS.find(document => document.key === uploadingDocument)?.label ?? "kyc.title") })
            : t("kyc.uploading")}</p>}
          <Button type="submit" fullWidth loading={uploading} disabled={!complete || uploading || uncertain}>{t("kyc.submit")}</Button>
          {!complete && <p className="text-center text-label text-app-secondary">{t("kyc.selectAll")}</p>}
        </form>
      </>}
      {kyc && !canShowForm && !submitted && kyc.kyc_status !== "verified" && kyc.kyc_status !== "pending" && !submissionPending &&
        <ErrorState message={t("kyc.statusError")} onRetry={() => status.refetch()} />}
      {kyc && !canShowForm && <Link to="/profile" className="inline-flex min-h-12 items-center text-body text-app-primary underline underline-offset-4">{t("kyc.backProfile")}</Link>}
    </div>
  </main>;
}

function DocumentPicker({ label, hint, file, uploaded, disabled, onSelect }: {
  label: string; hint: string; file: File | null; uploaded: boolean; disabled: boolean; onSelect: (file: File | null) => void;
}) {
  return <label className="flex min-h-20 cursor-pointer items-center gap-4 py-4 focus-within:outline focus-within:outline-2 focus-within:outline-app-accent">
    <span className="min-w-0 flex-1">
      <span className="block text-body font-semibold text-app-primary">{label}</span>
      <span className="block text-label text-app-secondary">{hint}</span>
      {file && <span className="mt-1 block truncate text-label text-app-primary" dir="auto">{file.name}</span>}
      {!file && uploaded && <span className="mt-1 block text-label text-app-success">✓</span>}
    </span>
    {file || uploaded ? <Check className="h-5 w-5 shrink-0 text-app-success" aria-hidden="true" /> : <Upload className="h-5 w-5 shrink-0 text-app-secondary" aria-hidden="true" />}
    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={disabled}
      onChange={event => { onSelect(event.target.files?.[0] ?? null); event.target.value = ""; }} />
  </label>;
}

function StatusMessage({ title, body, verified = false }: { title: string; body: string; verified?: boolean }) {
  return <section role="status" className="space-y-3 py-8">
    {verified ? <BadgeCheck className="h-8 w-8 text-app-success" aria-hidden="true" /> : <Clock3 className="h-8 w-8 text-app-secondary" aria-hidden="true" />}
    <h2 className="text-headline text-app-primary">{title}</h2>
    <p className="text-body text-app-secondary">{body}</p>
  </section>;
}
