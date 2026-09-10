import { apiRequest } from "./client";
import type {
  MyReportsFilters,
  MyReportsResult,
  ReportDetail,
  ReportSubmittedResult,
  ReportSubmissionPayload,
  ReportTimeline,
} from "./types";

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
