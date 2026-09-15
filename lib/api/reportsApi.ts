import { apiRequest } from "./client";
import type {
  LocationCheckRequest,
  LocationCheckResponse,
  MyReportsFilters,
  MyReportsResult,
  ObserverInformationRequest,
  ObserverInformationResponseCreate,
  ObserverInformationResponseResult,
  ReportCompletenessRequest,
  ReportCompletenessResponse,
  ReportDetail,
  ReportReviewRequest,
  ReportReviewResponse,
  ReportSubmittedResult,
  ReportSubmissionPayload,
  ReportTimeline,
} from "./types";

export async function checkReportCompleteness(payload: ReportCompletenessRequest): Promise<ReportCompletenessResponse> {
  return apiRequest<ReportCompletenessResponse>({
    path: "/api/v1/reports/completeness-check",
    method: "POST",
    body: payload,
  });
}

export async function checkReportLocation(payload: LocationCheckRequest): Promise<LocationCheckResponse> {
  return apiRequest<LocationCheckResponse>({
    path: "/api/v1/reports/location-check",
    method: "POST",
    body: payload,
  });
}

export async function reviewReport(payload: ReportReviewRequest): Promise<ReportReviewResponse> {
  return apiRequest<ReportReviewResponse>({
    path: "/api/v1/reports/review",
    method: "POST",
    body: payload,
  });
}

export async function getMyReports(filters: MyReportsFilters = {}): Promise<MyReportsResult> {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.fromDate) query.set("fromDate", filters.fromDate);
  if (filters.toDate) query.set("toDate", filters.toDate);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.pageSize) query.set("pageSize", String(filters.pageSize));

  const queryString = query.toString();
  return apiRequest<MyReportsResult>({
    path: `/api/v1/reports/mine${queryString ? `?${queryString}` : ""}`,
  });
}

export async function getReportDetail(reportReference: string): Promise<ReportDetail> {
  return apiRequest<ReportDetail>({
    path: `/api/v1/reports/${encodeURIComponent(reportReference)}`,
  });
}

export async function getReportTimeline(reportReference: string): Promise<ReportTimeline> {
  return apiRequest<ReportTimeline>({
    path: `/api/v1/reports/${encodeURIComponent(reportReference)}/timeline`,
  });
}

export async function getOpenInformationRequest(
  reportReference: string,
): Promise<ObserverInformationRequest | null> {
  return apiRequest<ObserverInformationRequest | null>({
    path: `/api/v1/reports/${encodeURIComponent(reportReference)}/information-request`,
  });
}

export async function submitInformationResponse(
  reportReference: string,
  payload: ObserverInformationResponseCreate,
  photos: File[] = [],
): Promise<ObserverInformationResponseResult> {
  if (photos.length > 0) {
    const formData = new FormData();
    formData.set("payload", JSON.stringify(payload));
    for (const photo of photos) {
      formData.append("photos", photo);
    }

    return apiRequest<ObserverInformationResponseResult>({
      path: `/api/v1/reports/${encodeURIComponent(reportReference)}/information-response`,
      method: "POST",
      body: formData,
      timeoutMs: 60_000,
    });
  }

  return apiRequest<ObserverInformationResponseResult>({
    path: `/api/v1/reports/${encodeURIComponent(reportReference)}/information-response`,
    method: "POST",
    body: payload,
  });
}

export async function submitReport(
  payload: ReportSubmissionPayload,
  photos: File[],
): Promise<ReportSubmittedResult> {
  const formData = new FormData();
  formData.set("payload", JSON.stringify(payload));
  for (const photo of photos) {
    formData.append("photos", photo);
  }

  return apiRequest<ReportSubmittedResult>({
    path: "/api/v1/reports",
    method: "POST",
    body: formData,
    timeoutMs: 60_000,
  });
}
