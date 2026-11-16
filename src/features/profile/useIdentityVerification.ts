import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { completeKycUpload, getKycStatus, startKycUpload, uploadKycDocument } from "@/api/kyc";
import { ApiError } from "@/api/types";
import { useAuth } from "@/state/AuthContext";

export type DocumentKey = "idFront" | "idBack" | "selfieWithId";
export type Documents = Record<DocumentKey, File | null>;
export type ApiDocumentType = "id_front" | "id_back" | "selfie_with_id";
const EMPTY_DOCUMENTS: Documents = { idFront: null, idBack: null, selfieWithId: null };
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const DOCUMENTS: Array<{ key: DocumentKey; apiType: ApiDocumentType; label: "kyc.front" | "kyc.back" | "kyc.selfie" }> = [
  { key: "idFront", apiType: "id_front", label: "kyc.front" },
  { key: "idBack", apiType: "id_back", label: "kyc.back" },
  { key: "selfieWithId", apiType: "selfie_with_id", label: "kyc.selfie" },
];

export function useIdentityVerification() {
  const { user, setUser } = useAuth();
  const status = useQuery({ queryKey: ["kyc-status"], queryFn: getKycStatus, staleTime: 0 });
  const [documents, setDocuments] = useState<Documents>(EMPTY_DOCUMENTS);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [slowUpload, setSlowUpload] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<DocumentKey | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [uncertain, setUncertain] = useState(false);

  useEffect(() => {
    if (!uploading) { setSlowUpload(false); return; }
    const timer = window.setTimeout(() => setSlowUpload(true), 5000);
    return () => window.clearTimeout(timer);
  }, [uploading]);

  const kyc = status.data;
  const latestSubmission = kyc?.latest_submission;
  const submissionPending = latestSubmission?.status === "pending_review";
  const canShowForm = (kyc?.kyc_status === "unsubmitted" || kyc?.kyc_status === "rejected") && !submissionPending && !submitted;
  const alreadyUploaded = (documentType: ApiDocumentType) => uploadedDocuments.includes(documentType)
    || latestSubmission?.uploaded_documents.includes(documentType) === true;
  const complete = DOCUMENTS.every(({ key, apiType }) => documents[key] || alreadyUploaded(apiType));

  const selectFile = (key: DocumentKey, file: File | null) => {
    setError("");
    if (!file) { setDocuments(current => ({ ...current, [key]: null })); return; }
    setDocuments(current => ({ ...current, [key]: null }));
    if (!IMAGE_TYPES.has(file.type)) { setError("kyc.fileType"); return; }
    if (file.size === 0) { setError("kyc.emptyFile"); return; }
    if (file.size > MAX_FILE_SIZE) { setError("kyc.fileSize"); return; }
    setDocuments(current => ({ ...current, [key]: file }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canShowForm || uncertain || !complete || uploading) return;
    const total = Object.values(documents).reduce((sum, file) => sum + (file?.size ?? 0), 0);
    if (total > MAX_TOTAL_SIZE) { setError("kyc.totalSize"); return; }
    setError("");
    setUploading(true);
    try {
      const started = await startKycUpload();
      let uploaded = started.submission.uploaded_documents;
      setUploadedDocuments(uploaded);
      for (const document of DOCUMENTS) {
        if (uploaded.includes(document.apiType)) continue;
        setUploadingDocument(document.key);
        const file = documents[document.key];
        if (!file) throw new Error("kyc_document_missing");
        const response = await uploadKycDocument(started.submission.id, document.apiType, file);
        uploaded = response.submission.uploaded_documents;
        setUploadedDocuments(uploaded);
      }
      const completed = await completeKycUpload(started.submission.id);
      setSubmitted(true);
      setDocuments(EMPTY_DOCUMENTS);
      setUploadedDocuments(completed.submission.uploaded_documents);
      if (user) setUser({ ...user, kyc_status: completed.kyc_status });
      void status.refetch();
    } catch (cause) {
      const latest = await status.refetch();
      if (latest.data?.kyc_status === "pending" || latest.data?.kyc_status === "verified") {
        setSubmitted(true);
        setDocuments(EMPTY_DOCUMENTS);
        if (user) setUser({ ...user, kyc_status: latest.data.kyc_status });
      } else if (latest.isError) {
        setUncertain(true);
        setError("kyc.confirmError");
      } else if (cause instanceof ApiError && cause.status === 413) {
        setError("kyc.totalSize");
      } else if (cause instanceof ApiError && cause.status === 429) {
        setError("kyc.rateLimit");
      } else {
        setError(cause instanceof ApiError ? cause.message : "kyc.submitError");
      }
    } finally {
      setUploading(false);
      setUploadingDocument(null);
    }
  };

  return { status, kyc, documents, error, setError, uploading, slowUpload, uploadingDocument, submitted, uncertain, setUncertain, submissionPending, canShowForm, alreadyUploaded, complete, selectFile, submit };
}

export type IdentityVerificationModel = ReturnType<typeof useIdentityVerification>;
