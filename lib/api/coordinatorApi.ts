import { apiBlobRequest, apiRequest } from "./client";
import type {
  CaseClosureCreate,
  CaseClosureResult,
  CaseDecisionCreate,
  CaseDecisionResult,
  ClaimedCase,
  CoordinatorCase,
  CoordinatorQueueResult,
  EvidenceAssessmentCreate,
  EvidenceAssessmentResult,
  InformationRequestResult,
  StartReviewResult,
} from "./types";

export async function getCoordinatorQueue(
  page = 1,
  pageSize = 20,
): Promise<CoordinatorQueueResult> {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiRequest<CoordinatorQueueResult>({
    path: `/api/v1/coordinator/queue?${query.toString()}`,
  });
}

export async function claimReport(reportReference: string): Promise<ClaimedCase> {
  return apiRequest<ClaimedCase>({
    path: `/api/v1/coordinator/reports/${encodeURIComponent(reportReference)}/claim`,
    method: "POST",
  });
}

export async function getCoordinatorCase(reportReference: string): Promise<CoordinatorCase> {
  return apiRequest<CoordinatorCase>({
    path: `/api/v1/coordinator/reports/${encodeURIComponent(reportReference)}`,
  });
}

export async function startReview(reportReference: string): Promise<StartReviewResult> {
  return apiRequest<StartReviewResult>({
    path: `/api/v1/coordinator/reports/${encodeURIComponent(reportReference)}/start-review`,
    method: "POST",
  });
}

export async function recordEvidenceAssessment(
  reportReference: string,
  payload: EvidenceAssessmentCreate,
): Promise<EvidenceAssessmentResult> {
  return apiRequest<EvidenceAssessmentResult>({
    path: `/api/v1/coordinator/reports/${encodeURIComponent(reportReference)}/evidence-assessment`,
    method: "POST",
    body: payload,
  });
}

export async function getCoordinatorEvidence(
  reportReference: string,
  evidenceId: number,
): Promise<Blob> {
  return apiBlobRequest({
    path: `/api/v1/coordinator/reports/${encodeURIComponent(reportReference)}/evidence/${encodeURIComponent(String(evidenceId))}`,
    timeoutMs: 60_000,
  });
}

export async function requestMoreInformation(
  reportReference: string,
  reason: string,
): Promise<InformationRequestResult> {
  return apiRequest<InformationRequestResult>({
    path: `/api/v1/coordinator/reports/${encodeURIComponent(reportReference)}/information-request`,
    method: "POST",
    body: { reason },
  });
}

export async function recordCaseDecision(
  reportReference: string,
  payload: CaseDecisionCreate,
): Promise<CaseDecisionResult> {
  return apiRequest<CaseDecisionResult>({
    path: `/api/v1/coordinator/reports/${encodeURIComponent(reportReference)}/decision`,
    method: "POST",
    body: payload,
  });
}

export async function closeCase(
  reportReference: string,
  payload: CaseClosureCreate,
): Promise<CaseClosureResult> {
  return apiRequest<CaseClosureResult>({
    path: `/api/v1/coordinator/reports/${encodeURIComponent(reportReference)}/close`,
    method: "POST",
    body: payload,
  });
}
