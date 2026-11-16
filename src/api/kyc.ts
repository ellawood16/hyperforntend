import { http } from "@/lib/http";

export type KycStatus = "unsubmitted" | "pending" | "verified" | "rejected";

export type KycSubmission = {
  id: number;
  status: string;
  created_at: string;
  uploaded_documents: string[];
};

export type KycStatusResponse = {
  kyc_status: KycStatus;
  kyc_submitted_at: string | null;
  kyc_verified_at: string | null;
  kyc_reviewed_at: string | null;
  kyc_review_note: string;
  latest_submission: KycSubmission | null;
};

export function getKycStatus() {
  return http.get<KycStatusResponse>("/api/auth/kyc/status/");
}

export function submitKycDocuments(files: { idFront: File; idBack: File; selfieWithId: File }) {
  const form = new FormData();
  form.append("id_front", files.idFront);
  form.append("id_back", files.idBack);
  form.append("selfie_with_id", files.selfieWithId);
  return http.post<{ kyc_status: KycStatus; submission: KycSubmission }>("/api/auth/kyc/submit/", form);
}

export function startKycUpload() {
  return http.post<{ submission: KycSubmission }>("/api/auth/kyc/uploads/start/");
}

export function uploadKycDocument(submissionId: number, documentType: "id_front" | "id_back" | "selfie_with_id", file: File) {
  const form = new FormData();
  form.append("document", file);
  return http.post<{ submission: KycSubmission }>(`/api/auth/kyc/uploads/${submissionId}/${documentType}/`, form);
}

export function completeKycUpload(submissionId: number) {
  return http.post<{ kyc_status: KycStatus; submission: KycSubmission }>(`/api/auth/kyc/uploads/${submissionId}/complete/`);
}
