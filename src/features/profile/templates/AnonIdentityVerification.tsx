import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, ChevronRight, Clock3, IdCard, ImagePlus, ScanLine, ShieldCheck, UserRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useT } from "@/i18n/I18nProvider";
import { DOCUMENTS, type IdentityVerificationModel } from "../useIdentityVerification";
import "./anon-kyc.css";

const ICONS = [IdCard, ScanLine, UserRound] as const;

export function AnonIdentityVerification({ model }: { model: IdentityVerificationModel }) {
  const t = useT();
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const { status, kyc, canShowForm, submissionPending, submitted, documents, alreadyUploaded, selectFile, complete, uploading, uncertain, error, slowUpload, uploadingDocument, submit, setUncertain, setError } = model;
  const locked = uploading || uncertain;
  const firstMissing = DOCUMENTS.findIndex(document => !documents[document.key] && !alreadyUploaded(document.apiType));
  const reachableStep = firstMissing === -1 ? 3 : firstMissing;
  const current = step < 3 ? DOCUMENTS[step] : null;
  const currentComplete = current ? Boolean(documents[current.key] || alreadyUploaded(current.apiType)) : complete;
  const pending = (kyc?.kyc_status === "pending" || submissionPending || submitted) && kyc?.kyc_status !== "verified";
  const verified = kyc?.kyc_status === "verified";
  const steps = [...DOCUMENTS.map(document => t(document.label)), t("anonKyc.review")];

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);

  return <main className="anon-kyc">
    <header className="anon-kyc-header"><Link to="/" aria-label={t("common.back")}><ArrowLeft className="rtl:rotate-180" size={21} aria-hidden="true" /></Link><span>{t("kyc.title")}</span><ShieldCheck size={21} aria-hidden="true" /></header>
    {status.isPending && <div className="anon-kyc-message" role="status">{t("common.loading")}</div>}
    {status.isError && !kyc && <div className="anon-kyc-message" role="alert"><p>{t("kyc.statusError")}</p><button type="button" className="anon-kyc-primary" onClick={() => void status.refetch()}>{t("common.retry")}</button></div>}
    {(verified || pending) && <section className="anon-kyc-status" role="status"><span className="anon-kyc-status-icon">{verified ? <BadgeCheck size={40} /> : <Clock3 size={40} />}</span><h1>{t(verified ? "kyc.verifiedTitle" : "kyc.pendingTitle")}</h1><p>{t(verified ? "kyc.verifiedBody" : "kyc.pendingBody")}</p><Link className="anon-kyc-primary" to="/">{t("nav.wallet")}</Link></section>}
    {canShowForm && <>
      <nav className="anon-kyc-progress" aria-label={t("anonKyc.steps")}>
        {steps.map((label, index) => <button type="button" key={label} disabled={locked || index > reachableStep} aria-current={step === index ? "step" : undefined} onClick={() => { setStep(index); setError(""); }}>
          <span>{index < 3 && (documents[DOCUMENTS[index].key] || alreadyUploaded(DOCUMENTS[index].apiType)) ? <Check size={16} aria-hidden="true" /> : index + 1}</span><small>{label}</small>
        </button>)}
      </nav>
      <section className="anon-kyc-step">
        <p className="anon-kyc-eyebrow">{t("anonKyc.step", { current: String(step + 1), total: "4" })}</p>
        <h1 ref={heading} tabIndex={-1}>{t(step === 3 ? "anonKyc.reviewTitle" : step === 0 ? "anonKyc.frontTitle" : step === 1 ? "anonKyc.backTitle" : "anonKyc.selfieTitle")}</h1>
        <p className="anon-kyc-intro">{t(step === 3 ? "anonKyc.reviewBody" : step === 0 ? "kyc.frontHint" : step === 1 ? "kyc.backHint" : "kyc.selfieHint")}</p>
        {kyc?.kyc_status === "rejected" && <p className="anon-kyc-feedback" role="status">{t("kyc.rejected")}{kyc.kyc_review_note && <> {kyc.kyc_review_note}</>}</p>}
        <form onSubmit={event => { if (step === 3) void submit(event); else event.preventDefault(); }}>
          {current ? <>
            <AnonDocumentPicker key={current.key} file={documents[current.key]} uploaded={alreadyUploaded(current.apiType)} label={t(current.label)} Icon={ICONS[step]} disabled={locked} onSelect={file => selectFile(current.key, file)} />
            <p className="anon-kyc-file-rules">{t("kyc.fileRules")}</p>
          </> : <div className="anon-kyc-review">
            {DOCUMENTS.map((document, index) => <div className="anon-kyc-review-row" key={document.key}>
              <DocumentImage file={documents[document.key]} Icon={ICONS[index]} label={t(document.label)} />
              <span><strong>{t(document.label)}</strong><small dir="auto">{documents[document.key]?.name ?? t(alreadyUploaded(document.apiType) ? "anonKyc.alreadyUploaded" : "anonKyc.imageMissing")}</small></span>
              <button type="button" disabled={locked} onClick={() => setStep(index)} aria-label={t("anonKyc.editDocument", { document: t(document.label) })}><ChevronRight size={20} className="rtl:rotate-180" aria-hidden="true" /></button>
            </div>)}
            <p className="anon-kyc-review-note"><ShieldCheck size={18} aria-hidden="true" />{t("anonKyc.submitNote")}</p>
          </div>}
          {error && <p className="anon-kyc-feedback" role="alert">{error.startsWith("kyc.") ? t(error) : error}</p>}
          {uncertain && <button type="button" className="anon-kyc-secondary" onClick={async () => {
            const latest = await status.refetch();
            if (!latest.isError) { setUncertain(false); setError(""); }
          }}>{t("kyc.refreshStatus")}</button>}
          {uploading && <p className="anon-kyc-upload-status" role="status">{slowUpload ? t("kyc.uploadingSlow") : uploadingDocument ? t("kyc.uploadingDocument", { document: t(DOCUMENTS.find(document => document.key === uploadingDocument)?.label ?? "kyc.title") }) : t("kyc.uploading")}</p>}
          <div className="anon-kyc-controls">
            {step > 0 && <button type="button" className="anon-kyc-secondary" disabled={locked} onClick={() => { setStep(value => value - 1); setError(""); }}><ArrowLeft size={18} className="rtl:rotate-180" />{t("common.back")}</button>}
            {step < 3 ? <button type="button" className="anon-kyc-primary" disabled={!currentComplete || locked} onClick={() => { setStep(value => value + 1); setError(""); }}>{t(step === 2 ? "anonKyc.review" : "common.continue")}<ArrowRight size={18} className="rtl:rotate-180" /></button> : <button type="submit" className="anon-kyc-primary" disabled={!complete || locked} aria-busy={uploading}>{t(uploading ? "kyc.uploading" : "kyc.submit")}</button>}
          </div>
        </form>
      </section>
    </>}
    {kyc && !canShowForm && !verified && !pending && <div className="anon-kyc-message" role="alert"><p>{t("kyc.statusError")}</p><button type="button" className="anon-kyc-secondary" onClick={() => void status.refetch()}>{t("common.retry")}</button></div>}
  </main>;
}

function useDocumentPreview(file: File | null) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!file) { setUrl(undefined); return; }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

function DocumentImage({ file, Icon, label }: { file: File | null; Icon: typeof IdCard; label: string }) {
  const url = useDocumentPreview(file);
  return <span className="anon-kyc-document-image">{url ? <img src={url} alt={label} /> : <Icon size={24} aria-hidden="true" />}</span>;
}

function AnonDocumentPicker({ file, uploaded, label, Icon, disabled, onSelect }: { file: File | null; uploaded: boolean; label: string; Icon: typeof IdCard; disabled: boolean; onSelect: (file: File | null) => void }) {
  const t = useT();
  const url = useDocumentPreview(file);
  return <div className="anon-kyc-document">
    <label className={`anon-kyc-picker${file || uploaded ? " anon-kyc-picker--ready" : ""}`}>
      {url ? <img src={url} alt={label} className="anon-kyc-preview" /> : <span className="anon-kyc-illustration"><Icon size={64} strokeWidth={1.3} aria-hidden="true" />{uploaded && <Check size={24} aria-hidden="true" />}</span>}
      <strong>{t(uploaded ? "anonKyc.alreadyUploaded" : file ? "anonKyc.replaceImage" : "anonKyc.chooseImage")}</strong>
      <small>{file ? file.name : label}</small>
      {!file && !uploaded && <ImagePlus size={20} aria-hidden="true" />}
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || uploaded} aria-label={label} onChange={event => { const file = event.target.files?.[0]; if (file) onSelect(file); event.target.value = ""; }} />
    </label>
    {file && !uploaded && <button type="button" className="anon-kyc-remove" disabled={disabled} onClick={() => onSelect(null)}><X size={16} aria-hidden="true" />{t("anonKyc.removeImage")}</button>}
  </div>;
}
